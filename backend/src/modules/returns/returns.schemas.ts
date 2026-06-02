// backend/src/modules/returns/returns.schemas.ts
import { z } from 'zod';

export const ReturnReasonEnum = z.enum(['DAMAGED', 'WRONG_ITEM', 'QUALITY', 'SURPLUS', 'OTHER']);
export const ReturnStatusEnum = z.enum(['REQUESTED', 'RECEIVED', 'REFUNDED', 'REPLACED']);
export const ReturnDispositionEnum = z.enum(['RESTOCK', 'SCRAP']);
/** Resolução comercial — espelhada no estado da encomenda (§10.14 few-shot 3). */
export const ReturnResolutionEnum = z.enum(['REFUNDED', 'REPLACED']);

const photosSchema = z.array(z.string().url().max(2048)).max(20);

/** Linha de pedido de devolução: variant da encomenda + qty a devolver. */
export const createReturnLineSchema = z
  .object({
    variantId: z.string().min(1),
    qty: z.number().int().positive(),
    photos: photosSchema.optional(),
  })
  .strict();

export const createReturnSchema = z
  .object({
    orderId: z.string().min(1),
    reason: ReturnReasonEnum,
    notes: z.string().max(2000).optional(),
    lines: z.array(createReturnLineSchema).min(1).max(200),
  })
  .strict();

/** Receção física: ajusta qty recebida e anexa fotos/notas de inspeção por linha. */
export const receiveReturnLineSchema = z
  .object({
    variantId: z.string().min(1),
    receivedQty: z.number().int().positive(),
    photos: photosSchema.optional(),
    inspectionNotes: z.string().max(2000).optional(),
  })
  .strict();

export const receiveReturnSchema = z
  .object({
    lines: z.array(receiveReturnLineSchema).max(200).optional(),
  })
  .strict();

/** Decisão: resolução comercial + disposição de stock por linha (default RESTOCK). */
export const decideReturnLineSchema = z
  .object({
    variantId: z.string().min(1),
    disposition: ReturnDispositionEnum,
  })
  .strict();

export const decideReturnSchema = z
  .object({
    resolution: ReturnResolutionEnum,
    lines: z.array(decideReturnLineSchema).max(200).optional(),
  })
  .strict();

export const listReturnsQuerySchema = z
  .object({
    status: ReturnStatusEnum.optional(),
    orderId: z.string().min(1).optional(),
    take: z.coerce.number().int().min(1).max(100).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type CreateReturnInput = z.infer<typeof createReturnSchema>;
export type ReceiveReturnInput = z.infer<typeof receiveReturnSchema>;
export type DecideReturnInput = z.infer<typeof decideReturnSchema>;
export type ListReturnsQuery = z.infer<typeof listReturnsQuerySchema>;
