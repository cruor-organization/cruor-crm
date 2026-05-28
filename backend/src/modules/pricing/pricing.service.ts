import type {
  CustomerSpecialPrice,
  PriceList,
  PriceListLine,
  PriceListStatus,
} from '@prisma/client';

import { prisma } from '../../db/index.js';
import { enforceFloor } from '../../domain/pricing/price-floor.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { writeAudit } from '../audit/audit.service.js';

import { pricingRepository } from './pricing.repository.js';
import type {
  CreatePriceListInput,
  CreatePriceListLineInput,
  CreateSpecialPriceInput,
  ListPriceListsQuery,
  ListSpecialsQuery,
  UpdatePriceListInput,
  UpdatePriceListLineInput,
  UpdateSpecialPriceInput,
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
   * Exige pelo menos 1 linha e revalida floor de todas (cobre alterações
   * de cost desde o draft).
   */
  async activatePriceList(ctx: AuthContext, id: string): Promise<PriceList> {
    const existing = await this.getPriceList(ctx, id);
    assertTransition(existing.status, 'ACTIVE');

    const lines = await prisma.priceListLine.findMany({
      where: { organizationId: ctx.orgId, priceListId: id },
      include: { variant: { select: { id: true, sku: true, costEur: true } } },
    });
    if (lines.length === 0)
      throw new ConflictError('PRICE_LIST_NO_LINES', 'Lista sem linhas não pode ser activada.');

    for (const line of lines) {
      const cost = line.variant.costEur ? Number(line.variant.costEur) : 0;
      try {
        enforceFloor(Number(line.unitPriceEur), cost);
      } catch (err) {
        if (err instanceof Error && 'code' in err && err.code === 'PRICE_BELOW_FLOOR') {
          throw new ConflictError(
            'PRICE_LIST_FLOOR_VIOLATION',
            `Linha ${line.variant.sku} viola o floor (cost × 1.10).`,
            { lineId: line.id, variantId: line.variant.id },
          );
        }
        throw err;
      }
    }

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

  // ----- Lines -----

  async listLines(ctx: AuthContext, priceListId: string) {
    await this.getPriceList(ctx, priceListId);
    return pricingRepository.listLines(ctx.orgId, priceListId);
  },

  async createLine(
    ctx: AuthContext,
    priceListId: string,
    input: CreatePriceListLineInput,
  ): Promise<PriceListLine> {
    const list = await this.getPriceList(ctx, priceListId);
    if (list.status === 'ARCHIVED')
      throw new ConflictError('PRICE_LIST_ARCHIVED', 'Lista arquivada é imutável.');

    await assertVariantFloor(ctx.orgId, input.variantId, input.unitPriceEur);

    const line = await prisma.priceListLine
      .create({
        data: {
          organizationId: ctx.orgId,
          priceListId,
          variantId: input.variantId,
          unitPriceEur: input.unitPriceEur,
          minQty: input.minQty,
          discountBreaks: input.discountBreaks,
        },
      })
      .catch((err: unknown) => {
        if (isUniqueViolation(err))
          throw new ConflictError(
            'PRICE_LIST_LINE_DUPLICATE',
            'Já existe linha para esse variant + minQty nesta lista.',
          );
        throw err;
      });
    await writeAudit(ctx, 'price_list_line', line.id, 'CREATE', {
      priceListId,
      variantId: input.variantId,
      unitPriceEur: input.unitPriceEur,
    });
    return line;
  },

  async updateLine(
    ctx: AuthContext,
    lineId: string,
    input: UpdatePriceListLineInput,
  ): Promise<PriceListLine> {
    const existing = await pricingRepository.findLineById(ctx.orgId, lineId);
    if (!existing) throw new NotFoundError('PRICE_LIST_LINE_NOT_FOUND');
    const list = await pricingRepository.findPriceListById(ctx.orgId, existing.priceListId);
    if (list?.status === 'ARCHIVED')
      throw new ConflictError('PRICE_LIST_ARCHIVED', 'Lista arquivada é imutável.');

    if (input.unitPriceEur !== undefined) {
      await assertVariantFloor(ctx.orgId, existing.variantId, input.unitPriceEur);
    }

    const updated = await prisma.priceListLine
      .update({
        where: { id: lineId },
        data: {
          ...(input.unitPriceEur !== undefined ? { unitPriceEur: input.unitPriceEur } : {}),
          ...(input.minQty !== undefined ? { minQty: input.minQty } : {}),
          ...(input.discountBreaks !== undefined ? { discountBreaks: input.discountBreaks } : {}),
        },
      })
      .catch((err: unknown) => {
        if (isUniqueViolation(err))
          throw new ConflictError(
            'PRICE_LIST_LINE_DUPLICATE',
            'minQty colide com outra linha do mesmo variant.',
          );
        throw err;
      });
    await writeAudit(ctx, 'price_list_line', lineId, 'UPDATE', input);
    return updated;
  },

  async deleteLine(ctx: AuthContext, lineId: string): Promise<void> {
    const existing = await pricingRepository.findLineById(ctx.orgId, lineId);
    if (!existing) throw new NotFoundError('PRICE_LIST_LINE_NOT_FOUND');
    const list = await pricingRepository.findPriceListById(ctx.orgId, existing.priceListId);
    if (list?.status === 'ARCHIVED')
      throw new ConflictError('PRICE_LIST_ARCHIVED', 'Lista arquivada é imutável.');
    await prisma.priceListLine.delete({ where: { id: lineId } });
    await writeAudit(ctx, 'price_list_line', lineId, 'DELETE', {
      priceListId: existing.priceListId,
    });
  },

  // ----- CustomerSpecialPrice -----

  listSpecials(ctx: AuthContext, query: ListSpecialsQuery) {
    return pricingRepository.listSpecials({
      organizationId: ctx.orgId,
      now: new Date(),
      take: query.take,
      skip: query.skip,
      activeOnly: query.activeOnly,
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.variantId ? { variantId: query.variantId } : {}),
    });
  },

  async createSpecial(
    ctx: AuthContext,
    input: CreateSpecialPriceInput,
  ): Promise<CustomerSpecialPrice> {
    await assertVariantFloor(ctx.orgId, input.variantId, input.unitPriceEur);

    const special = await prisma.customerSpecialPrice
      .create({
        data: {
          organizationId: ctx.orgId,
          customerId: input.customerId,
          variantId: input.variantId,
          unitPriceEur: input.unitPriceEur,
          validFrom: input.validFrom,
          validUntil: input.validUntil ?? null,
          reason: input.reason ?? null,
          createdById: ctx.actorId,
        },
      })
      .catch((err: unknown) => {
        if (isUniqueViolation(err))
          throw new ConflictError(
            'SPECIAL_PRICE_DUPLICATE',
            'Já existe preço especial para esse cliente + variant + validFrom.',
          );
        throw err;
      });
    await writeAudit(ctx, 'customer_special_price', special.id, 'CREATE', {
      customerId: special.customerId,
      variantId: special.variantId,
      unitPriceEur: input.unitPriceEur,
    });
    return special;
  },

  async updateSpecial(
    ctx: AuthContext,
    id: string,
    input: UpdateSpecialPriceInput,
  ): Promise<CustomerSpecialPrice> {
    const existing = await pricingRepository.findSpecialById(ctx.orgId, id);
    if (!existing) throw new NotFoundError('SPECIAL_PRICE_NOT_FOUND');

    if (input.unitPriceEur !== undefined) {
      await assertVariantFloor(ctx.orgId, existing.variantId, input.unitPriceEur);
    }

    const updated = await prisma.customerSpecialPrice.update({
      where: { id },
      data: {
        ...(input.unitPriceEur !== undefined ? { unitPriceEur: input.unitPriceEur } : {}),
        ...(input.validUntil !== undefined ? { validUntil: input.validUntil } : {}),
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
      },
    });
    await writeAudit(ctx, 'customer_special_price', id, 'UPDATE', input);
    return updated;
  },

  async deleteSpecial(ctx: AuthContext, id: string): Promise<void> {
    const existing = await pricingRepository.findSpecialById(ctx.orgId, id);
    if (!existing) throw new NotFoundError('SPECIAL_PRICE_NOT_FOUND');
    await prisma.customerSpecialPrice.delete({ where: { id } });
    await writeAudit(ctx, 'customer_special_price', id, 'DELETE', {
      customerId: existing.customerId,
      variantId: existing.variantId,
    });
  },
};

/** Lê variant.costEur e aplica enforceFloor; lança ValidationError('PRICE_BELOW_FLOOR'). */
async function assertVariantFloor(
  organizationId: string,
  variantId: string,
  unitPriceEur: number,
): Promise<void> {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, organizationId },
    select: { id: true, costEur: true },
  });
  if (!variant) throw new NotFoundError('VARIANT_NOT_FOUND');
  const cost = variant.costEur ? Number(variant.costEur) : 0;
  enforceFloor(unitPriceEur, cost);
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
}
