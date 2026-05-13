import { z } from 'zod';

export const supplierTypeValues = [
  'ALIBABA_SELLER',
  'EU_IMPORTER',
  'DIRECT_MANUFACTURER',
  'DOMESTIC',
] as const;

export const incotermValues = ['FOB', 'CIF', 'EXW', 'DAP', 'DDP'] as const;

export const supplierStatusValues = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;

export const createSupplierSchema = z
  .object({
    name: z.string().min(1, 'Nome obrigatório'),
    type: z.enum(supplierTypeValues, { message: 'Tipo inválido' }),
    country: z.string().length(2, 'País: código ISO 2 letras'),
    incoterms: z.enum(incotermValues).optional(),
    defaultLeadTimeDays: z.coerce.number().int().min(0).optional().nullable(),
    primaryContactName: z.string().optional(),
    primaryContactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
    primaryContactPhone: z.string().optional(),
    tags: z.string().optional(), // vírgula-separado; transformado em array no form
    notes: z.string().optional(),
  })
  .strict();

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
// UpdateSupplierInput exportado para uso externo
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
