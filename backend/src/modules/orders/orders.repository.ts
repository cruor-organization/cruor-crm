// backend/src/modules/orders/orders.repository.ts
/**
 * Orders repository — leituras Prisma do módulo, todas multi-tenant.
 * Os writes transacionais (create/update/delete) vivem no service via
 * prisma.$transaction, seguindo o padrão de customersService/pricingService.
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';

export interface ListOrdersFilters {
  organizationId: string;
  status?: Prisma.CustomerOrderWhereInput['status'];
  customerId?: string;
  salesRepId?: string;
  take: number;
  skip: number;
}

const customerSelect = {
  select: { id: true, legalName: true, tradingName: true },
} as const;

const lineInclude = {
  include: {
    variant: { select: { id: true, sku: true, label: true, productId: true } },
  },
} as const;

export const ordersRepository = {
  async list(filters: ListOrdersFilters) {
    const where: Prisma.CustomerOrderWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.salesRepId ? { salesRepId: filters.salesRepId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.customerOrder.findMany({
        where,
        include: { customer: customerSelect, _count: { select: { lines: true } } },
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.customerOrder.count({ where }),
    ]);
    return { items, total };
  },

  findByIdWithLines(organizationId: string, id: string) {
    return prisma.customerOrder.findFirst({
      where: { id, organizationId },
      include: { customer: customerSelect, lines: lineInclude },
    });
  },

  findLineById(organizationId: string, id: string) {
    return prisma.customerOrderLine.findFirst({ where: { id, organizationId } });
  },

  /** Conta encomendas da org criadas no ano (para o seq do orderNumber). */
  countInYear(
    client: Prisma.TransactionClient | typeof prisma,
    organizationId: string,
    year: number,
  ): Promise<number> {
    return client.customerOrder.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
      },
    });
  },
};

export type OrderWithLines = NonNullable<
  Awaited<ReturnType<typeof ordersRepository.findByIdWithLines>>
>;
