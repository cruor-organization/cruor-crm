import { z } from 'zod';

import { PricingTierEnum } from '../customers/customers.schemas.js';

export { PricingTierEnum };

export const PriceListStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);
export const PriceListCurrencyEnum = z.enum(['EUR']);

/**
 * Quebras de desconto por quantidade (§10.15).
 * - `minQty` estritamente crescente.
 * - `discountPct` estritamente crescente (mais qty ⇒ mais desconto).
 * - `discountPct ∈ [0, 0.30]` (cap definido no spec).
 */
export const DiscountBreakSchema = z
  .object({
    minQty: z.number().int().positive(),
    discountPct: z.number().min(0).max(0.3),
  })
  .strict();

export const DiscountBreaksSchema = z
  .array(DiscountBreakSchema)
  .max(10)
  .superRefine((arr, ctx) => {
    for (let i = 1; i < arr.length; i++) {
      const prev = arr[i - 1]!;
      const curr = arr[i]!;
      if (curr.minQty <= prev.minQty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, 'minQty'],
          message: 'minQty tem de ser estritamente crescente.',
        });
      }
      if (curr.discountPct <= prev.discountPct) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, 'discountPct'],
          message: 'discountPct tem de ser estritamente crescente.',
        });
      }
    }
  });

// ----- PriceList -----

export const createPriceListSchema = z
  .object({
    name: z.string().min(1).max(200),
    tier: PricingTierEnum,
    currency: PriceListCurrencyEnum.default('EUR'),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date().optional(),
  })
  .strict()
  .refine((v) => v.validUntil == null || v.validUntil > v.validFrom, {
    message: 'validUntil tem de ser posterior a validFrom.',
    path: ['validUntil'],
  });

export const updatePriceListSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    validUntil: z.coerce.date().nullable().optional(),
  })
  .strict();

export const listPriceListsQuerySchema = z
  .object({
    tier: PricingTierEnum.optional(),
    status: PriceListStatusEnum.optional(),
    take: z.coerce.number().int().min(1).max(100).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

// ----- PriceListLine -----

export const createPriceListLineSchema = z
  .object({
    variantId: z.string().min(1),
    unitPriceEur: z.coerce.number().positive(),
    minQty: z.number().int().positive().default(1),
    discountBreaks: DiscountBreaksSchema.default([]),
  })
  .strict()
  .superRefine((v, ctx) => {
    for (let i = 0; i < v.discountBreaks.length; i++) {
      if (v.discountBreaks[i]!.minQty <= v.minQty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discountBreaks', i, 'minQty'],
          message: 'Cada break.minQty tem de ser superior ao minQty da linha.',
        });
      }
    }
  });

export const updatePriceListLineSchema = z
  .object({
    unitPriceEur: z.coerce.number().positive().optional(),
    minQty: z.number().int().positive().optional(),
    discountBreaks: DiscountBreaksSchema.optional(),
  })
  .strict();

// ----- CustomerSpecialPrice -----

export const createSpecialPriceSchema = z
  .object({
    customerId: z.string().min(1),
    variantId: z.string().min(1),
    unitPriceEur: z.coerce.number().positive(),
    validFrom: z.coerce.date().default(() => new Date()),
    validUntil: z.coerce.date().optional(),
    reason: z.string().max(500).optional(),
  })
  .strict()
  .refine((v) => v.validUntil == null || v.validUntil > v.validFrom, {
    message: 'validUntil tem de ser posterior a validFrom.',
    path: ['validUntil'],
  });

export const updateSpecialPriceSchema = z
  .object({
    unitPriceEur: z.coerce.number().positive().optional(),
    validUntil: z.coerce.date().nullable().optional(),
    reason: z.string().max(500).nullable().optional(),
  })
  .strict();

export const listSpecialsQuerySchema = z
  .object({
    customerId: z.string().optional(),
    variantId: z.string().optional(),
    activeOnly: z.coerce.boolean().default(false),
    take: z.coerce.number().int().min(1).max(100).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

// ----- Resolve -----

export const resolvePriceSchema = z
  .object({
    variantId: z.string().min(1),
    qty: z.number().int().positive(),
    customerId: z.string().optional(),
    tier: PricingTierEnum.optional(),
    override: z.coerce.number().positive().optional(),
  })
  .strict()
  .refine((v) => v.customerId != null || v.tier != null, {
    message: 'Indique customerId (para inferir tier) ou tier explícito.',
    path: ['tier'],
  });

export type CreatePriceListInput = z.infer<typeof createPriceListSchema>;
export type UpdatePriceListInput = z.infer<typeof updatePriceListSchema>;
export type ListPriceListsQuery = z.infer<typeof listPriceListsQuerySchema>;
export type CreatePriceListLineInput = z.infer<typeof createPriceListLineSchema>;
export type UpdatePriceListLineInput = z.infer<typeof updatePriceListLineSchema>;
export type CreateSpecialPriceInput = z.infer<typeof createSpecialPriceSchema>;
export type UpdateSpecialPriceInput = z.infer<typeof updateSpecialPriceSchema>;
export type ListSpecialsQuery = z.infer<typeof listSpecialsQuerySchema>;
export type ResolvePriceInput = z.infer<typeof resolvePriceSchema>;
