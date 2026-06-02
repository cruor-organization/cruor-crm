// backend/src/modules/quotes/quotes.service.ts
/**
 * Quotes service — propostas comerciais (§7 "Quote"), fatia Quote da Fase 3.
 *
 * Invariantes:
 *   - multi-tenant: todas as queries por ctx.orgId.
 *   - ABAC: SALES_REP só vê/edita propostas suas (reutiliza scopeForRole de orders).
 *   - snapshots de preço por linha via pricingService.resolve (floor incluído).
 *   - totais recalculados no servidor a cada mutação (§9).
 *   - mutações de cabeçalho só em DRAFT.
 *   - FSM própria; ACCEPTED converte em CustomerOrder DRAFT transportando os snapshots.
 *   - sem efeito de stock — a reserva continua a acontecer no CONFIRMED da encomenda.
 */
import { prisma } from '../../db/index.js';
import { buildOrderNumber } from '../../domain/orders/order-number.js';
import { recomputeTotals } from '../../domain/orders/recompute-totals.js';
import { assertQuoteTransition } from '../../domain/quotes/quote-fsm.js';
import { buildQuoteNumber } from '../../domain/quotes/quote-number.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { writeAudit } from '../audit/audit.service.js';
import { ordersRepository } from '../orders/orders.repository.js';
import {
  assertNoDuplicateVariants,
  scopeForRole,
  type ResolvedLine,
} from '../orders/orders.service.js';
import { pricingService } from '../pricing/pricing.service.js';

import { quotesRepository, type QuoteWithLines } from './quotes.repository.js';
import type {
  CreateQuoteInput,
  ListQuotesQuery,
  TransitionQuoteInput,
  UpdateQuoteInput,
} from './quotes.schemas.js';

/** IVA snapshot (igual à fatia 1 de encomendas). */
const QUOTE_VAT_PCT = 23;
const QUOTE_NUMBER_MAX_ATTEMPTS = 5;
const ORDER_NUMBER_MAX_ATTEMPTS = 5;

export function assertQuoteDraft(quote: { status: string }): void {
  if (quote.status !== 'DRAFT') {
    throw new ConflictError('QUOTE_NOT_EDITABLE', 'Só propostas em DRAFT podem ser alteradas.', {
      status: quote.status,
    });
  }
}

export const quotesService = {
  list(ctx: AuthContext, query: ListQuotesQuery) {
    const scope = scopeForRole(ctx);
    return quotesRepository.list({
      organizationId: ctx.orgId,
      take: query.take,
      skip: query.skip,
      ...(query.status ? { status: query.status } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(scope.salesRepId ? { salesRepId: scope.salesRepId } : {}),
    });
  },

  async getById(ctx: AuthContext, id: string): Promise<QuoteWithLines> {
    const quote = await quotesRepository.findByIdWithLines(ctx.orgId, id);
    if (!quote) throw new NotFoundError('QUOTE_NOT_FOUND');
    if (ctx.role === 'SALES_REP' && quote.salesRepId !== ctx.actorId) {
      throw new ForbiddenError('QUOTE_NOT_ASSIGNED_TO_REP');
    }
    return quote;
  },

  async create(ctx: AuthContext, input: CreateQuoteInput): Promise<QuoteWithLines> {
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
    const quoteSalesRepId = customer.salesRepId ?? ctx.actorId;

    let lastErr: unknown;
    for (let attempt = 0; attempt < QUOTE_NUMBER_MAX_ATTEMPTS; attempt++) {
      try {
        const id = await persistNewQuote(ctx, {
          customerId: customer.id,
          salesRepId: quoteSalesRepId,
          totals,
          resolvedLines,
          header: input,
        });
        await writeAudit(ctx, 'quote', id, 'CREATE', {
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
    throw new ConflictError('QUOTE_NUMBER_COLLISION', 'Falha a gerar quoteNumber único.', {
      attempts: QUOTE_NUMBER_MAX_ATTEMPTS,
      cause: String(lastErr),
    });
  },

  async updateHeader(ctx: AuthContext, id: string, input: UpdateQuoteInput): Promise<QuoteWithLines> {
    const quote = await this.getById(ctx, id);
    assertQuoteDraft(quote);
    await prisma.quote.update({
      where: { id },
      data: {
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.validUntil !== undefined ? { validUntil: input.validUntil } : {}),
      },
    });
    await writeAudit(ctx, 'quote', id, 'UPDATE', input);
    return this.getById(ctx, id);
  },

  async delete(ctx: AuthContext, id: string): Promise<void> {
    const quote = await this.getById(ctx, id);
    assertQuoteDraft(quote);
    await prisma.quote.delete({ where: { id } });
    await writeAudit(ctx, 'quote', id, 'DELETE');
  },

  async transition(
    ctx: AuthContext,
    id: string,
    input: TransitionQuoteInput,
  ): Promise<QuoteWithLines> {
    const quote = await this.getById(ctx, id);
    assertQuoteTransition(quote.status, input.to);

    if (input.to === 'ACCEPTED') {
      return acceptAndConvert(ctx, quote);
    }

    await prisma.quote.update({ where: { id }, data: { status: input.to } });
    await writeAudit(ctx, 'quote', id, 'STATUS_CHANGE', {
      from: quote.status,
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
        vatPct: QUOTE_VAT_PCT,
        lineTotalEur: price.lineTotalEur,
        priceSource: price.source,
      };
    }),
  );
}

async function persistNewQuote(
  ctx: AuthContext,
  args: {
    customerId: string;
    salesRepId: string;
    totals: { subtotalEur: number; vatEur: number; totalEur: number };
    resolvedLines: ResolvedLine[];
    header: CreateQuoteInput;
  },
): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const year = new Date().getUTCFullYear();
    const count = await quotesRepository.countInYear(tx, ctx.orgId, year);
    const quote = await tx.quote.create({
      data: {
        organizationId: ctx.orgId,
        quoteNumber: buildQuoteNumber(year, count + 1),
        customerId: args.customerId,
        salesRepId: args.salesRepId,
        status: 'DRAFT',
        subtotalEur: args.totals.subtotalEur,
        vatEur: args.totals.vatEur,
        totalEur: args.totals.totalEur,
        ...(args.header.notes !== undefined ? { notes: args.header.notes } : {}),
        ...(args.header.validUntil !== undefined ? { validUntil: args.header.validUntil } : {}),
        lines: {
          create: args.resolvedLines.map((l) => ({
            organizationId: ctx.orgId,
            variantId: l.variantId,
            qty: l.qty,
            unitPriceEur: l.unitPriceEur,
            discountPct: l.discountPct,
            vatPct: l.vatPct,
            lineTotalEur: l.lineTotalEur,
            priceSource: l.priceSource,
          })),
        },
      },
    });
    return quote.id;
  });
}

/**
 * Aceita a proposta e converte em CustomerOrder DRAFT, transportando os snapshots de
 * preço das linhas (não reavalia preços). orderNumber com retry externo (P2002 aborta a tx).
 */
async function acceptAndConvert(ctx: AuthContext, quote: QuoteWithLines): Promise<QuoteWithLines> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < ORDER_NUMBER_MAX_ATTEMPTS; attempt++) {
    try {
      const orderId = await prisma.$transaction(async (tx) => {
        const year = new Date().getUTCFullYear();
        const count = await ordersRepository.countInYear(tx, ctx.orgId, year);
        const order = await tx.customerOrder.create({
          data: {
            organizationId: ctx.orgId,
            orderNumber: buildOrderNumber(year, count + 1),
            customerId: quote.customerId,
            ...(quote.salesRepId ? { salesRepId: quote.salesRepId } : {}),
            status: 'DRAFT',
            subtotalEur: quote.subtotalEur,
            vatEur: quote.vatEur,
            totalEur: quote.totalEur,
            ...(quote.notes != null ? { notes: quote.notes } : {}),
            lines: {
              create: quote.lines.map((l) => ({
                organizationId: ctx.orgId,
                variantId: l.variantId,
                qty: l.qty,
                unitPriceEur: l.unitPriceEur,
                discountPct: l.discountPct,
                vatPct: l.vatPct,
                lineTotalEur: l.lineTotalEur,
                priceSource: l.priceSource,
              })),
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
        await tx.quote.update({
          where: { id: quote.id },
          data: { status: 'ACCEPTED', convertedOrderId: order.id },
        });
        return order.id;
      });
      await writeAudit(ctx, 'quote', quote.id, 'STATUS_CHANGE', {
        from: quote.status,
        to: 'ACCEPTED',
        convertedOrderId: orderId,
      });
      await writeAudit(ctx, 'customer_order', orderId, 'CREATE', { fromQuote: quote.id });
      return quotesService.getById(ctx, quote.id);
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
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
}
