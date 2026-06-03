// backend/src/modules/alibaba/alibaba.repository.ts
/**
 * Alibaba repository — leituras Prisma, todas multi-tenant. Os writes do sync
 * vivem no service dentro de prisma.$transaction (como orders/returns).
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';

const itemInclude = {
  include: {
    variant: { select: { id: true, sku: true, label: true, productId: true } },
  },
} as const;

export interface ListAlibabaFilters {
  organizationId: string;
  status?: Prisma.AlibabaOrderWhereInput['status'];
  take: number;
  skip: number;
}

export const alibabaRepository = {
  async list(filters: ListAlibabaFilters) {
    const where: Prisma.AlibabaOrderWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.status ? { status: filters.status } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.alibabaOrder.findMany({
        where,
        include: { items: itemInclude, _count: { select: { items: true } } },
        orderBy: { lastSyncedAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.alibabaOrder.count({ where }),
    ]);
    return { items, total };
  },

  getById(organizationId: string, id: string) {
    return prisma.alibabaOrder.findFirst({
      where: { id, organizationId },
      include: { items: itemInclude },
    });
  },
};
