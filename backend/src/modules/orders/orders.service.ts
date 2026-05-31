// backend/src/modules/orders/orders.service.ts
/**
 * Orders service — CRUD de encomendas em DRAFT (§10.14, fatia 1).
 *
 * Invariantes:
 *   - multi-tenant: todas as queries por ctx.orgId.
 *   - snapshots de preço por linha via pricingService.resolve (floor incluído).
 *   - totais recalculados no servidor a cada mutação (§9).
 *   - ABAC: SALES_REP só vê/edita encomendas dos seus clientes.
 *   - mutações só em DRAFT → ConflictError('ORDER_NOT_EDITABLE').
 *   - orderNumber: retry em loop externo à transação (P2002 aborta a tx no Postgres).
 */
import type { Prisma } from '@prisma/client';

import { prisma, PrismaNamespace } from '../../db/index.js';
import { assertTransition } from '../../domain/orders/order-fsm.js';
import { buildOrderNumber } from '../../domain/orders/order-number.js';
import { recomputeTotals } from '../../domain/orders/recompute-totals.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors.js';
import { hasAnyRole } from '../../shared/rbac.js';
import { writeAudit } from '../audit/audit.service.js';
import { pricingService } from '../pricing/pricing.service.js';
import { stockRepository } from '../stock/stock.repository.js';
import { releaseWithinTx, reserveWithinTx } from '../stock/stock.service.js';

import { ordersRepository, type OrderWithLines } from './orders.repository.js';
import type {
  AddOrderLineInput,
  CreateOrderInput,
  ListOrdersQuery,
  TransitionOrderInput,
  UpdateOrderInput,
  UpdateOrderLineInput,
} from './orders.schemas.js';

/** IVA snapshot da fatia 1. TODO(orders): IVA intracomunitário / isenção art.14 — fatia futura. */
const ORDER_VAT_PCT = 23;
const ORDER_NUMBER_MAX_ATTEMPTS = 5;

export interface ResolvedLine {
  variantId: string;
  qty: number;
  unitPriceEur: number;
  discountPct: number;
  vatPct: number;
  lineTotalEur: number;
  priceSource: string;
}

export function scopeForRole(ctx: AuthContext): { salesRepId?: string } {
  if (hasAnyRole(ctx.role, ['SALES_MANAGER', 'ADMIN', 'OWNER'])) return {};
  if (ctx.role === 'SALES_REP') return { salesRepId: ctx.actorId };
  return {};
}

export function assertDraft(order: { status: string }): void {
  if (order.status !== 'DRAFT') {
    throw new ConflictError('ORDER_NOT_EDITABLE', 'Só encomendas em DRAFT podem ser alteradas.', {
      status: order.status,
    });
  }
}

export const ordersService = {
  list(ctx: AuthContext, query: ListOrdersQuery) {
    const scope = scopeForRole(ctx);
    return ordersRepository.list({
      organizationId: ctx.orgId,
      take: query.take,
      skip: query.skip,
      ...(query.status ? { status: query.status } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(scope.salesRepId ? { salesRepId: scope.salesRepId } : {}),
    });
  },

  async getById(ctx: AuthContext, id: string): Promise<OrderWithLines> {
    const order = await ordersRepository.findByIdWithLines(ctx.orgId, id);
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND');
    if (ctx.role === 'SALES_REP' && order.salesRepId !== ctx.actorId) {
      throw new ForbiddenError('ORDER_NOT_ASSIGNED_TO_REP');
    }
    return order;
  },

  async create(ctx: AuthContext, input: CreateOrderInput): Promise<OrderWithLines> {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, organizationId: ctx.orgId, deletedAt: null },
      select: { id: true, salesRepId: true, status: true },
    });
    if (!customer) throw new NotFoundError('CUSTOMER_NOT_FOUND');
    if (ctx.role === 'SALES_REP' && customer.salesRepId !== ctx.actorId) {
      throw new ForbiddenError('CUSTOMER_NOT_ASSIGNED_TO_REP');
    }
    if (customer.status === 'BLOCKED') throw new ForbiddenError('CUSTOMER_BLOCKED');

    const resolvedLines = await resolveLines(ctx, customer.id, input.lines ?? []);
    assertNoDuplicateVariants(resolvedLines);
    const totals = recomputeTotals(resolvedLines);
    const orderSalesRepId = customer.salesRepId ?? ctx.actorId;

    let lastErr: unknown;
    for (let attempt = 0; attempt < ORDER_NUMBER_MAX_ATTEMPTS; attempt++) {
      try {
        const id = await persistNewOrder(ctx, {
          customerId: customer.id,
          salesRepId: orderSalesRepId,
          totals,
          resolvedLines,
          header: input,
        });
        await writeAudit(ctx, 'customer_order', id, 'CREATE', {
          customerId: customer.id,
          lines: resolvedLines.length,
          totalEur: totals.totalEur,
        });
        return this.getById(ctx, id);
      } catch (err) {
        if (isUniqueViolation(err)) {
          lastErr = err;
          continue;
        }
        throw err;
      }
    }
    throw new ConflictError('ORDER_NUMBER_COLLISION', 'Falha a gerar orderNumber único.', {
      attempts: ORDER_NUMBER_MAX_ATTEMPTS,
      cause: String(lastErr),
    });
  },

  async updateHeader(
    ctx: AuthContext,
    id: string,
    input: UpdateOrderInput,
  ): Promise<OrderWithLines> {
    const order = await this.getById(ctx, id);
    assertDraft(order);
    await prisma.customerOrder.update({
      where: { id },
      data: {
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.requestedDeliveryDate !== undefined
          ? { requestedDeliveryDate: input.requestedDeliveryDate }
          : {}),
        ...(input.shippingAddress !== undefined
          ? { shippingAddress: jsonOrNull(input.shippingAddress) }
          : {}),
      },
    });
    await writeAudit(ctx, 'customer_order', id, 'UPDATE', input);
    return this.getById(ctx, id);
  },

  async delete(ctx: AuthContext, id: string): Promise<void> {
    const order = await this.getById(ctx, id);
    assertDraft(order);
    await prisma.customerOrder.delete({ where: { id } });
    await writeAudit(ctx, 'customer_order', id, 'DELETE');
  },

  async addLine(
    ctx: AuthContext,
    orderId: string,
    input: AddOrderLineInput,
  ): Promise<OrderWithLines> {
    const order = await this.getById(ctx, orderId);
    assertDraft(order);
    if (order.lines.some((l) => l.variantId === input.variantId)) {
      throw new ConflictError('ORDER_LINE_DUPLICATE', 'Variant já presente na encomenda.', {
        variantId: input.variantId,
      });
    }
    const [resolved] = await resolveLines(ctx, order.customerId, [input]);
    await prisma.$transaction(async (tx) => {
      await tx.customerOrderLine.create({
        data: { organizationId: ctx.orgId, orderId, ...lineData(resolved!) },
      });
      await recomputeAndPersist(tx, ctx.orgId, orderId);
    });
    await writeAudit(ctx, 'customer_order', orderId, 'UPDATE', { addedVariant: input.variantId });
    return this.getById(ctx, orderId);
  },

  async updateLine(
    ctx: AuthContext,
    orderId: string,
    lineId: string,
    input: UpdateOrderLineInput,
  ): Promise<OrderWithLines> {
    const order = await this.getById(ctx, orderId);
    assertDraft(order);
    const existing = order.lines.find((l) => l.id === lineId);
    if (!existing) throw new NotFoundError('ORDER_LINE_NOT_FOUND');

    const qty = input.qty ?? existing.qty;
    const override = input.override ?? undefined; // null/undefined → re-resolve pelo motor
    const [resolved] = await resolveLines(ctx, order.customerId, [
      { variantId: existing.variantId, qty, ...(override != null ? { override } : {}) },
    ]);
    await prisma.$transaction(async (tx) => {
      await tx.customerOrderLine.update({ where: { id: lineId }, data: lineData(resolved!) });
      await recomputeAndPersist(tx, ctx.orgId, orderId);
    });
    await writeAudit(ctx, 'customer_order', orderId, 'UPDATE', { updatedLine: lineId });
    return this.getById(ctx, orderId);
  },

  async deleteLine(ctx: AuthContext, orderId: string, lineId: string): Promise<OrderWithLines> {
    const order = await this.getById(ctx, orderId);
    assertDraft(order);
    const existing = order.lines.find((l) => l.id === lineId);
    if (!existing) throw new NotFoundError('ORDER_LINE_NOT_FOUND');
    await prisma.$transaction(async (tx) => {
      await tx.customerOrderLine.delete({ where: { id: lineId } });
      await recomputeAndPersist(tx, ctx.orgId, orderId);
    });
    await writeAudit(ctx, 'customer_order', orderId, 'UPDATE', { removedLine: lineId });
    return this.getById(ctx, orderId);
  },

  async transition(
    ctx: AuthContext,
    id: string,
    input: TransitionOrderInput,
  ): Promise<OrderWithLines> {
    const order = await this.getById(ctx, id);
    assertTransition(order.status, input.to);

    await prisma.$transaction(async (tx) => {
      if (input.to === 'CONFIRMED') {
        await reserveOrderLines(tx, ctx, order);
      } else if (input.to === 'CANCELLED' && order.status === 'CONFIRMED') {
        await releaseOrderReserves(tx, ctx, order.id);
      }
      await tx.customerOrder.update({ where: { id }, data: { status: input.to } });
      await tx.orderStatusHistory.create({
        data: {
          organizationId: ctx.orgId,
          orderId: id,
          fromStatus: order.status,
          toStatus: input.to,
          actorId: ctx.actorId,
          ...(input.reason !== undefined ? { reason: input.reason } : {}),
        },
      });
    });

    await writeAudit(ctx, 'customer_order', id, 'STATUS_CHANGE', {
      from: order.status,
      to: input.to,
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
    });
    return this.getById(ctx, id);
  },
};

// ----------------------------------------------------------------------------
// Helpers internos
// ----------------------------------------------------------------------------

async function resolveLines(
  ctx: AuthContext,
  customerId: string,
  lines: { variantId: string; qty: number; override?: number }[],
): Promise<ResolvedLine[]> {
  return Promise.all(
    lines.map(async (l) => {
      const price = await pricingService.resolve(ctx, {
        variantId: l.variantId,
        qty: l.qty,
        customerId,
        ...(l.override != null ? { override: l.override } : {}),
      });
      return {
        variantId: l.variantId,
        qty: l.qty,
        unitPriceEur: price.unitPriceEur,
        discountPct: price.appliedDiscountPct,
        vatPct: ORDER_VAT_PCT,
        lineTotalEur: price.lineTotalEur,
        priceSource: price.source,
      };
    }),
  );
}

export function assertNoDuplicateVariants(lines: ResolvedLine[]): void {
  const seen = new Set<string>();
  for (const l of lines) {
    if (seen.has(l.variantId)) {
      throw new ConflictError('ORDER_LINE_DUPLICATE', 'Variant repetido nas linhas.', {
        variantId: l.variantId,
      });
    }
    seen.add(l.variantId);
  }
}

function lineData(l: ResolvedLine): {
  variantId: string;
  qty: number;
  unitPriceEur: number;
  discountPct: number;
  vatPct: number;
  lineTotalEur: number;
  priceSource: string;
} {
  return {
    variantId: l.variantId,
    qty: l.qty,
    unitPriceEur: l.unitPriceEur,
    discountPct: l.discountPct,
    vatPct: l.vatPct,
    lineTotalEur: l.lineTotalEur,
    priceSource: l.priceSource,
  };
}

async function persistNewOrder(
  ctx: AuthContext,
  args: {
    customerId: string;
    salesRepId: string;
    totals: { subtotalEur: number; vatEur: number; totalEur: number };
    resolvedLines: ResolvedLine[];
    header: CreateOrderInput;
  },
): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const year = new Date().getUTCFullYear();
    const count = await ordersRepository.countInYear(tx, ctx.orgId, year);
    const order = await tx.customerOrder.create({
      data: {
        organizationId: ctx.orgId,
        orderNumber: buildOrderNumber(year, count + 1),
        customerId: args.customerId,
        salesRepId: args.salesRepId,
        status: 'DRAFT',
        subtotalEur: args.totals.subtotalEur,
        vatEur: args.totals.vatEur,
        totalEur: args.totals.totalEur,
        ...(args.header.notes !== undefined ? { notes: args.header.notes } : {}),
        ...(args.header.requestedDeliveryDate !== undefined
          ? { requestedDeliveryDate: args.header.requestedDeliveryDate }
          : {}),
        ...(args.header.shippingAddress !== undefined
          ? { shippingAddress: args.header.shippingAddress as Prisma.InputJsonValue }
          : {}),
        lines: {
          create: args.resolvedLines.map((l) => ({ organizationId: ctx.orgId, ...lineData(l) })),
        },
        history: {
          create: {
            organizationId: ctx.orgId,
            fromStatus: null,
            toStatus: 'DRAFT',
            actorId: ctx.actorId,
          },
        },
      },
    });
    return order.id;
  });
}

async function recomputeAndPersist(
  tx: Prisma.TransactionClient,
  organizationId: string,
  orderId: string,
): Promise<void> {
  const lines = await tx.customerOrderLine.findMany({ where: { organizationId, orderId } });
  const totals = recomputeTotals(
    lines.map((l) => ({ lineTotalEur: Number(l.lineTotalEur), vatPct: Number(l.vatPct) })),
  );
  await tx.customerOrder.update({ where: { id: orderId }, data: totals });
}

async function reserveOrderLines(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  order: OrderWithLines,
): Promise<void> {
  if (order.lines.length === 0) {
    throw new ValidationError(
      'ORDER_HAS_NO_LINES',
      'Não é possível confirmar uma encomenda sem linhas.',
    );
  }
  const location = await stockRepository.findDefaultLocation(ctx.orgId);
  if (!location) {
    throw new ConflictError('NO_DEFAULT_LOCATION', 'A organização não tem armazém default ativo.');
  }
  for (const line of order.lines) {
    await reserveWithinTx(tx, ctx, {
      variantId: line.variantId,
      locationId: location.id,
      qty: line.qty,
      refType: 'ORDER',
      refId: order.id,
    });
  }
}

async function releaseOrderReserves(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  orderId: string,
): Promise<void> {
  const reserves = await stockRepository.findActiveReservesForRef(tx, ctx.orgId, 'ORDER', orderId);
  for (const reserve of reserves) {
    await releaseWithinTx(tx, ctx, reserve);
  }
}

function jsonOrNull(
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | typeof PrismaNamespace.DbNull {
  return value == null ? PrismaNamespace.DbNull : (value as Prisma.InputJsonValue);
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
}
