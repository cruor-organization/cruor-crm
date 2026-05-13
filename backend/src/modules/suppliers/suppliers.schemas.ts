import { z } from 'zod';

export const SupplierTypeEnum = z.enum([
  'ALIBABA_SELLER',
  'EU_IMPORTER',
  'DIRECT_MANUFACTURER',
  'DOMESTIC',
]);

export const IncotermEnum = z.enum(['FOB', 'CIF', 'EXW', 'DAP', 'DDP']);

export const SupplierContactSchema = z.object({
  kind: z.enum(['email', 'phone', 'wechat', 'whatsapp', 'alibaba_chat']),
  value: z.string().min(3).max(200),
  primary: z.boolean().default(false),
});

export const createSupplierSchema = z
  .object({
    name: z.string().min(2).max(200),
    legalName: z.string().min(2).max(200).optional(),
    country: z.string().length(2).toUpperCase(),
    type: SupplierTypeEnum,
    taxId: z.string().min(5).max(40).optional(),
    contacts: z.array(SupplierContactSchema).max(10).default([]),
    paymentTerms: z.string().max(200).optional(),
    incoterms: IncotermEnum.optional(),
    defaultLeadTimeDays: z.number().int().min(0).max(365).optional(),
    tags: z.array(z.string().min(1).max(40)).max(20).default([]),
    notes: z.string().max(5000).optional(),
  })
  .strict();

export const updateSupplierSchema = createSupplierSchema.partial().strict();

export const listSuppliersQuerySchema = z
  .object({
    q: z.string().max(200).optional(),
    type: SupplierTypeEnum.optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
    take: z.coerce.number().int().min(1).max(100).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type ListSuppliersQuery = z.infer<typeof listSuppliersQuerySchema>;
