// backend/src/modules/invoices/invoices.schemas.ts
import { z } from 'zod';

export const listInvoicesQuerySchema = z
  .object({
    status: z.enum(['PENDING', 'ISSUED', 'PAID', 'VOID']).optional(),
    customerId: z.string().min(1).optional(),
    take: z.coerce.number().int().min(1).max(200).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export const registerPaymentSchema = z
  .object({
    amountEur: z.number().positive(),
    method: z.enum(['TRANSFER', 'CARD', 'CASH', 'OTHER']).default('TRANSFER'),
    reference: z.string().max(120).optional(),
  })
  .strict();

export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
