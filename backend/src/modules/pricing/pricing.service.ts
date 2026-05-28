import type { PriceList, PriceListStatus } from '@prisma/client';

import { prisma } from '../../db/index.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { writeAudit } from '../audit/audit.service.js';

import { pricingRepository } from './pricing.repository.js';
import type {
  CreatePriceListInput,
  ListPriceListsQuery,
  UpdatePriceListInput,
} from './pricing.schemas.js';

/**
 * FSM do PriceList: DRAFT → ACTIVE → ARCHIVED.
 * Salto DRAFT → ARCHIVED é permitido (descartar rascunho).
 */
export function assertTransition(from: PriceListStatus, to: PriceListStatus): void {
  const ok =
    (from === 'DRAFT' && to === 'ACTIVE') ||
    (from === 'DRAFT' && to === 'ARCHIVED') ||
    (from === 'ACTIVE' && to === 'ARCHIVED');
  if (!ok) {
    throw new ConflictError(
      'PRICE_LIST_INVALID_TRANSITION',
      `Transição ${from} → ${to} inválida.`,
      {
        from,
        to,
      },
    );
  }
}

export const pricingService = {
  listPriceLists(ctx: AuthContext, query: ListPriceListsQuery) {
    return pricingRepository.listPriceLists({
      organizationId: ctx.orgId,
      take: query.take,
      skip: query.skip,
      ...(query.tier ? { tier: query.tier } : {}),
      ...(query.status ? { status: query.status } : {}),
    });
  },

  async getPriceList(ctx: AuthContext, id: string) {
    const list = await pricingRepository.findPriceListById(ctx.orgId, id);
    if (!list) throw new NotFoundError('PRICE_LIST_NOT_FOUND');
    return list;
  },

  async createPriceList(ctx: AuthContext, input: CreatePriceListInput): Promise<PriceList> {
    const list = await prisma.priceList
      .create({
        data: {
          organizationId: ctx.orgId,
          name: input.name,
          tier: input.tier,
          currency: input.currency,
          validFrom: input.validFrom,
          validUntil: input.validUntil ?? null,
          status: 'DRAFT',
        },
      })
      .catch((err: unknown) => {
        if (isUniqueViolation(err))
          throw new ConflictError(
            'PRICE_LIST_DUPLICATE',
            'Já existe lista para esse tier + validFrom.',
          );
        throw err;
      });
    await writeAudit(ctx, 'price_list', list.id, 'CREATE', {
      name: list.name,
      tier: list.tier,
      validFrom: list.validFrom,
    });
    return list;
  },

  async updatePriceList(
    ctx: AuthContext,
    id: string,
    input: UpdatePriceListInput,
  ): Promise<PriceList> {
    const existing = await this.getPriceList(ctx, id);
    if (existing.status === 'ARCHIVED')
      throw new ConflictError('PRICE_LIST_ARCHIVED', 'Lista arquivada é imutável.');
    const updated = await prisma.priceList.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.validUntil !== undefined ? { validUntil: input.validUntil } : {}),
      },
    });
    await writeAudit(ctx, 'price_list', id, 'UPDATE', input);
    return updated;
  },

  /**
   * DRAFT → ACTIVE em transação. Se já existir ACTIVE no mesmo tier,
   * arquiva a anterior (status=ARCHIVED, validUntil=now) antes de activar.
   * Exige pelo menos 1 linha; a revalidação de floor por linha vem na S3.
   */
  async activatePriceList(ctx: AuthContext, id: string): Promise<PriceList> {
    const existing = await this.getPriceList(ctx, id);
    assertTransition(existing.status, 'ACTIVE');

    const lineCount = await prisma.priceListLine.count({
      where: { organizationId: ctx.orgId, priceListId: id },
    });
    if (lineCount === 0)
      throw new ConflictError('PRICE_LIST_NO_LINES', 'Lista sem linhas não pode ser activada.');

    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const prior = await tx.priceList.findFirst({
        where: { organizationId: ctx.orgId, tier: existing.tier, status: 'ACTIVE', NOT: { id } },
      });
      if (prior) {
        await tx.priceList.update({
          where: { id: prior.id },
          data: { status: 'ARCHIVED', validUntil: now },
        });
      }
      const activated = await tx.priceList.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });
      return { activated, priorId: prior?.id ?? null };
    });

    await writeAudit(ctx, 'price_list', id, 'STATUS_CHANGE', {
      from: existing.status,
      to: 'ACTIVE',
    });
    if (result.priorId) {
      await writeAudit(ctx, 'price_list', result.priorId, 'STATUS_CHANGE', {
        from: 'ACTIVE',
        to: 'ARCHIVED',
        reason: 'AUTO_ARCHIVED_BY_NEW_ACTIVE',
      });
    }
    return result.activated;
  },

  async archivePriceList(ctx: AuthContext, id: string): Promise<PriceList> {
    const existing = await this.getPriceList(ctx, id);
    assertTransition(existing.status, 'ARCHIVED');
    const updated = await prisma.priceList.update({
      where: { id },
      data: { status: 'ARCHIVED', validUntil: new Date() },
    });
    await writeAudit(ctx, 'price_list', id, 'STATUS_CHANGE', {
      from: existing.status,
      to: 'ARCHIVED',
    });
    return updated;
  },

  async deletePriceList(ctx: AuthContext, id: string): Promise<void> {
    const existing = await this.getPriceList(ctx, id);
    if (existing.status !== 'DRAFT')
      throw new ConflictError(
        'PRICE_LIST_NOT_DELETABLE',
        'Só listas em DRAFT podem ser apagadas; usa arquivar.',
      );
    await prisma.priceList.delete({ where: { id } });
    await writeAudit(ctx, 'price_list', id, 'DELETE');
  },
};

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
}
