import { z } from 'zod';

import { customerBusinessTypeValues } from './customer';

export const leadStatusValues = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'NEGOTIATING',
  'WON',
  'LOST',
] as const;

export const leadSourceValues = [
  'REFERRAL',
  'WEBSITE',
  'INSTAGRAM',
  'COLD_OUTREACH',
  'EVENT_FAIR',
  'GOOGLE_PLACES',
  'OTHER',
] as const;

/**
 * Schema do formulário — descreve a forma UI.
 * Inclui `contactName` (UI-only, descartado antes de enviar) e
 * `city` (UI-only, concatenado com zoneCode → geoZone no mutationFn).
 * O backend espera `phone` (não `phoneNumber`) e `geoZone` (não `city`/`zoneCode`).
 */
export const createLeadSchema = z.object({
  tradingName: z.string().min(1, 'Nome comercial obrigatório'),
  legalName: z.string().optional(),
  // UI-only: descartado antes de enviar (backend não tem campo de nome de contacto em lead)
  contactName: z.string().optional(),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  // UI-only: combinados em geoZone no mutationFn
  city: z.string().optional(),
  zoneCode: z.string().optional(),
  businessType: z.enum(customerBusinessTypeValues).optional().nullable(),
  source: z.enum(leadSourceValues).optional().default('OTHER'),
  notes: z.string().optional(),
  status: z.enum(leadStatusValues).optional().default('NEW'),
});

export const updateLeadSchema = createLeadSchema.partial();

export const updateLeadStatusSchema = z
  .object({
    status: z.enum(leadStatusValues),
  })
  .strict();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
