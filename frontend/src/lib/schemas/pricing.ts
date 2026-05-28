import { z } from 'zod';

export const pricingTierValues = [
  'STANDARD',
  'PROFESSIONAL',
  'KEY_ACCOUNT',
  'DISTRIBUTOR',
] as const;
export const priceListStatusValues = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export const priceListCurrencyValues = ['EUR'] as const;

export type PricingTier = (typeof pricingTierValues)[number];
export type PriceListStatus = (typeof priceListStatusValues)[number];
export type PriceListCurrency = (typeof priceListCurrencyValues)[number];

export const discountBreakSchema = z
  .object({
    minQty: z.coerce.number().int().positive(),
    discountPct: z.coerce.number().min(0).max(0.3),
  })
  .strict();

export const discountBreaksSchema = z
  .array(discountBreakSchema)
  .max(10)
  .superRefine((arr, ctx) => {
    for (let i = 1; i < arr.length; i++) {
      const prev = arr[i - 1]!;
      const curr = arr[i]!;
      if (curr.minQty <= prev.minQty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, 'minQty'],
          message: 'Tem de ser maior que a anterior.',
        });
      }
      if (curr.discountPct <= prev.discountPct) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, 'discountPct'],
          message: 'Tem de ser maior que o anterior.',
        });
      }
    }
  });

// ----- PriceList -----

export const createPriceListSchema = z
  .object({
    name: z.string().min(1, 'Obrigatório'),
    tier: z.enum(pricingTierValues),
    currency: z.enum(priceListCurrencyValues).default('EUR'),
    validFrom: z.string().min(1, 'Obrigatório'),
    validUntil: z.string().optional(),
  })
  .strict();

export type CreatePriceListInput = z.infer<typeof createPriceListSchema>;

// ----- PriceListLine -----

export const createPriceListLineSchema = z
  .object({
    variantId: z.string().min(1, 'Obrigatório'),
    unitPriceEur: z.coerce.number().positive('Tem de ser positivo'),
    minQty: z.coerce.number().int().positive().default(1),
    discountBreaks: discountBreaksSchema.default([]),
  })
  .strict();

export const updatePriceListLineSchema = z
  .object({
    unitPriceEur: z.coerce.number().positive().optional(),
    minQty: z.coerce.number().int().positive().optional(),
    discountBreaks: discountBreaksSchema.optional(),
  })
  .strict();

export type CreatePriceListLineInput = z.infer<typeof createPriceListLineSchema>;
export type UpdatePriceListLineInput = z.infer<typeof updatePriceListLineSchema>;

// ----- CustomerSpecialPrice -----

export const createSpecialPriceSchema = z
  .object({
    customerId: z.string().min(1, 'Obrigatório'),
    variantId: z.string().min(1, 'Obrigatório'),
    unitPriceEur: z.coerce.number().positive('Tem de ser positivo'),
    validFrom: z.string().min(1, 'Obrigatório'),
    validUntil: z.string().optional(),
    reason: z.string().max(500).optional(),
  })
  .strict();

export const updateSpecialPriceSchema = z
  .object({
    unitPriceEur: z.coerce.number().positive().optional(),
    validUntil: z.string().optional(),
    reason: z.string().max(500).optional(),
  })
  .strict();

export type CreateSpecialPriceInput = z.infer<typeof createSpecialPriceSchema>;
export type UpdateSpecialPriceInput = z.infer<typeof updateSpecialPriceSchema>;

// ----- Resolve -----

export const resolvePriceSchema = z
  .object({
    variantId: z.string().min(1),
    qty: z.coerce.number().int().positive(),
    customerId: z.string().optional(),
    tier: z.enum(pricingTierValues).optional(),
    override: z.coerce.number().positive().optional(),
  })
  .strict();

export type ResolvePriceInput = z.infer<typeof resolvePriceSchema>;
