import { z } from 'zod';

export const stockMovementKindValues = [
  'IN',
  'OUT',
  'RESERVE',
  'RELEASE',
  'ADJUST',
  'RETURN',
  'TRANSFER_IN',
  'TRANSFER_OUT',
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

export const createStockMovementSchema = z
  .object({
    variantId: z.string().min(1, 'Variante obrigatória'),
    locationId: z.string().min(1, 'Localização obrigatória'),
    kind: z.enum(stockMovementKindValues, { message: 'Tipo obrigatório' }),
    qty: z.coerce.number().int().min(1, 'Quantidade deve ser ≥ 1'),
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
