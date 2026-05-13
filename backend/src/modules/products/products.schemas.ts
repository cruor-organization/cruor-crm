import { z } from 'zod';

export const ProductCategoryEnum = z.enum([
  'DRY_FLOWERS',
  'PRESERVED_FLOWERS',
  'VASES_CONTAINERS',
  'FLORAL_FOAM',
  'RIBBONS_PACKAGING',
  'TOOLS_ACCESSORIES',
  'ARTIFICIAL_PLANTS',
  'DECORATIVE_OBJECTS',
]);

export const MaterialPrimaryEnum = z.enum([
  'GLASS',
  'CERAMIC',
  'METAL',
  'WOOD',
  'NATURAL_FIBER',
  'FOAM',
  'RESIN',
  'PLASTIC',
  'TEXTILE',
  'PAPER',
  'OTHER',
]);

export const ProductFinishEnum = z.enum([
  'MATTE',
  'GLOSSY',
  'RUSTIC',
  'METALLIC',
  'TEXTURED',
  'TRANSPARENT',
]);

export const VisualStyleEnum = z.enum([
  'RUSTIC',
  'ROMANTIC',
  'MODERN',
  'MINIMALIST',
  'BOHO',
  'CLASSIC',
  'FUNERAL',
]);

export const HumiditySensitivityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const ProductDecisionEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DISCONTINUED']);

export const ProductStatusEnum = z.enum(['ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'COMING_SOON']);

export const createProductSchema = z
  .object({
    sku: z.string().min(2).max(64),
    name: z.string().min(2).max(200),
    slug: z
      .string()
      .min(2)
      .max(200)
      .regex(/^[a-z0-9-]+$/, 'slug deve ser kebab-case'),
    category: ProductCategoryEnum,
    subcategory: z.string().max(80).optional(),
    description: z.string().max(20_000).optional(),
    shortDescription: z.string().max(500).optional(),
    brand: z.string().max(120).optional(),
    supplierId: z.string().min(1).optional(),
    supplierSku: z.string().max(80).optional(),
    originCountry: z.string().length(2).toUpperCase().optional(),

    heightCm: z.coerce.number().min(0).optional(),
    widthCm: z.coerce.number().min(0).optional(),
    depthCm: z.coerce.number().min(0).optional(),
    weightG: z.coerce.number().min(0).optional(),
    materialPrimary: MaterialPrimaryEnum.optional(),
    finish: ProductFinishEnum.optional(),

    dominantColor: z.string().max(40).optional(),
    secondaryColors: z.array(z.string().min(1).max(40)).max(10).default([]),
    visualStyle: VisualStyleEnum.optional(),

    isPreserved: z.boolean().default(false),
    isDried: z.boolean().default(false),
    botanicalName: z.string().max(160).optional(),
    shelfLifeMonths: z.number().int().min(0).max(120).optional(),
    sensitivityToHumidity: HumiditySensitivityEnum.optional(),
    batchOriginDate: z.coerce.date().optional(),

    seasonality: z.array(z.string().min(1).max(40)).max(20).default([]),
    peakMonths: z.array(z.number().int().min(1).max(12)).max(12).default([]),

    costEur: z.coerce.number().min(0),
    recommendedRetailEur: z.coerce.number().min(0).optional(),
    moq: z.number().int().min(1).default(1),
    caseSize: z.number().int().min(1).default(1),
    leadTimeDays: z.number().int().min(0).max(365).optional(),

    isAnchor: z.boolean().default(false),
    status: ProductStatusEnum.default('ACTIVE'),
  })
  .strict();

export const updateProductSchema = createProductSchema.partial().strict();

export const setDecisionSchema = z
  .object({ decision: ProductDecisionEnum, comment: z.string().max(2000).optional() })
  .strict();

export const voteProductSchema = z
  .object({
    score: z.coerce.number().min(0).max(10),
    visualScore: z.coerce.number().min(0).max(10).optional(),
    comment: z.string().max(2000).optional(),
  })
  .strict();

export const listProductsQuerySchema = z
  .object({
    q: z.string().max(200).optional(),
    category: ProductCategoryEnum.optional(),
    decision: ProductDecisionEnum.optional(),
    status: ProductStatusEnum.optional(),
    supplierId: z.string().optional(),
    take: z.coerce.number().int().min(1).max(200).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type SetDecisionInput = z.infer<typeof setDecisionSchema>;
export type VoteProductInput = z.infer<typeof voteProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
