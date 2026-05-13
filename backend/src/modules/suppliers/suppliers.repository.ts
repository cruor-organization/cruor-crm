/**
 * Repository — única camada que toca em Prisma. Todas as querys são
 * obrigatoriamente filtradas por `organizationId` (multi-tenant hard invariant).
 */
import type { Prisma, Supplier } from '@prisma/client';

import { prisma } from '../../db/index.js';

export interface ListFilters {
  organizationId: string;
  q?: string;
  type?: Prisma.SupplierWhereInput['type'];
  status?: string;
  take: number;
  skip: number;
}

export const suppliersRepository = {
  async list(filters: ListFilters): Promise<{ items: Supplier[]; total: number }> {
    const where: Prisma.SupplierWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: 'insensitive' } },
              { legalName: { contains: filters.q, mode: 'insensitive' } },
              { taxId: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.supplier.count({ where }),
    ]);
    return { items, total };
  },

  findById(organizationId: string, id: string): Promise<Supplier | null> {
    return prisma.supplier.findFirst({ where: { id, organizationId, deletedAt: null } });
  },

  create(data: Prisma.SupplierUncheckedCreateInput): Promise<Supplier> {
    return prisma.supplier.create({ data });
  },

  update(
    organizationId: string,
    id: string,
    data: Prisma.SupplierUncheckedUpdateInput,
  ): Promise<Prisma.BatchPayload> {
    return prisma.supplier.updateMany({
      where: { id, organizationId, deletedAt: null },
      data,
    });
  },

  softDelete(organizationId: string, id: string): Promise<Prisma.BatchPayload> {
    return prisma.supplier.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  },
};
