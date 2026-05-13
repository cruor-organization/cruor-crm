import type { Customer, Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';

export interface ListFilters {
  organizationId: string;
  q?: string;
  status?: Prisma.CustomerWhereInput['status'];
  tier?: Prisma.CustomerWhereInput['pricingTier'];
  salesRepId?: string;
  take: number;
  skip: number;
}

export const customersRepository = {
  async list(filters: ListFilters): Promise<{ items: Customer[]; total: number }> {
    const where: Prisma.CustomerWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.tier ? { pricingTier: filters.tier } : {}),
      ...(filters.salesRepId ? { salesRepId: filters.salesRepId } : {}),
      ...(filters.q
        ? {
            OR: [
              { legalName: { contains: filters.q, mode: 'insensitive' } },
              { tradingName: { contains: filters.q, mode: 'insensitive' } },
              { taxId: { contains: filters.q, mode: 'insensitive' } },
              { email: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.customer.count({ where }),
    ]);
    return { items, total };
  },

  findById(organizationId: string, id: string): Promise<Customer | null> {
    return prisma.customer.findFirst({ where: { id, organizationId, deletedAt: null } });
  },

  create(data: Prisma.CustomerUncheckedCreateInput): Promise<Customer> {
    return prisma.customer.create({ data });
  },

  update(
    organizationId: string,
    id: string,
    data: Prisma.CustomerUncheckedUpdateInput,
  ): Promise<Prisma.BatchPayload> {
    return prisma.customer.updateMany({
      where: { id, organizationId, deletedAt: null },
      data,
    });
  },

  softDelete(organizationId: string, id: string): Promise<Prisma.BatchPayload> {
    return prisma.customer.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date(), status: 'BLOCKED' },
    });
  },
};
