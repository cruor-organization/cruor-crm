/**
 * Dados simulados para o módulo de Encomendas (Fase 3).
 * CustomerOrder FSM: DRAFT → AWAITING_PAYMENT → CONFIRMED → PICKING → READY_TO_SHIP → SHIPPED → DELIVERED
 *                                               ↓                                                  ↓
 *                                           CANCELLED                                          RETURNED
 */

export type OrderStatus =
  | 'DRAFT'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'PICKING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type PricingSource = 'TIER_LIST' | 'CUSTOMER_SPECIAL' | 'OVERRIDE';
export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'COD';

export interface OrderLine {
  variantSku: string;
  variantName: string;
  qty: number;
  unitPriceEur: number;
  discountPct: number;
  lineTotalEur: number;
  pricingSource: PricingSource;
}

export interface StatusHistoryEntry {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  by: string;
  at: string;
  note?: string;
}

export interface MockOrder {
  id: string;
  customer: {
    name: string;
    city: string;
  };
  status: OrderStatus;
  lines: OrderLine[];
  subtotalEur: number;
  vatEur: number;
  vatPct: number;
  totalEur: number;
  salesRep: string;
  paymentMethod: PaymentMethod;
  shipping: {
    address: string;
    courier: string | null;
    tracking: string | null;
  };
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  placedAt: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

// ---------------------------------------------------------------------------
// DRAFT (3)
// ---------------------------------------------------------------------------
const ord001: MockOrder = {
  id: 'ORD-2026-0143',
  customer: { name: 'Floricultura Lurdes', city: 'Braga' },
  status: 'DRAFT',
  lines: [
    {
      variantSku: 'LIM-NAT-200G',
      variantName: 'Limonium Natural 200g',
      qty: 20,
      unitPriceEur: 4.5,
      discountPct: 0,
      lineTotalEur: 90,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'EUC-PRES-100G',
      variantName: 'Eucalyptus Preservado 100g',
      qty: 15,
      unitPriceEur: 6.8,
      discountPct: 5,
      lineTotalEur: 96.9,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 186.9,
  vatEur: 43.0,
  vatPct: 23,
  totalEur: 229.9,
  salesRep: 'Ana Marques',
  paymentMethod: 'BANK_TRANSFER',
  shipping: { address: 'Rua das Flores 12, 4700-001 Braga', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Ana Marques', at: '2026-05-10T09:15:00Z' },
  ],
  createdAt: '2026-05-10T09:15:00Z',
  updatedAt: '2026-05-10T09:15:00Z',
  placedAt: null,
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
};

const ord002: MockOrder = {
  id: 'ORD-2026-0144',
  customer: { name: 'Orquídea da Serra', city: 'Covilhã' },
  status: 'DRAFT',
  lines: [
    {
      variantSku: 'HEL-ROS-150G',
      variantName: 'Helichrysum Rosa 150g',
      qty: 30,
      unitPriceEur: 3.9,
      discountPct: 0,
      lineTotalEur: 117,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'LAG-PUR-100G',
      variantName: 'Lagurus Purpura 100g',
      qty: 25,
      unitPriceEur: 2.8,
      discountPct: 0,
      lineTotalEur: 70,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'ROSA-SEC-12U',
      variantName: 'Rosas Secas 12 unidades',
      qty: 10,
      unitPriceEur: 8.5,
      discountPct: 0,
      lineTotalEur: 85,
      pricingSource: 'CUSTOMER_SPECIAL',
    },
  ],
  subtotalEur: 272.0,
  vatEur: 62.56,
  vatPct: 23,
  totalEur: 334.56,
  salesRep: 'Carlos Pinto',
  paymentMethod: 'CARD',
  shipping: { address: 'Av. da Universidade 45, 6200-001 Covilhã', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Carlos Pinto', at: '2026-05-11T14:22:00Z' },
  ],
  createdAt: '2026-05-11T14:22:00Z',
  updatedAt: '2026-05-11T14:22:00Z',
  placedAt: null,
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
};

const ord003: MockOrder = {
  id: 'ORD-2026-0145',
  customer: { name: 'Verde Naranja Madrid', city: 'Madrid' },
  status: 'DRAFT',
  lines: [
    {
      variantSku: 'PAN-PAMP-200G',
      variantName: 'Pampas Grass Natural 200g',
      qty: 50,
      unitPriceEur: 5.2,
      discountPct: 10,
      lineTotalEur: 234,
      pricingSource: 'CUSTOMER_SPECIAL',
    },
    {
      variantSku: 'GNAPH-WHITE-100G',
      variantName: 'Gnaphalium Branco 100g',
      qty: 40,
      unitPriceEur: 2.4,
      discountPct: 0,
      lineTotalEur: 96,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 330.0,
  vatEur: 0,
  vatPct: 0,
  totalEur: 330.0,
  salesRep: 'Ana Marques',
  paymentMethod: 'BANK_TRANSFER',
  shipping: {
    address: 'Calle Mayor 88, 28013 Madrid, España',
    courier: null,
    tracking: null,
  },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Ana Marques', at: '2026-05-12T10:00:00Z' },
  ],
  createdAt: '2026-05-12T10:00:00Z',
  updatedAt: '2026-05-12T10:00:00Z',
  placedAt: null,
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
};

// ---------------------------------------------------------------------------
// AWAITING_PAYMENT (4)
// ---------------------------------------------------------------------------
const ord004: MockOrder = {
  id: 'ORD-2026-0138',
  customer: { name: 'Flores do Vale Lda', city: 'Viseu' },
  status: 'AWAITING_PAYMENT',
  lines: [
    {
      variantSku: 'LIM-NAT-200G',
      variantName: 'Limonium Natural 200g',
      qty: 40,
      unitPriceEur: 4.2,
      discountPct: 7,
      lineTotalEur: 156.12,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'BROOM-BLOOM-200G',
      variantName: 'Broom Bloom 200g',
      qty: 20,
      unitPriceEur: 3.6,
      discountPct: 0,
      lineTotalEur: 72,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 228.12,
  vatEur: 52.47,
  vatPct: 23,
  totalEur: 280.59,
  salesRep: 'Sofia Rebelo',
  paymentMethod: 'BANK_TRANSFER',
  shipping: { address: 'Rua Direita 34, 3500-150 Viseu', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Sofia Rebelo', at: '2026-05-07T08:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Sofia Rebelo',
      at: '2026-05-08T09:30:00Z',
      note: 'Enviada pro-forma ao cliente.',
    },
  ],
  createdAt: '2026-05-07T08:00:00Z',
  updatedAt: '2026-05-08T09:30:00Z',
  placedAt: '2026-05-08T09:30:00Z',
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
};

const ord005: MockOrder = {
  id: 'ORD-2026-0139',
  customer: { name: 'Ramos & Flores', city: 'Aveiro' },
  status: 'AWAITING_PAYMENT',
  lines: [
    {
      variantSku: 'ROSA-SEC-12U',
      variantName: 'Rosas Secas 12 unidades',
      qty: 50,
      unitPriceEur: 7.9,
      discountPct: 0,
      lineTotalEur: 395,
      pricingSource: 'CUSTOMER_SPECIAL',
    },
    {
      variantSku: 'EUC-PRES-100G',
      variantName: 'Eucalyptus Preservado 100g',
      qty: 30,
      unitPriceEur: 6.8,
      discountPct: 5,
      lineTotalEur: 193.8,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'LAV-BUND-50G',
      variantName: 'Lavanda Seca 50g',
      qty: 60,
      unitPriceEur: 1.95,
      discountPct: 0,
      lineTotalEur: 117,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 705.8,
  vatEur: 162.33,
  vatPct: 23,
  totalEur: 868.13,
  salesRep: 'Carlos Pinto',
  paymentMethod: 'BANK_TRANSFER',
  shipping: { address: 'Rua da República 22, 3800-100 Aveiro', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Carlos Pinto', at: '2026-05-06T11:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Carlos Pinto',
      at: '2026-05-07T14:00:00Z',
    },
  ],
  createdAt: '2026-05-06T11:00:00Z',
  updatedAt: '2026-05-07T14:00:00Z',
  placedAt: '2026-05-07T14:00:00Z',
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
};

const ord006: MockOrder = {
  id: 'ORD-2026-0140',
  customer: { name: 'La Rosa Seca Barcelona', city: 'Barcelona' },
  status: 'AWAITING_PAYMENT',
  lines: [
    {
      variantSku: 'HEL-ORG-150G',
      variantName: 'Helichrysum Laranja 150g',
      qty: 80,
      unitPriceEur: 3.75,
      discountPct: 8,
      lineTotalEur: 276.0,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'STRAW-FLWR-100G',
      variantName: 'Strawflower Variado 100g',
      qty: 60,
      unitPriceEur: 3.2,
      discountPct: 0,
      lineTotalEur: 192.0,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 468.0,
  vatEur: 0,
  vatPct: 0,
  totalEur: 468.0,
  salesRep: 'Ana Marques',
  paymentMethod: 'BANK_TRANSFER',
  shipping: {
    address: 'Carrer de Provença 120, 08029 Barcelona, España',
    courier: null,
    tracking: null,
  },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Ana Marques', at: '2026-05-05T09:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Ana Marques',
      at: '2026-05-06T10:15:00Z',
    },
  ],
  createdAt: '2026-05-05T09:00:00Z',
  updatedAt: '2026-05-06T10:15:00Z',
  placedAt: '2026-05-06T10:15:00Z',
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
};

const ord007: MockOrder = {
  id: 'ORD-2026-0141',
  customer: { name: 'Jardim Encantado', city: 'Setúbal' },
  status: 'AWAITING_PAYMENT',
  lines: [
    {
      variantSku: 'PALM-BLEACH-1U',
      variantName: 'Folha Palmeira Branqueada',
      qty: 120,
      unitPriceEur: 1.85,
      discountPct: 0,
      lineTotalEur: 222.0,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'LAG-NAT-100G',
      variantName: 'Lagurus Natural 100g',
      qty: 50,
      unitPriceEur: 2.6,
      discountPct: 5,
      lineTotalEur: 123.5,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 345.5,
  vatEur: 79.47,
  vatPct: 23,
  totalEur: 424.97,
  salesRep: 'Sofia Rebelo',
  paymentMethod: 'COD',
  shipping: { address: 'Av. Luísa Todi 88, 2900-400 Setúbal', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Sofia Rebelo', at: '2026-05-08T13:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Sofia Rebelo',
      at: '2026-05-09T09:00:00Z',
    },
  ],
  createdAt: '2026-05-08T13:00:00Z',
  updatedAt: '2026-05-09T09:00:00Z',
  placedAt: '2026-05-09T09:00:00Z',
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
};

// ---------------------------------------------------------------------------
// CONFIRMED (5)
// ---------------------------------------------------------------------------
const ord008: MockOrder = {
  id: 'ORD-2026-0132',
  customer: { name: 'Rosa Perfeita', city: 'Porto' },
  status: 'CONFIRMED',
  lines: [
    {
      variantSku: 'LIM-NAT-200G',
      variantName: 'Limonium Natural 200g',
      qty: 60,
      unitPriceEur: 4.2,
      discountPct: 7,
      lineTotalEur: 234.36,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'ROSA-SEC-12U',
      variantName: 'Rosas Secas 12 unidades',
      qty: 40,
      unitPriceEur: 7.5,
      discountPct: 10,
      lineTotalEur: 270.0,
      pricingSource: 'CUSTOMER_SPECIAL',
    },
    {
      variantSku: 'BROOM-BLOOM-200G',
      variantName: 'Broom Bloom 200g',
      qty: 30,
      unitPriceEur: 3.5,
      discountPct: 0,
      lineTotalEur: 105.0,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 609.36,
  vatEur: 140.15,
  vatPct: 23,
  totalEur: 749.51,
  salesRep: 'Carlos Pinto',
  paymentMethod: 'BANK_TRANSFER',
  shipping: {
    address: 'Rua Mouzinho da Silveira 100, 4050-416 Porto',
    courier: null,
    tracking: null,
  },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Carlos Pinto', at: '2026-04-28T10:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Carlos Pinto',
      at: '2026-04-29T11:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-04-30T09:15:00Z',
      note: 'Pagamento recebido via transferência bancária.',
    },
  ],
  createdAt: '2026-04-28T10:00:00Z',
  updatedAt: '2026-04-30T09:15:00Z',
  placedAt: '2026-04-29T11:00:00Z',
  confirmedAt: '2026-04-30T09:15:00Z',
  shippedAt: null,
  deliveredAt: null,
};

const ord009: MockOrder = {
  id: 'ORD-2026-0133',
  customer: { name: 'Floricultura Margarida', city: 'Faro' },
  status: 'CONFIRMED',
  lines: [
    {
      variantSku: 'EUC-PRES-100G',
      variantName: 'Eucalyptus Preservado 100g',
      qty: 80,
      unitPriceEur: 6.5,
      discountPct: 5,
      lineTotalEur: 494.0,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'HEL-ROS-150G',
      variantName: 'Helichrysum Rosa 150g',
      qty: 50,
      unitPriceEur: 3.7,
      discountPct: 0,
      lineTotalEur: 185.0,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 679.0,
  vatEur: 156.17,
  vatPct: 23,
  totalEur: 835.17,
  salesRep: 'Ana Marques',
  paymentMethod: 'CARD',
  shipping: { address: 'Rua de Santo António 55, 8000-290 Faro', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Ana Marques', at: '2026-04-29T08:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Ana Marques',
      at: '2026-04-30T10:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-05-01T14:00:00Z',
      note: 'Pagamento por cartão confirmado.',
    },
  ],
  createdAt: '2026-04-29T08:00:00Z',
  updatedAt: '2026-05-01T14:00:00Z',
  placedAt: '2026-04-30T10:00:00Z',
  confirmedAt: '2026-05-01T14:00:00Z',
  shippedAt: null,
  deliveredAt: null,
};

const ord010: MockOrder = {
  id: 'ORD-2026-0134',
  customer: { name: 'Sol e Flor Lda', city: 'Lisboa' },
  status: 'CONFIRMED',
  lines: [
    {
      variantSku: 'PAN-PAMP-200G',
      variantName: 'Pampas Grass Natural 200g',
      qty: 100,
      unitPriceEur: 4.9,
      discountPct: 12,
      lineTotalEur: 431.2,
      pricingSource: 'CUSTOMER_SPECIAL',
    },
    {
      variantSku: 'LAV-BUND-50G',
      variantName: 'Lavanda Seca 50g',
      qty: 200,
      unitPriceEur: 1.8,
      discountPct: 0,
      lineTotalEur: 360.0,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'PALM-BLEACH-1U',
      variantName: 'Folha Palmeira Branqueada',
      qty: 150,
      unitPriceEur: 1.75,
      discountPct: 5,
      lineTotalEur: 248.63,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 1039.83,
  vatEur: 239.16,
  vatPct: 23,
  totalEur: 1278.99,
  salesRep: 'Carlos Pinto',
  paymentMethod: 'BANK_TRANSFER',
  shipping: { address: 'Rua Augusta 100, 1100-048 Lisboa', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Carlos Pinto', at: '2026-04-27T09:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Carlos Pinto',
      at: '2026-04-28T11:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-04-30T16:30:00Z',
    },
  ],
  createdAt: '2026-04-27T09:00:00Z',
  updatedAt: '2026-04-30T16:30:00Z',
  placedAt: '2026-04-28T11:00:00Z',
  confirmedAt: '2026-04-30T16:30:00Z',
  shippedAt: null,
  deliveredAt: null,
};

const ord011: MockOrder = {
  id: 'ORD-2026-0135',
  customer: { name: 'Mercado das Flores', city: 'Coimbra' },
  status: 'CONFIRMED',
  lines: [
    {
      variantSku: 'STRAW-FLWR-100G',
      variantName: 'Strawflower Variado 100g',
      qty: 120,
      unitPriceEur: 3.1,
      discountPct: 0,
      lineTotalEur: 372.0,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'GNAPH-WHITE-100G',
      variantName: 'Gnaphalium Branco 100g',
      qty: 80,
      unitPriceEur: 2.35,
      discountPct: 0,
      lineTotalEur: 188.0,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 560.0,
  vatEur: 128.8,
  vatPct: 23,
  totalEur: 688.8,
  salesRep: 'Sofia Rebelo',
  paymentMethod: 'CARD',
  shipping: { address: 'Rua Ferreira Borges 45, 3000-178 Coimbra', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Sofia Rebelo', at: '2026-05-02T08:30:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Sofia Rebelo',
      at: '2026-05-03T10:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-05-04T09:00:00Z',
    },
  ],
  createdAt: '2026-05-02T08:30:00Z',
  updatedAt: '2026-05-04T09:00:00Z',
  placedAt: '2026-05-03T10:00:00Z',
  confirmedAt: '2026-05-04T09:00:00Z',
  shippedAt: null,
  deliveredAt: null,
};

const ord012: MockOrder = {
  id: 'ORD-2026-0136',
  customer: { name: 'Flores Ibéricas SL', city: 'Salamanca' },
  status: 'CONFIRMED',
  lines: [
    {
      variantSku: 'LIM-NAT-200G',
      variantName: 'Limonium Natural 200g',
      qty: 200,
      unitPriceEur: 4.0,
      discountPct: 12,
      lineTotalEur: 704.0,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'HEL-ORG-150G',
      variantName: 'Helichrysum Laranja 150g',
      qty: 150,
      unitPriceEur: 3.5,
      discountPct: 10,
      lineTotalEur: 472.5,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 1176.5,
  vatEur: 0,
  vatPct: 0,
  totalEur: 1176.5,
  salesRep: 'Ana Marques',
  paymentMethod: 'BANK_TRANSFER',
  shipping: { address: 'Plaza Mayor 12, 37001 Salamanca, España', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Ana Marques', at: '2026-05-01T09:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Ana Marques',
      at: '2026-05-02T11:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-05-05T10:00:00Z',
    },
  ],
  createdAt: '2026-05-01T09:00:00Z',
  updatedAt: '2026-05-05T10:00:00Z',
  placedAt: '2026-05-02T11:00:00Z',
  confirmedAt: '2026-05-05T10:00:00Z',
  shippedAt: null,
  deliveredAt: null,
};

// ---------------------------------------------------------------------------
// PICKING (3)
// ---------------------------------------------------------------------------
const ord013: MockOrder = {
  id: 'ORD-2026-0125',
  customer: { name: 'Floricultura Lurdes', city: 'Braga' },
  status: 'PICKING',
  lines: [
    {
      variantSku: 'ROSA-SEC-12U',
      variantName: 'Rosas Secas 12 unidades',
      qty: 60,
      unitPriceEur: 7.5,
      discountPct: 10,
      lineTotalEur: 405.0,
      pricingSource: 'CUSTOMER_SPECIAL',
    },
    {
      variantSku: 'EUC-PRES-100G',
      variantName: 'Eucalyptus Preservado 100g',
      qty: 40,
      unitPriceEur: 6.5,
      discountPct: 5,
      lineTotalEur: 247.0,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 652.0,
  vatEur: 149.96,
  vatPct: 23,
  totalEur: 801.96,
  salesRep: 'Sofia Rebelo',
  paymentMethod: 'BANK_TRANSFER',
  shipping: { address: 'Rua das Flores 12, 4700-001 Braga', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Sofia Rebelo', at: '2026-04-20T08:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Sofia Rebelo',
      at: '2026-04-21T10:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-04-22T11:00:00Z',
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKING',
      by: 'João Armazém',
      at: '2026-04-25T08:30:00Z',
      note: 'Picking iniciado.',
    },
  ],
  createdAt: '2026-04-20T08:00:00Z',
  updatedAt: '2026-04-25T08:30:00Z',
  placedAt: '2026-04-21T10:00:00Z',
  confirmedAt: '2026-04-22T11:00:00Z',
  shippedAt: null,
  deliveredAt: null,
};

const ord014: MockOrder = {
  id: 'ORD-2026-0126',
  customer: { name: 'Bouquet Shop Porto', city: 'Porto' },
  status: 'PICKING',
  lines: [
    {
      variantSku: 'LAG-PUR-100G',
      variantName: 'Lagurus Purpura 100g',
      qty: 100,
      unitPriceEur: 2.7,
      discountPct: 0,
      lineTotalEur: 270.0,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'HEL-ROS-150G',
      variantName: 'Helichrysum Rosa 150g',
      qty: 80,
      unitPriceEur: 3.7,
      discountPct: 5,
      lineTotalEur: 281.2,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'LAV-BUND-50G',
      variantName: 'Lavanda Seca 50g',
      qty: 100,
      unitPriceEur: 1.8,
      discountPct: 0,
      lineTotalEur: 180.0,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 731.2,
  vatEur: 168.18,
  vatPct: 23,
  totalEur: 899.38,
  salesRep: 'Carlos Pinto',
  paymentMethod: 'CARD',
  shipping: { address: 'Av. dos Aliados 120, 4000-065 Porto', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Carlos Pinto', at: '2026-04-22T09:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Carlos Pinto',
      at: '2026-04-23T10:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-04-24T09:30:00Z',
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKING',
      by: 'João Armazém',
      at: '2026-04-27T08:00:00Z',
    },
  ],
  createdAt: '2026-04-22T09:00:00Z',
  updatedAt: '2026-04-27T08:00:00Z',
  placedAt: '2026-04-23T10:00:00Z',
  confirmedAt: '2026-04-24T09:30:00Z',
  shippedAt: null,
  deliveredAt: null,
};

const ord015: MockOrder = {
  id: 'ORD-2026-0127',
  customer: { name: 'Orquídea Dourada', city: 'Évora' },
  status: 'PICKING',
  lines: [
    {
      variantSku: 'PALM-BLEACH-1U',
      variantName: 'Folha Palmeira Branqueada',
      qty: 200,
      unitPriceEur: 1.7,
      discountPct: 8,
      lineTotalEur: 312.8,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'PAN-PAMP-200G',
      variantName: 'Pampas Grass Natural 200g',
      qty: 60,
      unitPriceEur: 4.8,
      discountPct: 10,
      lineTotalEur: 259.2,
      pricingSource: 'CUSTOMER_SPECIAL',
    },
  ],
  subtotalEur: 572.0,
  vatEur: 131.56,
  vatPct: 23,
  totalEur: 703.56,
  salesRep: 'Ana Marques',
  paymentMethod: 'BANK_TRANSFER',
  shipping: { address: 'Praça do Giraldo 8, 7000-508 Évora', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Ana Marques', at: '2026-04-23T10:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Ana Marques',
      at: '2026-04-24T11:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-04-25T10:00:00Z',
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKING',
      by: 'Maria Armazém',
      at: '2026-04-28T09:00:00Z',
    },
  ],
  createdAt: '2026-04-23T10:00:00Z',
  updatedAt: '2026-04-28T09:00:00Z',
  placedAt: '2026-04-24T11:00:00Z',
  confirmedAt: '2026-04-25T10:00:00Z',
  shippedAt: null,
  deliveredAt: null,
};

// ---------------------------------------------------------------------------
// READY_TO_SHIP (2)
// ---------------------------------------------------------------------------
const ord016: MockOrder = {
  id: 'ORD-2026-0118',
  customer: { name: 'Flores da Ribeira', city: 'Guimarães' },
  status: 'READY_TO_SHIP',
  lines: [
    {
      variantSku: 'LIM-NAT-200G',
      variantName: 'Limonium Natural 200g',
      qty: 80,
      unitPriceEur: 4.1,
      discountPct: 7,
      lineTotalEur: 304.24,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'BROOM-BLOOM-200G',
      variantName: 'Broom Bloom 200g',
      qty: 50,
      unitPriceEur: 3.4,
      discountPct: 0,
      lineTotalEur: 170.0,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'STRAW-FLWR-100G',
      variantName: 'Strawflower Variado 100g',
      qty: 60,
      unitPriceEur: 3.0,
      discountPct: 5,
      lineTotalEur: 171.0,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 645.24,
  vatEur: 148.41,
  vatPct: 23,
  totalEur: 793.65,
  salesRep: 'Sofia Rebelo',
  paymentMethod: 'BANK_TRANSFER',
  shipping: {
    address: 'Rua de Santo António 20, 4810-400 Guimarães',
    courier: null,
    tracking: null,
  },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Sofia Rebelo', at: '2026-04-15T09:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Sofia Rebelo',
      at: '2026-04-16T10:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-04-17T09:00:00Z',
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKING',
      by: 'João Armazém',
      at: '2026-04-20T08:00:00Z',
    },
    {
      fromStatus: 'PICKING',
      toStatus: 'READY_TO_SHIP',
      by: 'João Armazém',
      at: '2026-04-22T16:00:00Z',
      note: 'Volumes preparados e pesados.',
    },
  ],
  createdAt: '2026-04-15T09:00:00Z',
  updatedAt: '2026-04-22T16:00:00Z',
  placedAt: '2026-04-16T10:00:00Z',
  confirmedAt: '2026-04-17T09:00:00Z',
  shippedAt: null,
  deliveredAt: null,
};

const ord017: MockOrder = {
  id: 'ORD-2026-0119',
  customer: { name: 'Florística Sevilha', city: 'Sevilla' },
  status: 'READY_TO_SHIP',
  lines: [
    {
      variantSku: 'HEL-ROS-150G',
      variantName: 'Helichrysum Rosa 150g',
      qty: 200,
      unitPriceEur: 3.5,
      discountPct: 10,
      lineTotalEur: 630.0,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'LAG-PUR-100G',
      variantName: 'Lagurus Purpura 100g',
      qty: 120,
      unitPriceEur: 2.6,
      discountPct: 0,
      lineTotalEur: 312.0,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 942.0,
  vatEur: 0,
  vatPct: 0,
  totalEur: 942.0,
  salesRep: 'Ana Marques',
  paymentMethod: 'BANK_TRANSFER',
  shipping: {
    address: 'Calle Sierpes 70, 41001 Sevilla, España',
    courier: null,
    tracking: null,
  },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Ana Marques', at: '2026-04-16T09:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Ana Marques',
      at: '2026-04-17T11:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-04-19T10:00:00Z',
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKING',
      by: 'Maria Armazém',
      at: '2026-04-21T08:00:00Z',
    },
    {
      fromStatus: 'PICKING',
      toStatus: 'READY_TO_SHIP',
      by: 'Maria Armazém',
      at: '2026-04-23T15:30:00Z',
    },
  ],
  createdAt: '2026-04-16T09:00:00Z',
  updatedAt: '2026-04-23T15:30:00Z',
  placedAt: '2026-04-17T11:00:00Z',
  confirmedAt: '2026-04-19T10:00:00Z',
  shippedAt: null,
  deliveredAt: null,
};

// ---------------------------------------------------------------------------
// SHIPPED (3)
// ---------------------------------------------------------------------------
const ord018: MockOrder = {
  id: 'ORD-2026-0110',
  customer: { name: 'Rosa Perfeita', city: 'Porto' },
  status: 'SHIPPED',
  lines: [
    {
      variantSku: 'EUC-PRES-100G',
      variantName: 'Eucalyptus Preservado 100g',
      qty: 100,
      unitPriceEur: 6.3,
      discountPct: 8,
      lineTotalEur: 579.6,
      pricingSource: 'CUSTOMER_SPECIAL',
    },
    {
      variantSku: 'ROSA-SEC-12U',
      variantName: 'Rosas Secas 12 unidades',
      qty: 80,
      unitPriceEur: 7.5,
      discountPct: 10,
      lineTotalEur: 540.0,
      pricingSource: 'CUSTOMER_SPECIAL',
    },
  ],
  subtotalEur: 1119.6,
  vatEur: 257.51,
  vatPct: 23,
  totalEur: 1377.11,
  salesRep: 'Carlos Pinto',
  paymentMethod: 'BANK_TRANSFER',
  shipping: {
    address: 'Rua Mouzinho da Silveira 100, 4050-416 Porto',
    courier: 'CTT Expresso',
    tracking: 'CTT-2026-PA123456',
  },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Carlos Pinto', at: '2026-04-05T09:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Carlos Pinto',
      at: '2026-04-06T10:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-04-07T09:30:00Z',
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKING',
      by: 'João Armazém',
      at: '2026-04-09T08:00:00Z',
    },
    {
      fromStatus: 'PICKING',
      toStatus: 'READY_TO_SHIP',
      by: 'João Armazém',
      at: '2026-04-11T16:00:00Z',
    },
    {
      fromStatus: 'READY_TO_SHIP',
      toStatus: 'SHIPPED',
      by: 'Sofia Rebelo',
      at: '2026-04-12T09:00:00Z',
      note: 'Expedido via CTT Expresso.',
    },
  ],
  createdAt: '2026-04-05T09:00:00Z',
  updatedAt: '2026-04-12T09:00:00Z',
  placedAt: '2026-04-06T10:00:00Z',
  confirmedAt: '2026-04-07T09:30:00Z',
  shippedAt: '2026-04-12T09:00:00Z',
  deliveredAt: null,
};

const ord019: MockOrder = {
  id: 'ORD-2026-0111',
  customer: { name: 'Flor do Norte', city: 'Viana do Castelo' },
  status: 'SHIPPED',
  lines: [
    {
      variantSku: 'LAG-NAT-100G',
      variantName: 'Lagurus Natural 100g',
      qty: 150,
      unitPriceEur: 2.5,
      discountPct: 0,
      lineTotalEur: 375.0,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'HEL-ORG-150G',
      variantName: 'Helichrysum Laranja 150g',
      qty: 100,
      unitPriceEur: 3.5,
      discountPct: 5,
      lineTotalEur: 332.5,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 707.5,
  vatEur: 162.73,
  vatPct: 23,
  totalEur: 870.23,
  salesRep: 'Ana Marques',
  paymentMethod: 'CARD',
  shipping: {
    address: 'Rua do Gontim 15, 4900-515 Viana do Castelo',
    courier: 'DPD Portugal',
    tracking: 'DPD-2026-PT987654',
  },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Ana Marques', at: '2026-04-06T10:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Ana Marques',
      at: '2026-04-07T11:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-04-08T10:00:00Z',
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKING',
      by: 'Maria Armazém',
      at: '2026-04-10T08:00:00Z',
    },
    {
      fromStatus: 'PICKING',
      toStatus: 'READY_TO_SHIP',
      by: 'Maria Armazém',
      at: '2026-04-12T17:00:00Z',
    },
    {
      fromStatus: 'READY_TO_SHIP',
      toStatus: 'SHIPPED',
      by: 'Carlos Pinto',
      at: '2026-04-13T08:30:00Z',
    },
  ],
  createdAt: '2026-04-06T10:00:00Z',
  updatedAt: '2026-04-13T08:30:00Z',
  placedAt: '2026-04-07T11:00:00Z',
  confirmedAt: '2026-04-08T10:00:00Z',
  shippedAt: '2026-04-13T08:30:00Z',
  deliveredAt: null,
};

const ord020: MockOrder = {
  id: 'ORD-2026-0112',
  customer: { name: 'Floristería Valencia', city: 'Valencia' },
  status: 'SHIPPED',
  lines: [
    {
      variantSku: 'GNAPH-WHITE-100G',
      variantName: 'Gnaphalium Branco 100g',
      qty: 200,
      unitPriceEur: 2.2,
      discountPct: 0,
      lineTotalEur: 440.0,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'PAN-PAMP-200G',
      variantName: 'Pampas Grass Natural 200g',
      qty: 80,
      unitPriceEur: 4.6,
      discountPct: 8,
      lineTotalEur: 338.56,
      pricingSource: 'OVERRIDE',
    },
  ],
  subtotalEur: 778.56,
  vatEur: 0,
  vatPct: 0,
  totalEur: 778.56,
  salesRep: 'Ana Marques',
  paymentMethod: 'BANK_TRANSFER',
  shipping: {
    address: 'Calle Colón 78, 46004 Valencia, España',
    courier: 'MRW España',
    tracking: 'MRW-2026-ES112233',
  },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Ana Marques', at: '2026-04-07T09:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Ana Marques',
      at: '2026-04-08T10:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-04-10T09:00:00Z',
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKING',
      by: 'João Armazém',
      at: '2026-04-12T08:00:00Z',
    },
    {
      fromStatus: 'PICKING',
      toStatus: 'READY_TO_SHIP',
      by: 'João Armazém',
      at: '2026-04-14T16:00:00Z',
    },
    {
      fromStatus: 'READY_TO_SHIP',
      toStatus: 'SHIPPED',
      by: 'Sofia Rebelo',
      at: '2026-04-15T08:00:00Z',
    },
  ],
  createdAt: '2026-04-07T09:00:00Z',
  updatedAt: '2026-04-15T08:00:00Z',
  placedAt: '2026-04-08T10:00:00Z',
  confirmedAt: '2026-04-10T09:00:00Z',
  shippedAt: '2026-04-15T08:00:00Z',
  deliveredAt: null,
};

// ---------------------------------------------------------------------------
// DELIVERED (3)
// ---------------------------------------------------------------------------
const ord021: MockOrder = {
  id: 'ORD-2026-0098',
  customer: { name: 'Sol e Flor Lda', city: 'Lisboa' },
  status: 'DELIVERED',
  lines: [
    {
      variantSku: 'LIM-NAT-200G',
      variantName: 'Limonium Natural 200g',
      qty: 120,
      unitPriceEur: 4.0,
      discountPct: 12,
      lineTotalEur: 422.4,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'ROSA-SEC-12U',
      variantName: 'Rosas Secas 12 unidades',
      qty: 100,
      unitPriceEur: 7.5,
      discountPct: 10,
      lineTotalEur: 675.0,
      pricingSource: 'CUSTOMER_SPECIAL',
    },
    {
      variantSku: 'LAV-BUND-50G',
      variantName: 'Lavanda Seca 50g',
      qty: 300,
      unitPriceEur: 1.7,
      discountPct: 0,
      lineTotalEur: 510.0,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 1607.4,
  vatEur: 369.7,
  vatPct: 23,
  totalEur: 1977.1,
  salesRep: 'Carlos Pinto',
  paymentMethod: 'BANK_TRANSFER',
  shipping: {
    address: 'Rua Augusta 100, 1100-048 Lisboa',
    courier: 'CTT Expresso',
    tracking: 'CTT-2026-LB654321',
  },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Carlos Pinto', at: '2026-03-20T09:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Carlos Pinto',
      at: '2026-03-21T10:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-03-23T09:00:00Z',
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKING',
      by: 'João Armazém',
      at: '2026-03-25T08:00:00Z',
    },
    {
      fromStatus: 'PICKING',
      toStatus: 'READY_TO_SHIP',
      by: 'João Armazém',
      at: '2026-03-27T16:00:00Z',
    },
    {
      fromStatus: 'READY_TO_SHIP',
      toStatus: 'SHIPPED',
      by: 'Sofia Rebelo',
      at: '2026-03-28T08:00:00Z',
    },
    {
      fromStatus: 'SHIPPED',
      toStatus: 'DELIVERED',
      by: 'Sistema',
      at: '2026-04-01T12:00:00Z',
      note: 'Entregue ao destinatário.',
    },
  ],
  createdAt: '2026-03-20T09:00:00Z',
  updatedAt: '2026-04-01T12:00:00Z',
  placedAt: '2026-03-21T10:00:00Z',
  confirmedAt: '2026-03-23T09:00:00Z',
  shippedAt: '2026-03-28T08:00:00Z',
  deliveredAt: '2026-04-01T12:00:00Z',
};

const ord022: MockOrder = {
  id: 'ORD-2026-0099',
  customer: { name: 'Flores Ibéricas SL', city: 'Salamanca' },
  status: 'DELIVERED',
  lines: [
    {
      variantSku: 'HEL-ROS-150G',
      variantName: 'Helichrysum Rosa 150g',
      qty: 300,
      unitPriceEur: 3.4,
      discountPct: 12,
      lineTotalEur: 897.6,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'EUC-PRES-100G',
      variantName: 'Eucalyptus Preservado 100g',
      qty: 200,
      unitPriceEur: 6.2,
      discountPct: 10,
      lineTotalEur: 1116.0,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 2013.6,
  vatEur: 0,
  vatPct: 0,
  totalEur: 2013.6,
  salesRep: 'Ana Marques',
  paymentMethod: 'BANK_TRANSFER',
  shipping: {
    address: 'Plaza Mayor 12, 37001 Salamanca, España',
    courier: 'SEUR España',
    tracking: 'SEUR-2026-SA445566',
  },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Ana Marques', at: '2026-03-18T09:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Ana Marques',
      at: '2026-03-19T11:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-03-21T10:00:00Z',
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKING',
      by: 'Maria Armazém',
      at: '2026-03-23T08:00:00Z',
    },
    {
      fromStatus: 'PICKING',
      toStatus: 'READY_TO_SHIP',
      by: 'Maria Armazém',
      at: '2026-03-25T15:00:00Z',
    },
    {
      fromStatus: 'READY_TO_SHIP',
      toStatus: 'SHIPPED',
      by: 'Carlos Pinto',
      at: '2026-03-26T09:00:00Z',
    },
    {
      fromStatus: 'SHIPPED',
      toStatus: 'DELIVERED',
      by: 'Sistema',
      at: '2026-03-31T14:00:00Z',
    },
  ],
  createdAt: '2026-03-18T09:00:00Z',
  updatedAt: '2026-03-31T14:00:00Z',
  placedAt: '2026-03-19T11:00:00Z',
  confirmedAt: '2026-03-21T10:00:00Z',
  shippedAt: '2026-03-26T09:00:00Z',
  deliveredAt: '2026-03-31T14:00:00Z',
};

const ord023: MockOrder = {
  id: 'ORD-2026-0100',
  customer: { name: 'Bouquet Shop Porto', city: 'Porto' },
  status: 'DELIVERED',
  lines: [
    {
      variantSku: 'BROOM-BLOOM-200G',
      variantName: 'Broom Bloom 200g',
      qty: 100,
      unitPriceEur: 3.3,
      discountPct: 0,
      lineTotalEur: 330.0,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'STRAW-FLWR-100G',
      variantName: 'Strawflower Variado 100g',
      qty: 150,
      unitPriceEur: 2.9,
      discountPct: 5,
      lineTotalEur: 412.88,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 742.88,
  vatEur: 170.86,
  vatPct: 23,
  totalEur: 913.74,
  salesRep: 'Sofia Rebelo',
  paymentMethod: 'CARD',
  shipping: {
    address: 'Av. dos Aliados 120, 4000-065 Porto',
    courier: 'DPD Portugal',
    tracking: 'DPD-2026-PT334455',
  },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Sofia Rebelo', at: '2026-03-22T10:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Sofia Rebelo',
      at: '2026-03-23T11:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-03-24T09:00:00Z',
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKING',
      by: 'João Armazém',
      at: '2026-03-26T08:00:00Z',
    },
    {
      fromStatus: 'PICKING',
      toStatus: 'READY_TO_SHIP',
      by: 'João Armazém',
      at: '2026-03-28T17:00:00Z',
    },
    {
      fromStatus: 'READY_TO_SHIP',
      toStatus: 'SHIPPED',
      by: 'Ana Marques',
      at: '2026-03-29T08:00:00Z',
    },
    {
      fromStatus: 'SHIPPED',
      toStatus: 'DELIVERED',
      by: 'Sistema',
      at: '2026-04-02T10:00:00Z',
    },
  ],
  createdAt: '2026-03-22T10:00:00Z',
  updatedAt: '2026-04-02T10:00:00Z',
  placedAt: '2026-03-23T11:00:00Z',
  confirmedAt: '2026-03-24T09:00:00Z',
  shippedAt: '2026-03-29T08:00:00Z',
  deliveredAt: '2026-04-02T10:00:00Z',
};

// ---------------------------------------------------------------------------
// CANCELLED (1)
// ---------------------------------------------------------------------------
const ord024: MockOrder = {
  id: 'ORD-2026-0085',
  customer: { name: 'Jardim Encantado', city: 'Setúbal' },
  status: 'CANCELLED',
  lines: [
    {
      variantSku: 'EUC-PRES-100G',
      variantName: 'Eucalyptus Preservado 100g',
      qty: 50,
      unitPriceEur: 6.5,
      discountPct: 5,
      lineTotalEur: 308.75,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 308.75,
  vatEur: 71.01,
  vatPct: 23,
  totalEur: 379.76,
  salesRep: 'Sofia Rebelo',
  paymentMethod: 'BANK_TRANSFER',
  shipping: { address: 'Av. Luísa Todi 88, 2900-400 Setúbal', courier: null, tracking: null },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Sofia Rebelo', at: '2026-03-10T09:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Sofia Rebelo',
      at: '2026-03-11T11:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CANCELLED',
      by: 'Sofia Rebelo',
      at: '2026-03-18T15:00:00Z',
      note: 'Cliente não efectuou pagamento no prazo.',
    },
  ],
  createdAt: '2026-03-10T09:00:00Z',
  updatedAt: '2026-03-18T15:00:00Z',
  placedAt: '2026-03-11T11:00:00Z',
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
};

// ---------------------------------------------------------------------------
// RETURNED (1)
// ---------------------------------------------------------------------------
const ord025: MockOrder = {
  id: 'ORD-2026-0072',
  customer: { name: 'Floricultura Lurdes', city: 'Braga' },
  status: 'RETURNED',
  lines: [
    {
      variantSku: 'HEL-ROS-150G',
      variantName: 'Helichrysum Rosa 150g',
      qty: 40,
      unitPriceEur: 3.7,
      discountPct: 5,
      lineTotalEur: 140.6,
      pricingSource: 'TIER_LIST',
    },
    {
      variantSku: 'BROOM-BLOOM-200G',
      variantName: 'Broom Bloom 200g',
      qty: 20,
      unitPriceEur: 3.4,
      discountPct: 0,
      lineTotalEur: 68.0,
      pricingSource: 'TIER_LIST',
    },
  ],
  subtotalEur: 208.6,
  vatEur: 47.98,
  vatPct: 23,
  totalEur: 256.58,
  salesRep: 'Ana Marques',
  paymentMethod: 'CARD',
  shipping: {
    address: 'Rua das Flores 12, 4700-001 Braga',
    courier: 'CTT Expresso',
    tracking: 'CTT-2026-BR112233',
  },
  statusHistory: [
    { fromStatus: null, toStatus: 'DRAFT', by: 'Ana Marques', at: '2026-02-15T09:00:00Z' },
    {
      fromStatus: 'DRAFT',
      toStatus: 'AWAITING_PAYMENT',
      by: 'Ana Marques',
      at: '2026-02-16T11:00:00Z',
    },
    {
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CONFIRMED',
      by: 'Sistema',
      at: '2026-02-17T10:00:00Z',
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKING',
      by: 'João Armazém',
      at: '2026-02-19T08:00:00Z',
    },
    {
      fromStatus: 'PICKING',
      toStatus: 'READY_TO_SHIP',
      by: 'João Armazém',
      at: '2026-02-21T16:00:00Z',
    },
    {
      fromStatus: 'READY_TO_SHIP',
      toStatus: 'SHIPPED',
      by: 'Carlos Pinto',
      at: '2026-02-22T08:00:00Z',
    },
    {
      fromStatus: 'SHIPPED',
      toStatus: 'DELIVERED',
      by: 'Sistema',
      at: '2026-02-26T11:00:00Z',
    },
    {
      fromStatus: 'DELIVERED',
      toStatus: 'RETURNED',
      by: 'Ana Marques',
      at: '2026-03-05T10:00:00Z',
      note: 'Devolução iniciada — produto com qualidade inferior ao esperado.',
    },
  ],
  createdAt: '2026-02-15T09:00:00Z',
  updatedAt: '2026-03-05T10:00:00Z',
  placedAt: '2026-02-16T11:00:00Z',
  confirmedAt: '2026-02-17T10:00:00Z',
  shippedAt: '2026-02-22T08:00:00Z',
  deliveredAt: '2026-02-26T11:00:00Z',
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export const mockOrders: MockOrder[] = [
  ord001,
  ord002,
  ord003, // DRAFT
  ord004,
  ord005,
  ord006,
  ord007, // AWAITING_PAYMENT
  ord008,
  ord009,
  ord010,
  ord011,
  ord012, // CONFIRMED
  ord013,
  ord014,
  ord015, // PICKING
  ord016,
  ord017, // READY_TO_SHIP
  ord018,
  ord019,
  ord020, // SHIPPED
  ord021,
  ord022,
  ord023, // DELIVERED
  ord024, // CANCELLED
  ord025, // RETURNED
];
