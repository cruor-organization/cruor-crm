// backend/src/modules/invoices/invoices.repository.ts
/**
 * Invoices repository — leituras Prisma multi-tenant. Os writes transacionais
 * vivem no service. `getCreditUsed` calcula a exposição a recebimentos em aberto.
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';

const lineInclude = {
  include: {
    variant: { select: { id: true, sku: true, label: true } },
  },
} as const;

export interface ListInvoiceFilters {
  organizationId: string;
  status?: Prisma.InvoiceWhereInput['status'];
  customerId?: string;
  take: number;
  skip: number;
}

export const invoicesRepository = {
  async list(filters: ListInvoiceFilters) {
    const where: Prisma.InvoiceWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { _count: { select: { lines: true, payments: true } } },
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.invoice.count({ where }),
    ]);
    return { items, total };
  },

  getById(organizationId: string, id: string) {
    return prisma.invoice.findFirst({
      where: { id, organizationId },
      include: { lines: lineInclude, payments: true },
    });
  },

  /**
   * Exposição de crédito do cliente: outstanding em invoices ISSUED (não PAID/VOID)
   * + totais de encomendas comprometidas ainda sem fatura.
   */
  async getCreditUsed(organizationId: string, customerId: string): Promise<number> {
    // Faturas em aberto: PENDING conta tanto quanto ISSUED — uma emissão best-effort
    // que falhou deixa a fatura PENDING, mas a dívida existe na mesma. Excluí-la
    // sub-contaria a exposição e deixaria passar encomendas acima do limite.
    const open = await prisma.invoice.findMany({
      where: { organizationId, customerId, status: { in: ['PENDING', 'ISSUED'] } },
      select: { totalEur: true, paidEur: true },
    });
    const outstanding = open.reduce(
      (acc, i) => acc + (Number(i.totalEur) - Number(i.paidEur)),
      0,
    );
    // Encomendas comprometidas ainda SEM fatura (disjunto do bloco acima).
    const committed = await prisma.customerOrder.findMany({
      where: {
        organizationId,
        customerId,
        status: { in: ['CONFIRMED', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED'] },
        invoice: { is: null },
      },
      select: { totalEur: true },
    });
    const uninvoiced = committed.reduce((acc, o) => acc + Number(o.totalEur), 0);
    return outstanding + uninvoiced;
  },

  countInvoicesForYear(organizationId: string, year: number): Promise<number> {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    return prisma.invoice.count({
      where: {
        organizationId,
        number: { not: null },
        issuedAt: { gte: start, lt: end },
      },
    });
  },
};
