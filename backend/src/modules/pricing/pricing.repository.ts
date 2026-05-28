import type { CustomerSpecialPrice, PriceList, PriceListLine, Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';

export interface ListPriceListsFilters {
  organizationId: string;
  tier?: Prisma.PriceListWhereInput['tier'];
  status?: Prisma.PriceListWhereInput['status'];
  take: number;
  skip: number;
}

export interface ListSpecialsFilters {
  organizationId: string;
  customerId?: string;
  variantId?: string;
  activeOnly: boolean;
  now: Date;
  take: number;
  skip: number;
}

export const pricingRepository = {
  // ----- PriceList -----

  async listPriceLists(
    filters: ListPriceListsFilters,
  ): Promise<{ items: (PriceList & { _count: { lines: number } })[]; total: number }> {
    const where: Prisma.PriceListWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.tier ? { tier: filters.tier } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.priceList.findMany({
        where,
        include: { _count: { select: { lines: true } } },
        orderBy: [{ status: 'asc' }, { validFrom: 'desc' }],
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.priceList.count({ where }),
    ]);
    return { items, total };
  },

  findPriceListById(
    organizationId: string,
    id: string,
  ): Promise<(PriceList & { _count: { lines: number } }) | null> {
    return prisma.priceList.findFirst({
      where: { id, organizationId },
      include: { _count: { select: { lines: true } } },
    });
  },

  findActivePriceListForTier(
    organizationId: string,
    tier: Prisma.PriceListWhereInput['tier'],
  ): Promise<PriceList | null> {
    return prisma.priceList.findFirst({
      where: { organizationId, tier, status: 'ACTIVE' },
    });
  },

  // ----- Lines -----

  async listLines(
    organizationId: string,
    priceListId: string,
  ): Promise<{
    items: (PriceListLine & {
      variant: { id: string; sku: string; label: string; product: { name: string } };
    })[];
  }> {
    const items = await prisma.priceListLine.findMany({
      where: { organizationId, priceListId },
      include: {
        variant: {
          select: {
            id: true,
            sku: true,
            label: true,
            product: { select: { name: true } },
          },
        },
      },
      orderBy: [{ variantId: 'asc' }, { minQty: 'asc' }],
    });
    return { items };
  },

  findLineById(organizationId: string, id: string): Promise<PriceListLine | null> {
    return prisma.priceListLine.findFirst({ where: { id, organizationId } });
  },

  /**
   * Melhor linha aplicável: variant correcto, qty >= minQty, dentro da lista activa,
   * maior `minQty` <= qty (já filtra os tiers de quantidade na DB).
   */
  findActiveTierLine(args: {
    organizationId: string;
    tier: Prisma.PriceListWhereInput['tier'];
    variantId: string;
    qty: number;
  }): Promise<PriceListLine | null> {
    return prisma.priceListLine.findFirst({
      where: {
        organizationId: args.organizationId,
        variantId: args.variantId,
        minQty: { lte: args.qty },
        priceList: { organizationId: args.organizationId, tier: args.tier, status: 'ACTIVE' },
      },
      orderBy: { minQty: 'desc' },
    });
  },

  // ----- Specials -----

  async listSpecials(filters: ListSpecialsFilters): Promise<{
    items: (CustomerSpecialPrice & {
      customer: { id: string; legalName: string; tradingName: string | null };
      variant: { id: string; sku: string; label: string; product: { name: string } };
    })[];
    total: number;
  }> {
    const where: Prisma.CustomerSpecialPriceWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.variantId ? { variantId: filters.variantId } : {}),
      ...(filters.activeOnly
        ? {
            validFrom: { lte: filters.now },
            OR: [{ validUntil: null }, { validUntil: { gt: filters.now } }],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.customerSpecialPrice.findMany({
        where,
        include: {
          customer: { select: { id: true, legalName: true, tradingName: true } },
          variant: {
            select: {
              id: true,
              sku: true,
              label: true,
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { validFrom: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.customerSpecialPrice.count({ where }),
    ]);
    return { items, total };
  },

  findSpecialById(organizationId: string, id: string): Promise<CustomerSpecialPrice | null> {
    return prisma.customerSpecialPrice.findFirst({ where: { id, organizationId } });
  },

  findActiveSpecial(args: {
    organizationId: string;
    customerId: string;
    variantId: string;
    now: Date;
  }): Promise<CustomerSpecialPrice | null> {
    return prisma.customerSpecialPrice.findFirst({
      where: {
        organizationId: args.organizationId,
        customerId: args.customerId,
        variantId: args.variantId,
        validFrom: { lte: args.now },
        OR: [{ validUntil: null }, { validUntil: { gt: args.now } }],
      },
      orderBy: { validFrom: 'desc' },
    });
  },
};
