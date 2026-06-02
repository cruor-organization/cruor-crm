import { z } from 'zod';

export const StockMovementKindEnum = z.enum([
  'IN',
  'OUT',
  'RESERVE',
  'RELEASE',
  'ADJUST',
  'RETURN',
  'TRANSFER_IN',
  'TRANSFER_OUT',
]);

export const StockMovementRefTypeEnum = z.enum([
  'ORDER',
  'QUOTE',
  'PURCHASE',
  'RETURN_DOC',
  'ADJUSTMENT',
  'TRANSFER',
  'NONE',
]);

/** Códigos default sugeridos. Não vinculativo — qualquer string A-Z_ válida. */
export const StockLocationCodeRegex = /^[A-Z]{2}_[A-Z0-9_]+$/;

export const createStockLocationSchema = z
  .object({
    code: z.string().regex(StockLocationCodeRegex, 'Formato XX_NOME (ex.: PT_PORTO)'),
    name: z.string().min(2).max(120),
    country: z.string().length(2).toUpperCase(),
    isDefault: z.boolean().default(false),
    isQuarantine: z.boolean().default(false),
    active: z.boolean().default(true),
  })
  .strict();

export const updateStockLocationSchema = createStockLocationSchema.partial().strict();

export const listStockLocationsQuerySchema = z
  .object({
    active: z.coerce.boolean().optional(),
    take: z.coerce.number().int().min(1).max(100).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export const listStockLevelsQuerySchema = z
  .object({
    variantId: z.string().min(1).optional(),
    locationId: z.string().min(1).optional(),
    belowSafety: z.coerce.boolean().optional(),
    take: z.coerce.number().int().min(1).max(200).default(100),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export const listStockMovementsQuerySchema = z
  .object({
    variantId: z.string().min(1).optional(),
    locationId: z.string().min(1).optional(),
    kind: StockMovementKindEnum.optional(),
    refType: StockMovementRefTypeEnum.optional(),
    refId: z.string().min(1).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    take: z.coerce.number().int().min(1).max(200).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

/** Subset de kinds permitidos em `POST /stock/movements`. RESERVE/RELEASE/TRANSFER_* têm endpoints próprios. */
export const MovementCreateKindEnum = z.enum(['IN', 'OUT', 'ADJUST', 'RETURN']);

export const createMovementSchema = z
  .object({
    variantId: z.string().min(1),
    locationId: z.string().min(1),
    kind: MovementCreateKindEnum,
    qty: z.number().int().positive(),
    /** Obrigatório para ADJUST. Ignorado nos restantes. */
    direction: z.enum(['UP', 'DOWN']).optional(),
    refType: StockMovementRefTypeEnum.default('NONE'),
    refId: z.string().min(1).optional(),
    batch: z.string().max(120).optional(),
    reason: z.string().max(500).optional(),
  })
  .strict()
  .refine((v) => v.kind !== 'ADJUST' || v.direction != null, {
    message: 'direction (UP|DOWN) é obrigatório quando kind=ADJUST',
    path: ['direction'],
  });

export const reserveStockSchema = z
  .object({
    variantId: z.string().min(1),
    locationId: z.string().min(1),
    qty: z.number().int().positive(),
    refType: z.enum(['ORDER', 'QUOTE']),
    refId: z.string().min(1),
  })
  .strict();

export const transferStockSchema = z
  .object({
    variantId: z.string().min(1),
    fromLocationId: z.string().min(1),
    toLocationId: z.string().min(1),
    qty: z.number().int().positive(),
    reason: z.string().max(500).optional(),
  })
  .strict()
  .refine((v) => v.fromLocationId !== v.toLocationId, {
    message: 'fromLocationId e toLocationId têm de ser diferentes',
    path: ['toLocationId'],
  });

export type CreateStockLocationInput = z.infer<typeof createStockLocationSchema>;
export type UpdateStockLocationInput = z.infer<typeof updateStockLocationSchema>;
export type ListStockLocationsQuery = z.infer<typeof listStockLocationsQuerySchema>;
export type ListStockLevelsQuery = z.infer<typeof listStockLevelsQuerySchema>;
export type ListStockMovementsQuery = z.infer<typeof listStockMovementsQuerySchema>;
export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type ReserveStockInput = z.infer<typeof reserveStockSchema>;
export type TransferStockInput = z.infer<typeof transferStockSchema>;
