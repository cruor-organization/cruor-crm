import { z } from 'zod';

import { CustomerBusinessTypeEnum, PricingTierEnum } from '../customers/customers.schemas.js';

export const LeadStatusEnum = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'NEGOTIATING',
  'WON',
  'LOST',
]);

export const LeadSourceEnum = z.enum([
  'REFERRAL',
  'WEBSITE',
  'INSTAGRAM',
  'COLD_OUTREACH',
  'EVENT_FAIR',
  'GOOGLE_PLACES',
  'OTHER',
]);

export const createLeadSchema = z
  .object({
    tradingName: z.string().min(2).max(200),
    legalName: z.string().min(2).max(200).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).max(40).optional(),
    whatsappNumber: z.string().min(5).max(40).optional(),
    source: LeadSourceEnum.default('OTHER'),
    businessType: CustomerBusinessTypeEnum.optional(),
    instagramHandle: z.string().max(80).optional(),
    instagramFollowers: z.number().int().min(0).optional(),
    shopSizeSqm: z.number().int().min(1).optional(),
    estimatedMonthlyVolumeEur: z.coerce.number().min(0).optional(),
    geoZone: z.string().max(80).optional(),
    notes: z.string().max(5000).optional(),
    salesRepId: z.string().min(1).optional(),
    status: LeadStatusEnum.default('NEW'),
  })
  .strict();

export const updateLeadSchema = createLeadSchema.partial().strict();

export const moveLeadStatusSchema = z.object({ status: LeadStatusEnum }).strict();

export const convertLeadSchema = z
  .object({
    legalName: z.string().min(2).max(200),
    taxId: z.string().min(5).max(40),
    taxCountry: z.string().length(2).toUpperCase().default('PT'),
    businessType: CustomerBusinessTypeEnum,
    pricingTier: PricingTierEnum.default('STANDARD'),
  })
  .strict();

export const listLeadsQuerySchema = z
  .object({
    q: z.string().max(200).optional(),
    status: LeadStatusEnum.optional(),
    source: LeadSourceEnum.optional(),
    salesRepId: z.string().optional(),
    take: z.coerce.number().int().min(1).max(200).default(100),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
export type MoveLeadStatusInput = z.infer<typeof moveLeadStatusSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
