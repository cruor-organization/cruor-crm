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

export const createLeadSchema = z
  .object({
    tradingName: z.string().min(1, 'Nome comercial obrigatório'),
    legalName: z.string().optional(),
    contactName: z.string().optional(),
    phone: z.string().optional(),
    whatsappNumber: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    city: z.string().optional(),
    zoneCode: z.string().optional(),
    country: z.string().length(2).optional().default('PT'),
    businessType: z.enum(customerBusinessTypeValues).optional().nullable(),
    source: z.enum(leadSourceValues).optional().default('OTHER'),
    notes: z.string().optional(),
  })
  .strict();

export const updateLeadSchema = createLeadSchema.partial().merge(
  z
    .object({
      status: z.enum(leadStatusValues).optional(),
    })
    .strict(),
);

export const updateLeadStatusSchema = z
  .object({
    status: z.enum(leadStatusValues),
  })
  .strict();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
