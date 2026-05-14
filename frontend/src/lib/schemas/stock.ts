import { z } from 'zod';

/**
 * Subset de kinds aceites em POST /stock/movements.
 * RESERVE, RELEASE, TRANSFER_IN, TRANSFER_OUT têm endpoints próprios — não usar aqui.
 */
export const movementCreateKindValues = ['IN', 'OUT', 'ADJUST', 'RETURN'] as const;

export const stockMovementRefTypeValues = [
  'ORDER',
  'QUOTE',
  'PURCHASE',
  'RETURN_DOC',
  'ADJUSTMENT',
  'TRANSFER',
  'NONE',
] as const;

export const createStockLocationSchema = z
  .object({
    code: z
      .string()
      .min(1, 'Código obrigatório')
      .regex(/^[A-Z]{2}_[A-Z0-9_]+$/, 'Formato: XX_NOME (ex.: PT_PORTO)'),
    name: z.string().min(1, 'Nome obrigatório'),
    country: z.string().length(2, 'Código ISO 2 letras'),
    isDefault: z.boolean().optional().default(false),
    active: z.boolean().optional().default(true),
  })
  .strict();

export const updateStockLocationSchema = createStockLocationSchema.partial();

/**
 * Schema do formulário de movimento de stock.
 * Inclui `direction` (obrigatório quando kind=ADJUST).
 * O mutationFn omite `direction` se kind !== 'ADJUST'.
 */
export const createStockMovementSchema = z
  .object({
    variantId: z.string().min(1, 'Variante obrigatória'),
    locationId: z.string().min(1, 'Localização obrigatória'),
    kind: z.enum(movementCreateKindValues, { message: 'Tipo obrigatório' }),
    qty: z.coerce.number().int().min(1, 'Quantidade deve ser ≥ 1'),
    direction: z.enum(['UP', 'DOWN']).optional(),
    refType: z.enum(stockMovementRefTypeValues).optional().default('NONE'),
    refId: z.string().optional(),
    batch: z.string().optional(),
    reason: z.string().optional(),
  })
  .strict();

export const createStockTransferSchema = z
  .object({
    fromLocationId: z.string().min(1, 'Localização origem obrigatória'),
    toLocationId: z.string().min(1, 'Localização destino obrigatória'),
    variantId: z.string().min(1, 'Variante obrigatória'),
    qty: z.coerce.number().int().min(1, 'Quantidade deve ser ≥ 1'),
    reason: z.string().optional(),
  })
  .strict();

export type CreateStockLocationInput = z.infer<typeof createStockLocationSchema>;
export type UpdateStockLocationInput = z.infer<typeof updateStockLocationSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type CreateStockTransferInput = z.infer<typeof createStockTransferSchema>;
