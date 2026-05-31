/**
 * Stock service — orquestra reservas atómicas, movimentos e transferências.
 *
 * Hard invariants (§7.5, §9):
 *   - available/reserved >= 0 (CHECK na DB + validação prévia aqui)
 *   - reservas usam SELECT … FOR UPDATE via tx.$queryRaw (não Unsafe)
 *   - audit log em todas as mutações
 *   - multi-tenant: cada query filtra por ctx.orgId
 */
import type { Prisma, StockLevel, StockLocation, StockMovement } from '@prisma/client';

import { prisma } from '../../db/index.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors.js';
import { writeAudit } from '../audit/audit.service.js';

import { stockRepository } from './stock.repository.js';
import type {
  CreateMovementInput,
  CreateStockLocationInput,
  ListStockLevelsQuery,
  ListStockLocationsQuery,
  ListStockMovementsQuery,
  ReserveStockInput,
  TransferStockInput,
  UpdateStockLocationInput,
} from './stock.schemas.js';

export interface ReserveWithinTxInput {
  variantId: string;
  locationId: string;
  qty: number;
  refType: StockMovement['refType'];
  refId: string;
}

/**
 * Reserva atómica DENTRO de uma transação existente (§10.13 few-shot 1).
 * Caller é responsável por validar variant/location antes de abrir a tx.
 */
export async function reserveWithinTx(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  input: ReserveWithinTxInput,
): Promise<{ movement: StockMovement; level: StockLevel }> {
  await stockRepository.ensureLevel(tx, ctx.orgId, input.variantId, input.locationId);
  const [locked] = await stockRepository.lockLevelForUpdate(
    tx,
    ctx.orgId,
    input.variantId,
    input.locationId,
  );
  if (!locked) throw new NotFoundError('STOCK_LEVEL_NOT_FOUND');
  if (locked.available < input.qty) {
    throw new ConflictError('INSUFFICIENT_STOCK', 'Stock insuficiente para reservar.', {
      requested: input.qty,
      available: locked.available,
    });
  }

  await tx.stockLevel.update({
    where: { id: locked.id },
    data: {
      available: { decrement: input.qty },
      reserved: { increment: input.qty },
    },
  });

  const movement = await tx.stockMovement.create({
    data: {
      organizationId: ctx.orgId,
      variantId: input.variantId,
      locationId: input.locationId,
      kind: 'RESERVE',
      qty: input.qty,
      refType: input.refType,
      refId: input.refId,
      actorId: ctx.actorId,
    },
  });

  await writeAudit(ctx, 'stock_movement', movement.id, 'CREATE', {
    kind: 'RESERVE',
    qty: input.qty,
    refType: input.refType,
    refId: input.refId,
  });

  const level = await tx.stockLevel.findUniqueOrThrow({ where: { id: locked.id } });
  return { movement, level };
}

/**
 * Liberta UMA reserva DENTRO de uma transação existente. Idempotente por
 * convenção: `reason = "released:<reserveId>"`. Caller passa o movimento RESERVE
 * já validado (kind === 'RESERVE').
 */
export async function releaseWithinTx(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  reserve: StockMovement,
): Promise<{ movement: StockMovement; level: StockLevel }> {
  const existing = await stockRepository.findReleaseForReserve(tx, ctx.orgId, reserve.id);
  if (existing.length > 0) {
    throw new ConflictError('RESERVATION_ALREADY_RELEASED');
  }

  const [locked] = await stockRepository.lockLevelForUpdate(
    tx,
    ctx.orgId,
    reserve.variantId,
    reserve.locationId,
  );
  if (!locked) throw new NotFoundError('STOCK_LEVEL_NOT_FOUND');
  if (locked.reserved < reserve.qty) {
    throw new ConflictError('RESERVATION_INCONSISTENT', 'Reserved < qty da reserva.', {
      reserved: locked.reserved,
      required: reserve.qty,
    });
  }

  await tx.stockLevel.update({
    where: { id: locked.id },
    data: {
      available: { increment: reserve.qty },
      reserved: { decrement: reserve.qty },
    },
  });

  const movement = await tx.stockMovement.create({
    data: {
      organizationId: ctx.orgId,
      variantId: reserve.variantId,
      locationId: reserve.locationId,
      kind: 'RELEASE',
      qty: reserve.qty,
      refType: reserve.refType,
      refId: reserve.refId,
      reason: `released:${reserve.id}`,
      actorId: ctx.actorId,
    },
  });

  await writeAudit(ctx, 'stock_movement', movement.id, 'CREATE', {
    kind: 'RELEASE',
    reserveId: reserve.id,
    qty: reserve.qty,
  });

  const level = await tx.stockLevel.findUniqueOrThrow({ where: { id: locked.id } });
  return { movement, level };
}

export const stockService = {
  // ----- Locations -----

  listLocations(ctx: AuthContext, query: ListStockLocationsQuery) {
    return stockRepository.listLocations({
      organizationId: ctx.orgId,
      ...(query.active !== undefined ? { active: query.active } : {}),
      take: query.take,
      skip: query.skip,
    });
  },

  async getLocation(ctx: AuthContext, id: string): Promise<StockLocation> {
    const location = await stockRepository.findLocationById(ctx.orgId, id);
    if (!location) throw new NotFoundError('STOCK_LOCATION_NOT_FOUND');
    return location;
  },

  async createLocation(ctx: AuthContext, input: CreateStockLocationInput): Promise<StockLocation> {
    const dup = await stockRepository.findLocationByCode(ctx.orgId, input.code);
    if (dup)
      throw new ConflictError(
        'STOCK_LOCATION_CODE_TAKEN',
        `Já existe location com code=${input.code}`,
      );
    const location = await stockRepository.createLocation({
      organizationId: ctx.orgId,
      code: input.code,
      name: input.name,
      country: input.country,
      isDefault: input.isDefault,
      active: input.active,
    });
    await writeAudit(ctx, 'stock_location', location.id, 'CREATE', {
      code: input.code,
      name: input.name,
    });
    return location;
  },

  async updateLocation(
    ctx: AuthContext,
    id: string,
    input: UpdateStockLocationInput,
  ): Promise<StockLocation> {
    await this.getLocation(ctx, id);
    const result = await stockRepository.updateLocation(ctx.orgId, id, input);
    if (result.count === 0) throw new NotFoundError('STOCK_LOCATION_NOT_FOUND');
    await writeAudit(ctx, 'stock_location', id, 'UPDATE', input);
    return this.getLocation(ctx, id);
  },

  async deactivateLocation(ctx: AuthContext, id: string): Promise<void> {
    await this.getLocation(ctx, id);
    await stockRepository.updateLocation(ctx.orgId, id, { active: false });
    await writeAudit(ctx, 'stock_location', id, 'DELETE');
  },

  // ----- Levels -----

  listLevels(ctx: AuthContext, query: ListStockLevelsQuery) {
    return stockRepository.listLevels({
      organizationId: ctx.orgId,
      ...(query.variantId ? { variantId: query.variantId } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.belowSafety !== undefined ? { belowSafety: query.belowSafety } : {}),
      take: query.take,
      skip: query.skip,
    });
  },

  // ----- Movements -----

  listMovements(ctx: AuthContext, query: ListStockMovementsQuery) {
    return stockRepository.listMovements({
      organizationId: ctx.orgId,
      ...(query.variantId ? { variantId: query.variantId } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.refType ? { refType: query.refType } : {}),
      ...(query.refId ? { refId: query.refId } : {}),
      ...(query.from ? { from: query.from } : {}),
      ...(query.to ? { to: query.to } : {}),
      take: query.take,
      skip: query.skip,
    });
  },

  /**
   * Cria um IN/OUT/ADJUST/RETURN atómico. RESERVE/RELEASE/TRANSFER têm endpoints próprios.
   */
  async createMovement(
    ctx: AuthContext,
    input: CreateMovementInput,
  ): Promise<{ movement: StockMovement; level: StockLevel }> {
    await assertVariantAndLocation(ctx, input.variantId, input.locationId);

    return prisma.$transaction(async (tx) => {
      await stockRepository.ensureLevel(tx, ctx.orgId, input.variantId, input.locationId);
      const [locked] = await stockRepository.lockLevelForUpdate(
        tx,
        ctx.orgId,
        input.variantId,
        input.locationId,
      );
      if (!locked) throw new NotFoundError('STOCK_LEVEL_NOT_FOUND');

      const delta = computeDelta(input);
      const newAvailable = locked.available + delta;
      if (newAvailable < 0) {
        throw new ConflictError('INSUFFICIENT_STOCK', 'Stock insuficiente para a operação.', {
          requested: Math.abs(delta),
          available: locked.available,
        });
      }

      await tx.stockLevel.update({
        where: { id: locked.id },
        data: { available: { increment: delta } },
      });

      const movement = await tx.stockMovement.create({
        data: {
          organizationId: ctx.orgId,
          variantId: input.variantId,
          locationId: input.locationId,
          kind: input.kind,
          qty: input.qty,
          refType: input.refType,
          refId: input.refId ?? null,
          batch: input.batch ?? null,
          reason: input.reason ?? (input.kind === 'ADJUST' ? `adjust:${input.direction}` : null),
          actorId: ctx.actorId,
        },
      });

      await writeAudit(ctx, 'stock_movement', movement.id, 'CREATE', {
        kind: input.kind,
        qty: input.qty,
        direction: input.direction,
      });

      const level = await tx.stockLevel.findUniqueOrThrow({ where: { id: locked.id } });
      return { movement, level };
    });
  },

  /**
   * Reserva atómica com SELECT … FOR UPDATE (§10.13 few-shot 1).
   */
  async reserve(
    ctx: AuthContext,
    input: ReserveStockInput,
  ): Promise<{ movement: StockMovement; level: StockLevel }> {
    await assertVariantAndLocation(ctx, input.variantId, input.locationId);
    return prisma.$transaction((tx) =>
      reserveWithinTx(tx, ctx, {
        variantId: input.variantId,
        locationId: input.locationId,
        qty: input.qty,
        refType: input.refType,
        refId: input.refId,
      }),
    );
  },

  /**
   * Liberta uma reserva. Idempotência por convenção: `reason = "released:<reserveId>"`.
   */
  async release(
    ctx: AuthContext,
    reserveMovementId: string,
  ): Promise<{ movement: StockMovement; level: StockLevel }> {
    const reserve = await stockRepository.findMovementById(ctx.orgId, reserveMovementId);
    if (!reserve) throw new NotFoundError('STOCK_MOVEMENT_NOT_FOUND');
    if (reserve.kind !== 'RESERVE') {
      throw new ValidationError(
        'STOCK_MOVEMENT_NOT_RESERVE',
        'Apenas movimentos kind=RESERVE podem ser libertados.',
      );
    }
    return prisma.$transaction((tx) => releaseWithinTx(tx, ctx, reserve));
  },

  /**
   * Transfere stock entre locations dentro da mesma org. Lock determinístico por
   * `locationId` para evitar deadlock em transfers simétricas.
   */
  async transfer(
    ctx: AuthContext,
    input: TransferStockInput,
  ): Promise<{ out: StockMovement; in: StockMovement }> {
    await assertVariantInOrg(ctx, input.variantId);
    await assertLocationInOrg(ctx, input.fromLocationId);
    await assertLocationInOrg(ctx, input.toLocationId);

    // Ordem alfabética para evitar deadlock cruzado A↔B.
    const firstId =
      input.fromLocationId < input.toLocationId ? input.fromLocationId : input.toLocationId;
    const secondId =
      input.fromLocationId < input.toLocationId ? input.toLocationId : input.fromLocationId;

    return prisma.$transaction(async (tx) => {
      await stockRepository.ensureLevel(tx, ctx.orgId, input.variantId, firstId);
      await stockRepository.ensureLevel(tx, ctx.orgId, input.variantId, secondId);

      // Lock pela ordem determinística.
      const [firstLocked] = await stockRepository.lockLevelForUpdate(
        tx,
        ctx.orgId,
        input.variantId,
        firstId,
      );
      const [secondLocked] = await stockRepository.lockLevelForUpdate(
        tx,
        ctx.orgId,
        input.variantId,
        secondId,
      );
      if (!firstLocked || !secondLocked) throw new NotFoundError('STOCK_LEVEL_NOT_FOUND');

      const isFromFirst = input.fromLocationId === firstId;
      const fromLocked = isFromFirst ? firstLocked : secondLocked;
      const toLocked = isFromFirst ? secondLocked : firstLocked;

      if (fromLocked.available < input.qty) {
        throw new ConflictError('INSUFFICIENT_STOCK', 'Stock insuficiente na origem.', {
          requested: input.qty,
          available: fromLocked.available,
        });
      }

      await tx.stockLevel.update({
        where: { id: fromLocked.id },
        data: { available: { decrement: input.qty } },
      });
      await tx.stockLevel.update({
        where: { id: toLocked.id },
        data: { available: { increment: input.qty } },
      });

      const out = await tx.stockMovement.create({
        data: {
          organizationId: ctx.orgId,
          variantId: input.variantId,
          locationId: input.fromLocationId,
          kind: 'TRANSFER_OUT',
          qty: input.qty,
          refType: 'TRANSFER',
          refId: input.toLocationId,
          reason: input.reason ?? null,
          actorId: ctx.actorId,
        },
      });
      const movementIn = await tx.stockMovement.create({
        data: {
          organizationId: ctx.orgId,
          variantId: input.variantId,
          locationId: input.toLocationId,
          kind: 'TRANSFER_IN',
          qty: input.qty,
          refType: 'TRANSFER',
          refId: out.id,
          reason: input.reason ?? null,
          actorId: ctx.actorId,
        },
      });

      await writeAudit(ctx, 'stock_movement', out.id, 'CREATE', {
        kind: 'TRANSFER_OUT',
        qty: input.qty,
        toLocationId: input.toLocationId,
      });
      await writeAudit(ctx, 'stock_movement', movementIn.id, 'CREATE', {
        kind: 'TRANSFER_IN',
        qty: input.qty,
        fromLocationId: input.fromLocationId,
      });

      return { out, in: movementIn };
    });
  },
};

// ----------------------------------------------------------------------------
// Helpers internos
// ----------------------------------------------------------------------------

function computeDelta(input: CreateMovementInput): number {
  switch (input.kind) {
    case 'IN':
    case 'RETURN':
      return input.qty;
    case 'OUT':
      return -input.qty;
    case 'ADJUST':
      return input.direction === 'DOWN' ? -input.qty : input.qty;
    default: {
      const exhaustive: never = input.kind;
      void exhaustive;
      throw new ValidationError(
        'STOCK_MOVEMENT_KIND_UNSUPPORTED',
        'Kind de movimento não suportado por este endpoint.',
      );
    }
  }
}

async function assertVariantAndLocation(
  ctx: AuthContext,
  variantId: string,
  locationId: string,
): Promise<void> {
  await Promise.all([assertVariantInOrg(ctx, variantId), assertLocationInOrg(ctx, locationId)]);
}

async function assertVariantInOrg(ctx: AuthContext, variantId: string): Promise<void> {
  const v = await prisma.productVariant.findFirst({
    where: { id: variantId, organizationId: ctx.orgId },
    select: { id: true },
  });
  if (!v) throw new NotFoundError('PRODUCT_VARIANT_NOT_FOUND');
}

async function assertLocationInOrg(ctx: AuthContext, locationId: string): Promise<void> {
  const l = await prisma.stockLocation.findFirst({
    where: { id: locationId, organizationId: ctx.orgId, active: true },
    select: { id: true },
  });
  if (!l) throw new NotFoundError('STOCK_LOCATION_NOT_FOUND');
}

// Re-export para o uso em outros módulos (Fase 3 vai importar). Mantém o tipo
// `Prisma` reexportado opaco para evitar dependency loops.
export type { Prisma };
