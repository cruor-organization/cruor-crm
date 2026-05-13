/**
 * Dados simulados para o módulo de Preços (Fase 2).
 * Inclui PriceLists, PriceListLines, CustomerSpecialPrices e Variants.
 */

// PricingTier — espelha o enum do schema Prisma
export type PricingTier = 'STANDARD' | 'PROFESSIONAL' | 'KEY_ACCOUNT' | 'DISTRIBUTOR';

// PriceListStatus — espelha o enum do schema Prisma
export type PriceListStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

// PriceListCurrency — espelha o enum do schema Prisma
export type PriceListCurrency = 'EUR';

export interface MockPriceList {
  id: string;
  organizationId: string;
  name: string;
  tier: PricingTier;
  currency: PriceListCurrency;
  validFrom: string; // ISO 8601
  validUntil: string | null;
  status: PriceListStatus;
  createdAt: string;
  updatedAt: string;
  lineCount: number;
}

export interface DiscountBreak {
  minQty: number;
  discountPct: number;
}

export interface MockPriceListLine {
  id: string;
  organizationId: string;
  priceListId: string;
  variantId: string;
  unitPriceEur: number;
  minQty: number;
  discountBreaks: DiscountBreak[];
  createdAt: string;
  updatedAt: string;
}

export interface MockCustomerSpecialPrice {
  id: string;
  organizationId: string;
  customerId: string;
  customerName: string; // desnormalizado para UI
  variantId: string;
  variantName: string; // desnormalizado para UI
  unitPriceEur: number;
  validFrom: string;
  validUntil: string | null;
  reason: string | null;
}

export interface MockVariant {
  id: string;
  sku: string;
  name: string; // label do variant
  productName: string; // nome do produto pai
  costEur: number; // custo logístico — base do floor (× 1.10)
}

const ORG = 'org-demo-01';

// ---------------------------------------------------------------------------
// Variants (12 entradas)
// ---------------------------------------------------------------------------

export const mockVariants: MockVariant[] = [
  {
    id: 'var-01',
    sku: 'LIM-SIN-60-NAT',
    name: 'Natural / 60 cm',
    productName: 'Limonium sinuatum',
    costEur: 3.8,
  },
  {
    id: 'var-02',
    sku: 'LIM-SIN-60-LIL',
    name: 'Lilás / 60 cm',
    productName: 'Limonium sinuatum',
    costEur: 3.9,
  },
  {
    id: 'var-03',
    sku: 'EUC-CIN-BCH-200',
    name: 'Ramo 200 g',
    productName: 'Eucalyptus cinerea',
    costEur: 5.2,
  },
  {
    id: 'var-04',
    sku: 'EUC-CIN-BCH-400',
    name: 'Ramo 400 g',
    productName: 'Eucalyptus cinerea',
    costEur: 9.5,
  },
  {
    id: 'var-05',
    sku: 'GYP-PAN-CX50-WHT',
    name: 'Branco / cx 50u',
    productName: 'Gypsophila paniculata',
    costEur: 18.0,
  },
  {
    id: 'var-06',
    sku: 'GYP-PAN-CX50-PNK',
    name: 'Rosa / cx 50u',
    productName: 'Gypsophila paniculata',
    costEur: 18.5,
  },
  {
    id: 'var-07',
    sku: 'LAV-ANG-BDL-100',
    name: 'Fardo 100 g',
    productName: 'Lavandula angustifolia',
    costEur: 4.1,
  },
  {
    id: 'var-08',
    sku: 'HEL-BRA-STM-30',
    name: '30 cm / Caule seco',
    productName: 'Helichrysum bracteatum',
    costEur: 2.6,
  },
  {
    id: 'var-09',
    sku: 'PHY-ALK-BCH-60',
    name: 'Ramo 60 cm',
    productName: 'Physalis alkekengi',
    costEur: 6.3,
  },
  {
    id: 'var-10',
    sku: 'PAN-GIG-STM-50',
    name: '50 cm / Caule',
    productName: 'Pampas grass',
    costEur: 7.8,
  },
  {
    id: 'var-11',
    sku: 'ERI-CUP-BDL-80',
    name: 'Fardo 80 g',
    productName: 'Eryngium cupressinum',
    costEur: 5.5,
  },
  {
    id: 'var-12',
    sku: 'NIK-DAM-CX25-ORG',
    name: 'Laranja / cx 25u',
    productName: 'Nigella damascena',
    costEur: 8.2,
  },
];

// ---------------------------------------------------------------------------
// PriceLists (3 entradas: 1 ARCHIVED, 1 ACTIVE, 1 DRAFT)
// ---------------------------------------------------------------------------

export const mockPriceLists: MockPriceList[] = [
  {
    id: 'pl-01',
    organizationId: ORG,
    name: 'B2B Florista — 2025',
    tier: 'STANDARD',
    currency: 'EUR',
    validFrom: '2025-01-01T00:00:00.000Z',
    validUntil: '2025-12-31T23:59:59.000Z',
    status: 'ARCHIVED',
    createdAt: '2025-01-01T09:00:00.000Z',
    updatedAt: '2026-01-02T08:00:00.000Z',
    lineCount: 8,
  },
  {
    id: 'pl-02',
    organizationId: ORG,
    name: 'B2B Florista — 2026',
    tier: 'STANDARD',
    currency: 'EUR',
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: null,
    status: 'ACTIVE',
    createdAt: '2025-12-15T10:00:00.000Z',
    updatedAt: '2026-05-01T09:00:00.000Z',
    lineCount: 8,
  },
  {
    id: 'pl-03',
    organizationId: ORG,
    name: 'B2B Premium — 2026',
    tier: 'PROFESSIONAL',
    currency: 'EUR',
    validFrom: '2026-06-01T00:00:00.000Z',
    validUntil: null,
    status: 'DRAFT',
    createdAt: '2026-04-20T11:00:00.000Z',
    updatedAt: '2026-05-10T14:00:00.000Z',
    lineCount: 8,
  },
];

// ---------------------------------------------------------------------------
// PriceListLines (8 por lista = 24 linhas)
// ---------------------------------------------------------------------------

// Utilitário — gera linhas para uma lista com preços base realistas
function makeLinesForList(
  priceListId: string,
  multiplier: number, // 1.0 = STANDARD, 0.92 = PROFESSIONAL discount
  dateBase: string,
): MockPriceListLine[] {
  const lines: { variantId: string; baseMultiplier: number }[] = [
    { variantId: 'var-01', baseMultiplier: 1.4 },
    { variantId: 'var-02', baseMultiplier: 1.42 },
    { variantId: 'var-03', baseMultiplier: 1.38 },
    { variantId: 'var-04', baseMultiplier: 1.35 },
    { variantId: 'var-05', baseMultiplier: 1.32 },
    { variantId: 'var-06', baseMultiplier: 1.33 },
    { variantId: 'var-07', baseMultiplier: 1.45 },
    { variantId: 'var-08', baseMultiplier: 1.5 },
  ];

  return lines.map((l, idx) => {
    const variant = mockVariants.find((v) => v.id === l.variantId)!;
    const unitPriceEur = Math.round(variant.costEur * l.baseMultiplier * multiplier * 100) / 100;
    return {
      id: `pll-${priceListId}-${idx + 1}`,
      organizationId: ORG,
      priceListId,
      variantId: l.variantId,
      unitPriceEur,
      minQty: 1,
      discountBreaks: [
        { minQty: 10, discountPct: 0.05 },
        { minQty: 50, discountPct: 0.1 },
      ],
      createdAt: dateBase,
      updatedAt: dateBase,
    };
  });
}

export const mockPriceListLines: MockPriceListLine[] = [
  ...makeLinesForList('pl-01', 1.0, '2025-01-01T09:00:00.000Z'),
  ...makeLinesForList('pl-02', 1.03, '2026-01-01T10:00:00.000Z'),
  ...makeLinesForList('pl-03', 0.92, '2026-04-20T11:00:00.000Z'),
];

// ---------------------------------------------------------------------------
// CustomerSpecialPrices (5 specials)
// ---------------------------------------------------------------------------

export const mockCustomerSpecials: MockCustomerSpecialPrice[] = [
  {
    id: 'csp-01',
    organizationId: ORG,
    customerId: 'cust-ramos-flores',
    customerName: 'Ramos & Flores',
    variantId: 'var-01',
    variantName: 'Limonium sinuatum — Natural / 60 cm',
    unitPriceEur: 4.9,
    validFrom: '2026-03-01T00:00:00.000Z',
    validUntil: '2026-09-30T23:59:59.000Z',
    reason: 'Acordo anual — volume garantido 500u/mês',
  },
  {
    id: 'csp-02',
    organizationId: ORG,
    customerId: 'cust-orquidea-dourada',
    customerName: 'Orquídea Dourada',
    variantId: 'var-03',
    variantName: 'Eucalyptus cinerea — Ramo 200 g',
    unitPriceEur: 6.5,
    validFrom: '2026-01-15T00:00:00.000Z',
    validUntil: null,
    reason: 'Cliente VIP — negociado directo com direcção',
  },
  {
    id: 'csp-03',
    organizationId: ORG,
    customerId: 'cust-sol-e-flor',
    customerName: 'Sol e Flor',
    variantId: 'var-05',
    variantName: 'Gypsophila paniculata — Branco / cx 50u',
    unitPriceEur: 22.5,
    validFrom: '2026-02-01T00:00:00.000Z',
    validUntil: '2025-12-31T23:59:59.000Z', // expirado
    reason: 'Promoção de arranque — 1.º trimestre 2026',
  },
  {
    id: 'csp-04',
    organizationId: ORG,
    customerId: 'cust-jardim-encantado',
    customerName: 'Jardim Encantado',
    variantId: 'var-07',
    variantName: 'Lavandula angustifolia — Fardo 100 g',
    unitPriceEur: 5.2,
    validFrom: '2026-04-01T00:00:00.000Z',
    validUntil: null,
    reason: 'Parceria casamento de época',
  },
  {
    id: 'csp-05',
    organizationId: ORG,
    customerId: 'cust-rosa-perfeita',
    customerName: 'Rosa Perfeita',
    variantId: 'var-10',
    variantName: 'Pampas grass — 50 cm / Caule',
    unitPriceEur: 9.5,
    validFrom: '2026-05-01T00:00:00.000Z',
    validUntil: '2026-10-31T23:59:59.000Z',
    reason: 'Contrato de exclusividade na zona de Madrid',
  },
];
