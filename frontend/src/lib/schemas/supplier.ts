import { z } from 'zod';

export const supplierTypeValues = [
  'ALIBABA_SELLER',
  'EU_IMPORTER',
  'DIRECT_MANUFACTURER',
  'DOMESTIC',
] as const;

export const incotermValues = ['FOB', 'CIF', 'EXW', 'DAP', 'DDP'] as const;

export const supplierStatusValues = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;

export const supplierContactKindValues = [
  'email',
  'phone',
  'wechat',
  'whatsapp',
  'alibaba_chat',
] as const;

/**
 * Schema do formulário — descreve a forma UI (campos auxiliares planos para contacto principal).
 * A mutationFn transforma para o payload que o backend espera.
 */
export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  type: z.enum(supplierTypeValues, { message: 'Tipo inválido' }),
  country: z.string().length(2, 'País: código ISO 2 letras'),
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  incoterms: z.enum(incotermValues).optional(),
  defaultLeadTimeDays: z.coerce.number().int().min(0).optional().nullable(),
  paymentTerms: z.string().optional(),
  // Campos auxiliares de contacto principal — transformados em contacts[] antes de enviar
  primaryContactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  primaryContactPhone: z.string().optional(),
  tags: z.string().optional(), // vírgula-separado; transformado em array no mutationFn
  notes: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
