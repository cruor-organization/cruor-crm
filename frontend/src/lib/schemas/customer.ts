import { z } from 'zod';

export const customerBusinessTypeValues = [
  'PHYSICAL_SHOP',
  'EVENT_ATELIER',
  'DECORATOR',
  'HOTEL_RESTAURANT',
  'ONLINE_ONLY',
  'MIXED',
] as const;

export const pricingTierValues = [
  'STANDARD',
  'PROFESSIONAL',
  'KEY_ACCOUNT',
  'DISTRIBUTOR',
] as const;

export const customerStatusValues = [
  'PROSPECT',
  'ACTIVE',
  'AT_RISK',
  'CHURNED',
  'BLOCKED',
] as const;

export const preferredChannelValues = ['WHATSAPP', 'EMAIL', 'PHONE', 'IN_PERSON'] as const;

export const dayOfWeekValues = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export const peakSeasonMonths = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
] as const;

/**
 * Schema do formulário — descreve a forma UI.
 * Não inclui contacts[] nem addresses[] (geridos fora deste form por agora).
 * A mutationFn injeta contacts:[] e addresses:[] vazios e limpa strings vazias.
 */
export const createCustomerSchema = z.object({
  businessType: z.enum(customerBusinessTypeValues, { message: 'Tipo obrigatório' }),
  legalName: z.string().min(1, 'Razão social obrigatória'),
  tradingName: z.string().optional(),
  taxId: z.string().optional(),
  taxCountry: z.string().length(2, 'Código ISO 2 letras').optional().or(z.literal('')),
  status: z.enum(customerStatusValues).optional().default('ACTIVE'),
  phonePrimary: z.string().optional(),
  whatsappNumber: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválido').optional().or(z.literal('')),
  instagramHandle: z.string().optional(),
  preferredChannel: z.enum(preferredChannelValues).optional().nullable(),
  pricingTier: z.enum(pricingTierValues).optional().default('STANDARD'),
  salesRepId: z.string().optional(),
  creditLimitEur: z.coerce.number().min(0).optional().default(0),
  paymentTermDays: z.coerce.number().int().min(0).optional().default(0),
  preferredDeliveryDay: z.enum(dayOfWeekValues).optional().nullable(),
  shopSizeSqm: z.coerce.number().int().min(0).optional().nullable(),
  estimatedMonthlyVolumeEur: z.coerce.number().min(0).optional().nullable(),
  peakSeasons: z.array(z.string()).optional().default([]),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
