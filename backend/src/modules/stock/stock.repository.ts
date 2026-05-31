/**
 * Stock repository — única camada que toca em Prisma para stock.
 *
 * Multi-tenant: todas as querys filtram por `organizationId`.
 * Reservas usam `tx.$queryRaw` tagged template (auto-parametrizado, satisfaz
 * §9 "zero $queryRawUnsafe") para SELECT … FOR UPDATE.
 */
import type {
  Prisma,
  StockLevel,
  StockLocation,
  StockMovement,
  StockMovementRefType,
} from '@prisma/client';

import { prisma } from '../../db/index.js';

export interface ListLocationsFilters {
  organizationId: string;
  active?: boolean;
  take: number;
  skip: number;
}

export interface ListLevelsFilters {
  organizationId: string;
  variantId?: string;
  locationId?: string;
  belowSafety?: boolean;
  take: number;
  skip: number;
}

export interface ListMovementsFilters {
  organizationId: string;
  variantId?: string;
  locationId?: string;
  kind?: Prisma.StockMovementWhereInput['kind'];
  refType?: Prisma.StockMovementWhereInput['refType'];
  refId?: string;
  from?: Date;
  to?: Date;
  take: number;
  skip: number;
}

export interface LockedLevel {
  id: string;
  available: number;
  reserved: number;
}

export const stockRepository = {
  // ----- StockLocation -----

  async listLocations(filters: ListLocationsFilters) {
    const where: Prisma.StockLocationWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.active !== undefined ? { active: filters.active } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.stockLocation.findMany({
        where,
        orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.stockLocation.count({ where }),
    ]);
    return { items, total };
  },

  findLocationById(organizationId: string, id: string): Promise<StockLocation | null> {
    return prisma.stockLocation.findFirst({ where: { id, organizationId } });
  },

  findLocationByCode(organizationId: string, code: string): Promise<StockLocation | null> {
    return prisma.stockLocation.findFirst({ where: { organizationId, code } });
  },

  createLocation(data: Prisma.StockLocationUncheckedCreateInput): Promise<StockLocation> {
    return prisma.stockLocation.create({ data });
  },

  updateLocation(
    organizationId: string,
    id: string,
    data: Prisma.StockLocationUncheckedUpdateInput,
  ): Promise<Prisma.BatchPayload> {
    return prisma.stockLocation.updateMany({
      where: { id, organizationId },
      data,
    });
  },

  // ----- StockLevel -----

  async listLevels(filters: ListLevelsFilters) {
    const where: Prisma.StockLevelWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.variantId ? { variantId: filters.variantId } : {}),
      ...(filters.locationId ? { locationId: filters.locationId } : {}),
    };
    const items = await prisma.stockLevel.findMany({
      where,
      include: {
        variant: { select: { id: true, sku: true, label: true, productId: true } },
        location: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ locationId: 'asc' }, { variantId: 'asc' }],
      take: filters.take,
      skip: filters.skip,
    });
    const filtered = filters.belowSafety ? items.filter((l) => l.available < l.safetyStock) : items;
    const total = await prisma.stockLevel.count({ where });
    return { items: filtered, total };
  },

  findLevel(
    organizationId: string,
    variantId: string,
    locationId: string,
  ): Promise<StockLevel | null> {
    return prisma.stockLevel.findFirst({
      where: { organizationId, variantId, locationId },
    });
  },

  /**
   * Garante que existe uma linha StockLevel (variant, location) com saldos a zero.
   * Idempotent — usa upsert sobre o índice único.
   *
   * Pode ser chamado fora ou dentro de uma transação (tx ?? prisma).
   */
  ensureLevel(
    tx: Prisma.TransactionClient | typeof prisma,
    organizationId: string,
    variantId: string,
    locationId: string,
  ): Promise<StockLevel> {
    return tx.stockLevel.upsert({
      where: { variantId_locationId: { variantId, locationId } },
      update: {},
      create: { organizationId, variantId, locationId },
    });
  },

  /**
   * Lock row-level via SELECT … FOR UPDATE. Tagged template — auto-parametrizado,
   * satisfaz §9 "zero $queryRawUnsafe".
   *
   * Devolve array vazio se a linha não existir (caller deve `ensureLevel` antes).
   */
  lockLevelForUpdate(
    tx: Prisma.TransactionClient,
    organizationId: string,
    variantId: string,
    locationId: string,
  ): Promise<LockedLevel[]> {
    return tx.$queryRaw<LockedLevel[]>`
      SELECT "id", "available", "reserved"
      FROM "stock_level"
      WHERE "variantId" = ${variantId}
        AND "locationId" = ${locationId}
        AND "organizationId" = ${organizationId}
      FOR UPDATE
    `;
  },

  // ----- StockMovement -----

  async listMovements(filters: ListMovementsFilters) {
    const where: Prisma.StockMovementWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.variantId ? { variantId: filters.variantId } : {}),
      ...(filters.locationId ? { locationId: filters.locationId } : {}),
      ...(filters.kind ? { kind: filters.kind } : {}),
      ...(filters.refType ? { refType: filters.refType } : {}),
      ...(filters.refId ? { refId: filters.refId } : {}),
      ...(filters.from || filters.to
        ? {
            occurredAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.stockMovement.count({ where }),
    ]);
    return { items, total };
  },

  findMovementById(organizationId: string, id: string): Promise<StockMovement | null> {
    return prisma.stockMovement.findFirst({ where: { id, organizationId } });
  },

  /**
   * Detecta se um RESERVE já foi compensado por um RELEASE.
   * Convenção: o RELEASE guarda `reason = "released:<reserveId>"`.
   */
  findReleaseForReserve(
    tx: Prisma.TransactionClient,
    organizationId: string,
    reserveId: string,
  ): Promise<{ id: string }[]> {
    return tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "stock_movement"
      WHERE "organizationId" = ${organizationId}
        AND "kind" = 'RELEASE'
        AND "reason" = ${`released:${reserveId}`}
      LIMIT 1
    `;
  },

  /** Armazém default e ativo da org (para reservar encomendas). */
  findDefaultLocation(organizationId: string): Promise<StockLocation | null> {
    return prisma.stockLocation.findFirst({
      where: { organizationId, isDefault: true, active: true },
    });
  },

  /**
   * Reservas (RESERVE) de um ref (ex.: ORDER/orderId) ainda ATIVAS — sem `RELEASE`
   * nem `OUT` correspondente. Convenções: RELEASE `reason="released:<id>"`,
   * OUT de expedição `reason="shipped:<id>"`. Diferença em JS (o lock é feito
   * no release/ship WithinTx).
   */
  async findActiveReservesForRef(
    tx: Prisma.TransactionClient,
    organizationId: string,
    refType: StockMovementRefType,
    refId: string,
  ): Promise<StockMovement[]> {
    const [reserves, consumers] = await Promise.all([
      tx.stockMovement.findMany({
        where: { organizationId, kind: 'RESERVE', refType, refId },
      }),
      tx.stockMovement.findMany({
        where: { organizationId, kind: { in: ['RELEASE', 'OUT'] }, refType, refId },
      }),
    ]);
    const consumed = new Set(
      consumers
        .map((r) => r.reason?.replace(/^(released|shipped):/, ''))
        .filter((id): id is string => Boolean(id)),
    );
    return reserves.filter((r) => !consumed.has(r.id));
  },
};
