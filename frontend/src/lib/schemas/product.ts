import { z } from 'zod';

export const productCategoryValues = [
  'DRY_FLOWERS',
  'PRESERVED_FLOWERS',
  'VASES_CONTAINERS',
  'FLORAL_FOAM',
  'RIBBONS_PACKAGING',
  'TOOLS_ACCESSORIES',
  'ARTIFICIAL_PLANTS',
  'DECORATIVE_OBJECTS',
] as const;

export const materialPrimaryValues = [
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
] as const;

export const productFinishValues = [
  'MATTE',
  'GLOSSY',
  'RUSTIC',
  'METALLIC',
  'TEXTURED',
  'TRANSPARENT',
] as const;

export const visualStyleValues = [
  'RUSTIC',
  'ROMANTIC',
  'MODERN',
  'MINIMALIST',
  'BOHO',
  'CLASSIC',
  'FUNERAL',
] as const;

export const humiditySensitivityValues = ['LOW', 'MEDIUM', 'HIGH'] as const;

export const productDecisionValues = ['PENDING', 'APPROVED', 'REJECTED', 'DISCONTINUED'] as const;

export const productStatusValues = [
  'ACTIVE',
  'OUT_OF_STOCK',
  'DISCONTINUED',
  'COMING_SOON',
] as const;

export const createProductSchema = z
  .object({
    sku: z.string().min(1, 'SKU obrigatório'),
    slug: z.string().min(1, 'Slug obrigatório'),
    name: z.string().min(1, 'Nome obrigatório'),
    category: z.enum(productCategoryValues, { message: 'Categoria obrigatória' }),
    botanicalName: z.string().optional(),
    isAnchor: z.boolean().optional().default(false),
    materialPrimary: z.enum(materialPrimaryValues).optional().nullable(),
    finish: z.enum(productFinishValues).optional().nullable(),
    visualStyle: z.enum(visualStyleValues).optional().nullable(),
    dominantColor: z.string().optional(),
    shelfLifeMonths: z.coerce.number().int().min(0).optional().nullable(),
    batchOriginDate: z.string().optional(), // date string YYYY-MM-DD
    sensitivityToHumidity: z.enum(humiditySensitivityValues).optional().nullable(),
    heightCm: z.coerce.number().min(0).optional().nullable(),
    widthCm: z.coerce.number().min(0).optional().nullable(),
    weightG: z.coerce.number().min(0).optional().nullable(),
    caseSize: z.coerce.number().int().min(1).optional().default(1),
    peakSeasons: z.array(z.string()).optional().default([]),
    costEur: z.coerce.number().min(0, 'Custo obrigatório'),
    recommendedRetailEur: z.coerce.number().min(0).optional().nullable(),
    status: z.enum(productStatusValues).optional().default('ACTIVE'),
    decision: z.enum(productDecisionValues).optional().default('PENDING'),
    score: z.coerce.number().min(0).max(10).optional().nullable(),
    visualScore: z.coerce.number().min(0).max(10).optional().nullable(),
  })
  .strict();

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
