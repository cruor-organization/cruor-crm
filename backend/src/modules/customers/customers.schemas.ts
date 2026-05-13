import { z } from 'zod';

export const CustomerBusinessTypeEnum = z.enum([
  'PHYSICAL_SHOP',
  'EVENT_ATELIER',
  'DECORATOR',
  'HOTEL_RESTAURANT',
  'ONLINE_ONLY',
  'MIXED',
]);

export const PricingTierEnum = z.enum(['STANDARD', 'PROFESSIONAL', 'KEY_ACCOUNT', 'DISTRIBUTOR']);

export const CustomerStatusEnum = z.enum(['PROSPECT', 'ACTIVE', 'AT_RISK', 'CHURNED', 'BLOCKED']);

export const PreferredChannelEnum = z.enum(['WHATSAPP', 'EMAIL', 'PHONE', 'IN_PERSON']);

export const DayOfWeekEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

export const AddressSchema = z
  .object({
    label: z.enum(['BILLING', 'SHIPPING']).default('SHIPPING'),
    line1: z.string().min(3).max(200),
    line2: z.string().max(200).optional(),
    postalCode: z.string().min(3).max(20),
    city: z.string().min(2).max(100),
    country: z.string().length(2).toUpperCase(),
  })
  .strict();

export const ContactSchema = z
  .object({
    name: z.string().min(2).max(100),
    role: z.string().max(80).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).max(40).optional(),
    primary: z.boolean().default(false),
  })
  .strict();

export const createCustomerSchema = z
  .object({
    businessType: CustomerBusinessTypeEnum,
    legalName: z.string().min(2).max(200),
    tradingName: z.string().min(2).max(200).optional(),
    taxId: z.string().min(5).max(40).optional(),
    taxCountry: z.string().length(2).toUpperCase().optional(),
    addresses: z.array(AddressSchema).max(10).default([]),
    contacts: z.array(ContactSchema).max(20).default([]),
    phonePrimary: z.string().min(5).max(40).optional(),
    whatsappNumber: z.string().min(5).max(40).optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    instagramHandle: z.string().max(80).optional(),
    pricingTier: PricingTierEnum.default('STANDARD'),
    salesRepId: z.string().min(1).optional(),
    creditLimitEur: z.coerce.number().min(0).default(0),
    paymentTermDays: z.number().int().min(0).max(365).default(0),
    preferredChannel: PreferredChannelEnum.optional(),
    preferredDeliveryDay: DayOfWeekEnum.optional(),
    shopSizeSqm: z.number().int().min(1).optional(),
    estimatedMonthlyVolumeEur: z.coerce.number().min(0).optional(),
    peakSeasons: z.array(z.string().min(1).max(40)).max(10).default([]),
    status: CustomerStatusEnum.default('ACTIVE'),
    geoLat: z.coerce.number().min(-90).max(90).optional(),
    geoLng: z.coerce.number().min(-180).max(180).optional(),
    deliveryZone: z.string().max(80).optional(),
  })
  .strict();

export const updateCustomerSchema = createCustomerSchema.partial().strict();

export const listCustomersQuerySchema = z
  .object({
    q: z.string().max(200).optional(),
    status: CustomerStatusEnum.optional(),
    tier: PricingTierEnum.optional(),
    salesRepId: z.string().optional(),
    take: z.coerce.number().int().min(1).max(100).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
