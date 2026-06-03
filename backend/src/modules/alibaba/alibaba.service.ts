// backend/src/modules/alibaba/alibaba.service.ts
/**
 * Alibaba service — varredura de encomendas Alibaba e aplicação ao stock (§10.12).
 *
 * INVARIANTES DE NEGÓCIO:
 *   - Stock incrementado EXATAMENTE uma vez por encomenda. Tripla guarda:
 *       1. gate de domínio (decideStatusChange): só em * → DELIVERED;
 *       2. AlibabaOrder.stockAppliedAt: salta o trabalho quando já aplicado;
 *       3. movimento ancorado em (kind=IN, refType=PURCHASE, refId=orderId, variantId)
 *          — verificado antes de criar, logo um retry nunca duplica.
 *   - Single-flight por org via pg_try_advisory_xact_lock (sem Redis): se outro sync
 *     da mesma org estiver a correr, este salta (skipped=true).
 *   - Multi-tenant: tudo filtrado por ctx.orgId. O payload remoto é não confiável —
 *     SKUs são resolvidos contra a DB; preços/ids remotos nunca são usados como FK.
 *
 * Trade-off: a varredura corre numa única transação (atómica + serializada pelo
 * lock). Um erro de DB aborta o sync inteiro e o próximo poll repete — seguro graças
 * à idempotência. Evolução de produção: BullMQ repeatable + isolamento por encomenda.
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';
import { decideStatusChange } from '../../domain/alibaba/sync.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { NotFoundError } from '../../shared/errors.js';
import { applyPurchaseInWithinTx } from '../stock/stock.service.js';

import type { AlibabaApiPort, RemoteAlibabaOrder } from './alibaba-api.port.js';
import { alibabaRepository } from './alibaba.repository.js';
import type { ListAlibabaQuery } from './alibaba.schemas.js';

export interface SyncMetrics {
  ordersChecked: number;
  ordersChanged: number;
  stockMovementsCreated: number;
  errors: number;
  /** Outro sync da org estava em curso; este não fez nada. */
  skipped: boolean;
  durationMs: number;
}

function toDate(iso: string | undefined): Date | null {
  return iso ? new Date(iso) : null;
}

/** Aplica os IN de UMA encomenda DELIVERED. Idempotente por (order, variant). */
async function applyOrderStockWithinTx(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  orderId: string,
  defaultLocationId: string | null,
): Promise<{ created: number; errors: number }> {
  const items = await tx.alibabaOrderItem.findMany({
    where: { organizationId: ctx.orgId, alibabaOrderId: orderId },
    select: { variantId: true, qty: true, batch: true, locationId: true },
  });

  let created = 0;
  let errors = 0;
  for (const item of items) {
    const locationId = item.locationId ?? defaultLocationId;
    if (!locationId) {
      errors++; // sem armazém de destino — não aplica; sync seguinte tenta de novo
      continue;
    }
    const existing = await tx.stockMovement.findFirst({
      where: {
        organizationId: ctx.orgId,
        kind: 'IN',
        refType: 'PURCHASE',
        refId: orderId,
        variantId: item.variantId,
      },
      select: { id: true },
    });
    if (existing) continue; // já aplicado — invariante exatamente-uma-vez

    await applyPurchaseInWithinTx(tx, ctx, {
      variantId: item.variantId,
      locationId,
      qty: item.qty,
      refId: orderId,
      batch: item.batch,
    });
    created++;
  }
  return { created, errors };
}

/** Upsert do cabeçalho + linhas (só linhas com SKU resolúvel). */
async function upsertOrderWithinTx(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  remote: RemoteAlibabaOrder,
): Promise<{ id: string; unresolved: number }> {
  const header = {
    status: remote.status,
    currency: remote.currency ?? null,
    placedAt: toDate(remote.placedAt),
    expectedArrival: toDate(remote.expectedArrival),
    deliveredAt: toDate(remote.deliveredAt),
    raw: remote as unknown as Prisma.InputJsonValue,
    lastSyncedAt: new Date(),
  };
  const order = await tx.alibabaOrder.upsert({
    where: {
      organizationId_externalId: { organizationId: ctx.orgId, externalId: remote.externalId },
    },
    create: { organizationId: ctx.orgId, externalId: remote.externalId, ...header },
    update: header,
    select: { id: true },
  });

  const skus = remote.items.map((i) => i.sku);
  const variants = await tx.productVariant.findMany({
    where: { organizationId: ctx.orgId, sku: { in: skus } },
    select: { id: true, sku: true },
  });
  const variantBySku = new Map(variants.map((v) => [v.sku, v.id]));

  let unresolved = 0;
  for (const item of remote.items) {
    const variantId = variantBySku.get(item.sku);
    if (!variantId) {
      unresolved++; // SKU desconhecido na org — linha ignorada
      continue;
    }
    const lineData = {
      qty: item.qty,
      unitCostEur: item.unitCostEur ?? null,
      batch: item.batch ?? null,
    };
    await tx.alibabaOrderItem.upsert({
      where: { alibabaOrderId_variantId: { alibabaOrderId: order.id, variantId } },
      create: { organizationId: ctx.orgId, alibabaOrderId: order.id, variantId, ...lineData },
      update: lineData,
    });
  }
  return { id: order.id, unresolved };
}

export const alibabaService = {
  list(ctx: AuthContext, query: ListAlibabaQuery) {
    return alibabaRepository.list({
      organizationId: ctx.orgId,
      status: query.status,
      take: query.take,
      skip: query.skip,
    });
  },

  async getById(ctx: AuthContext, id: string) {
    const order = await alibabaRepository.getById(ctx.orgId, id);
    if (!order) throw new NotFoundError('ALIBABA_ORDER_NOT_FOUND');
    return order;
  },

  async syncAndApplyToStock(ctx: AuthContext, api: AlibabaApiPort): Promise<SyncMetrics> {
    const startedAt = Date.now();

    const last = await prisma.alibabaOrder.findFirst({
      where: { organizationId: ctx.orgId },
      orderBy: { lastSyncedAt: 'desc' },
      select: { lastSyncedAt: true },
    });
    const remoteOrders = await api.listOrders({ since: last?.lastSyncedAt ?? null });

    let ordersChanged = 0;
    let stockMovementsCreated = 0;
    let errors = 0;

    const outcome = await prisma.$transaction(
      async (tx) => {
        // single-flight por org; libertado no commit/rollback
        const lockRows = await tx.$queryRaw<{ locked: boolean }[]>`
          SELECT pg_try_advisory_xact_lock(hashtextextended(${`alibaba-sync:${ctx.orgId}`}, 0)) AS locked
        `;
        if (!lockRows[0]?.locked) return { skipped: true };

        const defaultLocation = await tx.stockLocation.findFirst({
          where: { organizationId: ctx.orgId, isDefault: true, active: true },
          select: { id: true },
        });

        for (const remote of remoteOrders) {
          const local = await tx.alibabaOrder.findUnique({
            where: {
              organizationId_externalId: {
                organizationId: ctx.orgId,
                externalId: remote.externalId,
              },
            },
            select: { status: true, stockAppliedAt: true },
          });
          const decision = decideStatusChange(
            local?.status ?? null,
            remote.status,
            local?.stockAppliedAt != null,
          );

          const { id, unresolved } = await upsertOrderWithinTx(tx, ctx, remote);
          if (decision.changed) ordersChanged++;
          errors += unresolved;

          if (decision.shouldApplyStock) {
            const applied = await applyOrderStockWithinTx(tx, ctx, id, defaultLocation?.id ?? null);
            stockMovementsCreated += applied.created;
            errors += applied.errors;
            // só marca aplicado quando NADA ficou por aplicar (self-healing nos retries)
            if (applied.errors === 0 && unresolved === 0) {
              await tx.alibabaOrder.update({
                where: { id },
                data: { stockAppliedAt: new Date() },
              });
            }
          }
        }
        return { skipped: false };
      },
      { timeout: 30_000, maxWait: 10_000 },
    );

    return {
      ordersChecked: remoteOrders.length,
      ordersChanged: outcome.skipped ? 0 : ordersChanged,
      stockMovementsCreated: outcome.skipped ? 0 : stockMovementsCreated,
      errors: outcome.skipped ? 0 : errors,
      skipped: outcome.skipped,
      durationMs: Date.now() - startedAt,
    };
  },
};
