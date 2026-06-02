// backend/src/modules/returns/returns.service.ts
/**
 * Returns service — devoluções (§10.18), fatia de devoluções da Fase 3.
 *
 * Invariantes:
 *   - multi-tenant: todas as queries por ctx.orgId.
 *   - ABAC: SALES_REP só vê/abre devoluções de encomendas suas.
 *   - FSM própria (REQUESTED→RECEIVED→REFUNDED|REPLACED) em lockstep com a FSM da
 *     encomenda — o estado do CustomerOrder é espelhado via mirrorOrderStatusWithinTx.
 *   - stock: goods devolvidos entram SEMPRE em quarentena (RETURN) no receive; só
 *     viram available por restock aprovado (transfer) — scrap sai por OUT.
 *   - qty devolvida ≤ qty da encomenda; receive ≤ qty pedida.
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';
import { type OrderStatus } from '../../domain/orders/order-fsm.js';
import { assertReturnTransition, type ReturnStatus } from '../../domain/returns/return-fsm.js';
import { buildReturnNumber } from '../../domain/returns/return-number.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors.js';
import { hasAnyRole } from '../../shared/rbac.js';
import { writeAudit } from '../audit/audit.service.js';
import { ordersRepository } from '../orders/orders.repository.js';
import { mirrorOrderStatusWithinTx } from '../orders/orders.service.js';
import { stockRepository } from '../stock/stock.repository.js';
import {
  receiveReturnWithinTx,
  restockFromQuarantineWithinTx,
  scrapFromQuarantineWithinTx,
} from '../stock/stock.service.js';

import { returnsRepository, type ReturnWithLines } from './returns.repository.js';
import type {
  CreateReturnInput,
  DecideReturnInput,
  ListReturnsQuery,
  ReceiveReturnInput,
} from './returns.schemas.js';

const RETURN_NUMBER_MAX_ATTEMPTS = 5;

/** Estados de encomenda que admitem abertura de devolução (§10.14 few-shot 3). */
const RETURNABLE_ORDER_STATUSES = new Set(['SHIPPED', 'DELIVERED']);

export function scopeSalesRep(ctx: AuthContext): { salesRepId?: string } {
  if (hasAnyRole(ctx.role, ['SALES_MANAGER', 'ADMIN', 'OWNER'])) return {};
  if (ctx.role === 'SALES_REP') return { salesRepId: ctx.actorId };
  return {};
}

export function assertOrderReturnable(order: { status: string }): void {
  if (!RETURNABLE_ORDER_STATUSES.has(order.status)) {
    throw new ConflictError(
      'ORDER_NOT_RETURNABLE',
      'Só encomendas SHIPPED/DELIVERED admitem devolução.',
      { status: order.status },
    );
  }
}

export function assertReturnStatus(ret: { status: string }, expected: ReturnStatus): void {
  if (ret.status !== expected) {
    throw new ConflictError('RETURN_WRONG_STATUS', `Devolução tem de estar em ${expected}.`, {
      status: ret.status,
      expected,
    });
  }
}

/**
 * Valida as linhas de um pedido de devolução contra as linhas da encomenda:
 * sem duplicados, todas existem na encomenda, qty ≤ qty encomendada.
 */
export function assertReturnLinesAgainstOrder(
  lines: { variantId: string; qty: number }[],
  orderLines: { variantId: string; qty: number }[],
): void {
  const orderedByVariant = new Map(orderLines.map((l) => [l.variantId, l.qty]));
  const seen = new Set<string>();
  for (const l of lines) {
    if (seen.has(l.variantId)) {
      throw new ConflictError('RETURN_LINE_DUPLICATE', 'Variant repetido nas linhas.', {
        variantId: l.variantId,
      });
    }
    seen.add(l.variantId);
    const ordered = orderedByVariant.get(l.variantId);
    if (ordered === undefined) {
      throw new ValidationError('RETURN_LINE_NOT_IN_ORDER', 'Variant não pertence à encomenda.', {
        variantId: l.variantId,
      });
    }
    if (l.qty > ordered) {
      throw new ValidationError('RETURN_QTY_EXCEEDS_ORDER', 'qty a devolver excede a encomendada.', {
        variantId: l.variantId,
        ordered,
        requested: l.qty,
      });
    }
  }
}

export const returnsService = {
  list(ctx: AuthContext, query: ListReturnsQuery) {
    const scope = scopeSalesRep(ctx);
    return returnsRepository.list({
      organizationId: ctx.orgId,
      take: query.take,
      skip: query.skip,
      ...(query.status ? { status: query.status } : {}),
      ...(query.orderId ? { orderId: query.orderId } : {}),
      ...(scope.salesRepId ? { salesRepId: scope.salesRepId } : {}),
    });
  },

  async getById(ctx: AuthContext, id: string): Promise<ReturnWithLines> {
    const ret = await returnsRepository.findByIdWithLines(ctx.orgId, id);
    if (!ret) throw new NotFoundError('RETURN_NOT_FOUND');
    if (ctx.role === 'SALES_REP' && ret.order.salesRepId !== ctx.actorId) {
      throw new ForbiddenError('RETURN_NOT_ASSIGNED_TO_REP');
    }
    return ret;
  },

  async create(ctx: AuthContext, input: CreateReturnInput): Promise<ReturnWithLines> {
    const order = await ordersRepository.findByIdWithLines(ctx.orgId, input.orderId);
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND');
    if (ctx.role === 'SALES_REP' && order.salesRepId !== ctx.actorId) {
      throw new ForbiddenError('ORDER_NOT_ASSIGNED_TO_REP');
    }
    assertOrderReturnable(order);
    assertReturnLinesAgainstOrder(
      input.lines,
      order.lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
    );

    let lastErr: unknown;
    for (let attempt = 0; attempt < RETURN_NUMBER_MAX_ATTEMPTS; attempt++) {
      try {
        const id = await persistNewReturn(ctx, order, input);
        await writeAudit(ctx, 'return', id, 'CREATE', {
          orderId: order.id,
          lines: input.lines.length,
          reason: input.reason,
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
    throw new ConflictError('RETURN_NUMBER_COLLISION', 'Falha a gerar returnNumber único.', {
      attempts: RETURN_NUMBER_MAX_ATTEMPTS,
      cause: String(lastErr),
    });
  },

  async receive(ctx: AuthContext, id: string, input: ReceiveReturnInput): Promise<ReturnWithLines> {
    const ret = await this.getById(ctx, id);
    assertReturnStatus(ret, 'REQUESTED');

    const overrides = new Map(
      (input.lines ?? []).map((l) => [
        l.variantId,
        { qty: l.receivedQty, photos: l.photos, inspectionNotes: l.inspectionNotes },
      ]),
    );
    const retVariants = new Set(ret.lines.map((l) => l.variantId));
    for (const variantId of overrides.keys()) {
      if (!retVariants.has(variantId)) {
        throw new ValidationError('RETURN_LINE_NOT_FOUND', 'Variant não pertence à devolução.', {
          variantId,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      const quarantine = await stockRepository.findQuarantineLocation(tx, ctx.orgId);
      if (!quarantine) {
        throw new ConflictError(
          'NO_QUARANTINE_LOCATION',
          'A organização não tem armazém de quarentena ativo.',
        );
      }
      for (const line of ret.lines) {
        const override = overrides.get(line.variantId);
        const qty = override?.qty ?? line.qty;
        if (qty > line.qty) {
          throw new ValidationError('RETURN_RECEIVED_EXCEEDS_REQUESTED', 'Recebido > pedido.', {
            variantId: line.variantId,
            requested: line.qty,
            received: qty,
          });
        }
        await receiveReturnWithinTx(tx, ctx, {
          variantId: line.variantId,
          locationId: quarantine.id,
          qty,
          refId: ret.id,
        });
        const lineData: Prisma.ReturnLineUpdateInput = {
          ...(override && override.qty !== line.qty ? { qty: override.qty } : {}),
          ...(override?.photos ? { photos: override.photos } : {}),
          ...(override?.inspectionNotes !== undefined
            ? { inspectionNotes: override.inspectionNotes }
            : {}),
        };
        if (Object.keys(lineData).length > 0) {
          await tx.returnLine.update({ where: { id: line.id }, data: lineData });
        }
      }
      await tx.return.update({
        where: { id: ret.id },
        data: { status: 'RECEIVED', receivedAt: new Date() },
      });
      await mirrorOrderStatusWithinTx(
        tx,
        ctx,
        { id: ret.order.id, status: ret.order.status },
        'RETURN_RECEIVED',
      );
    });

    await writeAudit(ctx, 'return', id, 'STATUS_CHANGE', { from: 'REQUESTED', to: 'RECEIVED' });
    return this.getById(ctx, id);
  },

  async decide(ctx: AuthContext, id: string, input: DecideReturnInput): Promise<ReturnWithLines> {
    const ret = await this.getById(ctx, id);
    assertReturnStatus(ret, 'RECEIVED');
    // Belt-and-suspenders: a aresta RECEIVED→REFUNDED|REPLACED tem de ser válida.
    assertReturnTransition(ret.status, input.resolution);

    const dispositions = new Map((input.lines ?? []).map((l) => [l.variantId, l.disposition]));
    const retVariants = new Set(ret.lines.map((l) => l.variantId));
    for (const variantId of dispositions.keys()) {
      if (!retVariants.has(variantId)) {
        throw new ValidationError('RETURN_LINE_NOT_FOUND', 'Variant não pertence à devolução.', {
          variantId,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      const quarantine = await stockRepository.findQuarantineLocation(tx, ctx.orgId);
      if (!quarantine) {
        throw new ConflictError(
          'NO_QUARANTINE_LOCATION',
          'A organização não tem armazém de quarentena ativo.',
        );
      }
      const sellable = await stockRepository.findDefaultLocation(ctx.orgId);

      for (const line of ret.lines) {
        const disposition = dispositions.get(line.variantId) ?? 'RESTOCK';
        if (disposition === 'RESTOCK') {
          if (!sellable) {
            throw new ConflictError('NO_DEFAULT_LOCATION', 'Sem armazém default para repor stock.');
          }
          if (sellable.id === quarantine.id) {
            throw new ConflictError(
              'QUARANTINE_IS_DEFAULT',
              'O armazém de quarentena não pode ser o default.',
            );
          }
          await restockFromQuarantineWithinTx(tx, ctx, {
            variantId: line.variantId,
            fromLocationId: quarantine.id,
            toLocationId: sellable.id,
            qty: line.qty,
            refId: ret.id,
          });
        } else {
          await scrapFromQuarantineWithinTx(tx, ctx, {
            variantId: line.variantId,
            locationId: quarantine.id,
            qty: line.qty,
            refId: ret.id,
          });
        }
        await tx.returnLine.update({ where: { id: line.id }, data: { disposition } });
      }

      await tx.return.update({
        where: { id: ret.id },
        data: { status: input.resolution, decidedAt: new Date() },
      });
      await mirrorOrderStatusWithinTx(
        tx,
        ctx,
        { id: ret.order.id, status: ret.order.status },
        input.resolution,
      );
    });

    await writeAudit(ctx, 'return', id, 'STATUS_CHANGE', { from: 'RECEIVED', to: input.resolution });
    return this.getById(ctx, id);
  },
};

// ----------------------------------------------------------------------------
// Helpers internos
// ----------------------------------------------------------------------------

async function persistNewReturn(
  ctx: AuthContext,
  order: { id: string; status: OrderStatus },
  input: CreateReturnInput,
): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const year = new Date().getUTCFullYear();
    const count = await returnsRepository.countInYear(tx, ctx.orgId, year);
    const created = await tx.return.create({
      data: {
        organizationId: ctx.orgId,
        orderId: order.id,
        returnNumber: buildReturnNumber(year, count + 1),
        status: 'REQUESTED',
        reason: input.reason,
        actorId: ctx.actorId,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        lines: {
          create: input.lines.map((l) => ({
            organizationId: ctx.orgId,
            variantId: l.variantId,
            qty: l.qty,
            photos: l.photos ?? [],
          })),
        },
      },
    });
    await mirrorOrderStatusWithinTx(tx, ctx, { id: order.id, status: order.status }, 'RETURN_REQUESTED');
    return created.id;
  });
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
}
