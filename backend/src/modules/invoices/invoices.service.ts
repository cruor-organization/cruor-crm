// backend/src/modules/invoices/invoices.service.ts
/**
 * Invoices service — emissão ligada à FSM da encomenda + pagamentos manuais.
 *
 * INVARIANTES: uma fatura por encomenda (Invoice.orderId @unique); criação
 * idempotente; emissão (provider) corre FORA da transação da encomenda; número
 * fiscal sequencial por org/ano com collision-retry; pagamentos nunca excedem o
 * em aberto; multi-tenant em tudo.
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';
import { assertInvoiceTransition } from '../../domain/invoices/invoice-fsm.js';
import { buildInvoiceNumber } from '../../domain/invoices/invoice-number.js';
import { applyPayment } from '../../domain/invoices/payment.js';
import { invoiceTriggerFor } from '../../domain/invoices/trigger.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { writeAudit } from '../audit/audit.service.js';

import type { InvoiceProviderPort } from './invoice-provider.port.js';
import { invoicesRepository } from './invoices.repository.js';
import type { ListInvoicesQuery, RegisterPaymentInput } from './invoices.schemas.js';

const INVOICE_NUMBER_MAX_ATTEMPTS = 5;

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2002'
  );
}

/**
 * Cria a fatura PENDING da encomenda DENTRO da transação da transição, se o estado
 * alvo for o gatilho do cliente. Idempotente: uma fatura por encomenda.
 * Devolve o id da fatura (nova ou existente) ou null se não há nada a faturar.
 */
export async function ensureInvoiceForOrderWithinTx(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  orderId: string,
  toStatus: 'CONFIRMED' | 'SHIPPED',
): Promise<string | null> {
  const order = await tx.customerOrder.findFirst({
    where: { id: orderId, organizationId: ctx.orgId },
    select: {
      id: true,
      customerId: true,
      currency: true,
      subtotalEur: true,
      vatEur: true,
      totalEur: true,
      customer: { select: { paymentTermDays: true } },
      invoice: { select: { id: true } },
      lines: {
        select: {
          variantId: true,
          qty: true,
          unitPriceEur: true,
          discountPct: true,
          vatPct: true,
          lineTotalEur: true,
          variant: { select: { sku: true, label: true } },
        },
      },
    },
  });
  if (!order) return null;
  if (toStatus !== invoiceTriggerFor(order.customer.paymentTermDays)) return null;
  if (order.invoice) return order.invoice.id;

  const dueAt =
    order.customer.paymentTermDays > 0
      ? new Date(Date.now() + order.customer.paymentTermDays * 86_400_000)
      : null;

  const invoice = await tx.invoice.create({
    data: {
      organizationId: ctx.orgId,
      orderId: order.id,
      customerId: order.customerId,
      status: 'PENDING',
      currency: order.currency,
      subtotalEur: order.subtotalEur,
      vatEur: order.vatEur,
      totalEur: order.totalEur,
      paidEur: 0,
      dueAt,
      lines: {
        create: order.lines.map((l) => ({
          organizationId: ctx.orgId,
          variantId: l.variantId,
          description: `${l.variant.sku} — ${l.variant.label}`,
          qty: l.qty,
          unitPriceEur: l.unitPriceEur,
          discountPct: l.discountPct,
          vatPct: l.vatPct,
          lineTotalEur: l.lineTotalEur,
        })),
      },
    },
    select: { id: true },
  });

  await writeAudit(ctx, 'invoice', invoice.id, 'CREATE', {
    orderId: order.id,
    totalEur: Number(order.totalEur),
  });
  return invoice.id;
}

export const invoicesService = {
  list(ctx: AuthContext, query: ListInvoicesQuery) {
    return invoicesRepository.list({
      organizationId: ctx.orgId,
      status: query.status,
      customerId: query.customerId,
      take: query.take,
      skip: query.skip,
    });
  },

  async getById(ctx: AuthContext, id: string) {
    const invoice = await invoicesRepository.getById(ctx.orgId, id);
    if (!invoice) throw new NotFoundError('INVOICE_NOT_FOUND');
    return invoice;
  },

  /** Emite a fatura via provider (PENDING → ISSUED). Idempotente; best-effort. */
  async issue(ctx: AuthContext, invoiceId: string, provider: InvoiceProviderPort) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: ctx.orgId },
      select: { id: true, status: true, number: true, totalEur: true, currency: true },
    });
    if (!invoice) throw new NotFoundError('INVOICE_NOT_FOUND');
    if (invoice.status !== 'PENDING') return this.getById(ctx, invoiceId);
    assertInvoiceTransition('PENDING', 'ISSUED');

    // 1) Reservar o número fiscal ANTES de chamar o provider — assim o provider é
    //    chamado exatamente uma vez (uma colisão de número não pode reemitir o
    //    documento externo). Reutiliza o número se uma emissão anterior já o reservou.
    // TODO(invoices): numeração sem lacunas (SAFT-PT) exige advisory lock / tabela de
    //   sequência por (org, ano) sob concorrência — endurecer antes do provider real (Fase 4).
    let number = invoice.number;
    if (!number) {
      const year = new Date().getUTCFullYear();
      let lastErr: unknown;
      for (let attempt = 0; attempt < INVOICE_NUMBER_MAX_ATTEMPTS; attempt++) {
        const count = await invoicesRepository.countInvoicesForYear(ctx.orgId, year);
        const candidate = buildInvoiceNumber(year, count + 1 + attempt);
        try {
          await prisma.invoice.update({
            where: { id: invoice.id, organizationId: ctx.orgId },
            data: { number: candidate },
          });
          number = candidate;
          break;
        } catch (err) {
          if (isUniqueViolation(err)) {
            lastErr = err;
            continue;
          }
          throw err;
        }
      }
      if (!number) {
        throw new ConflictError('INVOICE_NUMBER_COLLISION', 'Falha a gerar número único.', {
          attempts: INVOICE_NUMBER_MAX_ATTEMPTS,
          cause: String(lastErr),
        });
      }
    }

    // 2) Emitir no provider exatamente uma vez, com o número já reservado.
    const { externalId, raw } = await provider.issue({
      invoiceId: invoice.id,
      number,
      totalEur: Number(invoice.totalEur),
      currency: invoice.currency,
    });

    // 3) Confirmar a emissão.
    await prisma.invoice.update({
      where: { id: invoice.id, organizationId: ctx.orgId },
      data: {
        status: 'ISSUED',
        externalId,
        provider: provider.name,
        raw: raw as Prisma.InputJsonValue,
        issuedAt: new Date(),
      },
    });
    await writeAudit(ctx, 'invoice', invoice.id, 'STATUS_CHANGE', { to: 'ISSUED', number });
    return this.getById(ctx, invoiceId);
  },

  /** Regista um pagamento manual; marca PAID quando cobre o total. */
  async registerPayment(ctx: AuthContext, invoiceId: string, input: RegisterPaymentInput) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, organizationId: ctx.orgId },
        select: { id: true, status: true, totalEur: true, paidEur: true },
      });
      if (!invoice) throw new NotFoundError('INVOICE_NOT_FOUND');
      if (invoice.status !== 'ISSUED') {
        throw new ConflictError('INVOICE_NOT_PAYABLE', 'Só faturas emitidas aceitam pagamento.', {
          status: invoice.status,
        });
      }
      const { paidEur, reachesPaid } = applyPayment(
        Number(invoice.totalEur),
        Number(invoice.paidEur),
        input.amountEur,
      );
      await tx.payment.create({
        data: {
          organizationId: ctx.orgId,
          invoiceId: invoice.id,
          amountEur: input.amountEur,
          method: input.method,
          ...(input.reference !== undefined ? { reference: input.reference } : {}),
          actorId: ctx.actorId,
        },
      });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { paidEur, ...(reachesPaid ? { status: 'PAID' } : {}) },
      });
      await writeAudit(ctx, 'invoice', invoice.id, reachesPaid ? 'STATUS_CHANGE' : 'UPDATE', {
        payment: input.amountEur,
        paidEur,
        ...(reachesPaid ? { to: 'PAID' } : {}),
      });
      return this.getById(ctx, invoiceId);
    });
  },

  /** Anula a fatura (PENDING|ISSUED → VOID). */
  async void(ctx: AuthContext, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: ctx.orgId },
      select: { id: true, status: true },
    });
    if (!invoice) throw new NotFoundError('INVOICE_NOT_FOUND');
    assertInvoiceTransition(invoice.status, 'VOID');
    await prisma.invoice.update({
      where: { id: invoice.id, organizationId: ctx.orgId },
      data: { status: 'VOID' },
    });
    await writeAudit(ctx, 'invoice', invoice.id, 'STATUS_CHANGE', { to: 'VOID' });
    return this.getById(ctx, invoiceId);
  },
};
