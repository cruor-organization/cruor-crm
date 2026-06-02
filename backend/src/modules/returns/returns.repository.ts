// backend/src/modules/returns/returns.repository.ts
/**
 * Returns repository — leituras Prisma do módulo, todas multi-tenant.
 * Os writes transacionais vivem no service via prisma.$transaction, como em orders.
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';

export interface ListReturnsFilters {
  organizationId: string;
  status?: Prisma.ReturnWhereInput['status'];
  orderId?: string;
  /** ABAC: SALES_REP só vê devoluções de encomendas suas (via order.salesRepId). */
  salesRepId?: string;
  take: number;
  skip: number;
}

const orderSelect = {
  select: { id: true, orderNumber: true, status: true, customerId: true, salesRepId: true },
} as const;

const lineInclude = {
  include: {
    variant: { select: { id: true, sku: true, label: true, productId: true } },
  },
} as const;

export const returnsRepository = {
  async list(filters: ListReturnsFilters) {
    const where: Prisma.ReturnWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.orderId ? { orderId: filters.orderId } : {}),
      ...(filters.salesRepId ? { order: { salesRepId: filters.salesRepId } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: { order: orderSelect, _count: { select: { lines: true } } },
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.return.count({ where }),
    ]);
    return { items, total };
  },

  findByIdWithLines(organizationId: string, id: string) {
    return prisma.return.findFirst({
      where: { id, organizationId },
      include: { order: orderSelect, lines: lineInclude },
    });
  },

  /** Conta devoluções da org criadas no ano (para o seq do returnNumber). */
  countInYear(
    client: Prisma.TransactionClient | typeof prisma,
    organizationId: string,
    year: number,
  ): Promise<number> {
    return client.return.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
      },
    });
  },
};

export type ReturnWithLines = NonNullable<
  Awaited<ReturnType<typeof returnsRepository.findByIdWithLines>>
>;
