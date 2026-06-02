// backend/src/modules/quotes/quotes.schemas.ts
import { z } from 'zod';

export const QuoteStatusEnum = z.enum([
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
]);

/** Linha de input: variant + qty, com override de preço opcional (validado contra floor). */
export const quoteLineInputSchema = z
  .object({
    variantId: z.string().min(1),
    qty: z.number().int().positive(),
    override: z.coerce.number().positive().optional(),
  })
  .strict();

export const createQuoteSchema = z
  .object({
    customerId: z.string().min(1),
    notes: z.string().max(2000).optional(),
    validUntil: z.coerce.date().optional(),
    lines: z.array(quoteLineInputSchema).max(200).optional(),
  })
  .strict();

export const updateQuoteSchema = z
  .object({
    notes: z.string().max(2000).nullable().optional(),
    validUntil: z.coerce.date().nullable().optional(),
  })
  .strict();

export const listQuotesQuerySchema = z
  .object({
    status: QuoteStatusEnum.optional(),
    customerId: z.string().min(1).optional(),
    take: z.coerce.number().int().min(1).max(100).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export const transitionQuoteSchema = z
  .object({
    to: QuoteStatusEnum,
    reason: z.string().max(500).optional(),
  })
  .strict();

export type QuoteLineInput = z.infer<typeof quoteLineInputSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type ListQuotesQuery = z.infer<typeof listQuotesQuerySchema>;
export type TransitionQuoteInput = z.infer<typeof transitionQuoteSchema>;
