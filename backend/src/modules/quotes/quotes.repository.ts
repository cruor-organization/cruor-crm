// backend/src/modules/quotes/quotes.repository.ts
/**
 * Quotes repository — leituras Prisma do módulo, todas multi-tenant.
 * Writes transacionais vivem no service via prisma.$transaction (padrão orders).
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';

export interface ListQuotesFilters {
  organizationId: string;
  status?: Prisma.QuoteWhereInput['status'];
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

export const quotesRepository = {
  async list(filters: ListQuotesFilters) {
    const where: Prisma.QuoteWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.salesRepId ? { salesRepId: filters.salesRepId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: { customer: customerSelect, _count: { select: { lines: true } } },
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.quote.count({ where }),
    ]);
    return { items, total };
  },

  findByIdWithLines(organizationId: string, id: string) {
    return prisma.quote.findFirst({
      where: { id, organizationId },
      include: { customer: customerSelect, lines: lineInclude },
    });
  },

  /** Conta propostas da org criadas no ano (para o seq do quoteNumber). */
  countInYear(
    client: Prisma.TransactionClient | typeof prisma,
    organizationId: string,
    year: number,
  ): Promise<number> {
    return client.quote.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
      },
    });
  },
};

export type QuoteWithLines = NonNullable<
  Awaited<ReturnType<typeof quotesRepository.findByIdWithLines>>
>;
