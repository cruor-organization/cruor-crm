/**
 * Dados simulados para o módulo Alibaba (Fase 3).
 * AlibabaOrder — encomendas de compra a fornecedores Alibaba.
 */

export type AlibabaOrderStatus =
  | 'PLACED'
  | 'IN_PRODUCTION'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'CUSTOMS'
  | 'DELIVERED'
  | 'DELAYED'
  | 'CANCELLED';

export type Incoterm = 'FOB' | 'CIF' | 'EXW' | 'DDP';

export interface AlibabaItem {
  sku: string;
  productName: string;
  qty: number;
  unitCostUsd: number;
  unitCostEur: number;
  batch: string;
}

export interface MockAlibabaOrder {
  id: string;
  supplier: string;
  status: AlibabaOrderStatus;
  items: AlibabaItem[];
  incoterm: Incoterm;
  placedAt: string;
  eta: string;
  currentEta: string;
  deliveredAt: string | null;
  tracking: {
    courier: string | null;
    number: string | null;
    lastEvent: string | null;
  };
  totalUsd: number;
  totalEur: number;
  landedCostEur: number | null;
}

// Taxa de câmbio simulada: 1 USD = 0.918 EUR (à data do pedido)
const USD_EUR = 0.918;

export const mockAlibabaOrders: MockAlibabaOrder[] = [
  // PLACED (2)
  {
    id: 'ALI-2026-0022',
    supplier: 'Yiwu Bloom Co.',
    status: 'PLACED',
    incoterm: 'FOB',
    placedAt: '2026-05-10T08:00:00Z',
    eta: '2026-07-20T00:00:00Z',
    currentEta: '2026-07-20T00:00:00Z',
    deliveredAt: null,
    tracking: { courier: null, number: null, lastEvent: null },
    totalUsd: 4800,
    totalEur: Math.round(4800 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'LIM-NAT-200G',
        productName: 'Limonium Natural 200g',
        qty: 500,
        unitCostUsd: 2.8,
        unitCostEur: Math.round(2.8 * USD_EUR * 100) / 100,
        batch: '2026-Q3-A',
      },
      {
        sku: 'HEL-ROS-150G',
        productName: 'Helichrysum Rosa 150g',
        qty: 800,
        unitCostUsd: 2.1,
        unitCostEur: Math.round(2.1 * USD_EUR * 100) / 100,
        batch: '2026-Q3-A',
      },
      {
        sku: 'LAG-NAT-100G',
        productName: 'Lagurus Natural 100g',
        qty: 600,
        unitCostUsd: 1.4,
        unitCostEur: Math.round(1.4 * USD_EUR * 100) / 100,
        batch: '2026-Q3-A',
      },
    ],
  },
  {
    id: 'ALI-2026-0023',
    supplier: 'Kunming Floral Trade',
    status: 'PLACED',
    incoterm: 'CIF',
    placedAt: '2026-05-08T10:00:00Z',
    eta: '2026-08-05T00:00:00Z',
    currentEta: '2026-08-05T00:00:00Z',
    deliveredAt: null,
    tracking: { courier: null, number: null, lastEvent: null },
    totalUsd: 6200,
    totalEur: Math.round(6200 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'ROSA-SEC-12U',
        productName: 'Dried Roses 12 units',
        qty: 600,
        unitCostUsd: 4.2,
        unitCostEur: Math.round(4.2 * USD_EUR * 100) / 100,
        batch: '2026-Q3-B',
      },
      {
        sku: 'EUC-PRES-100G',
        productName: 'Preserved Eucalyptus 100g',
        qty: 400,
        unitCostUsd: 3.8,
        unitCostEur: Math.round(3.8 * USD_EUR * 100) / 100,
        batch: '2026-Q3-B',
      },
    ],
  },

  // IN_PRODUCTION (3)
  {
    id: 'ALI-2026-0019',
    supplier: 'Yiwu Bloom Co.',
    status: 'IN_PRODUCTION',
    incoterm: 'FOB',
    placedAt: '2026-04-20T09:00:00Z',
    eta: '2026-07-10T00:00:00Z',
    currentEta: '2026-07-10T00:00:00Z',
    deliveredAt: null,
    tracking: { courier: null, number: null, lastEvent: null },
    totalUsd: 8500,
    totalEur: Math.round(8500 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'STRAW-FLWR-100G',
        productName: 'Strawflower Mixed 100g',
        qty: 1200,
        unitCostUsd: 1.9,
        unitCostEur: Math.round(1.9 * USD_EUR * 100) / 100,
        batch: '2026-Q3-C',
      },
      {
        sku: 'GNAPH-WHITE-100G',
        productName: 'Gnaphalium White 100g',
        qty: 1000,
        unitCostUsd: 1.5,
        unitCostEur: Math.round(1.5 * USD_EUR * 100) / 100,
        batch: '2026-Q3-C',
      },
      {
        sku: 'BROOM-BLOOM-200G',
        productName: 'Broom Bloom 200g',
        qty: 800,
        unitCostUsd: 2.0,
        unitCostEur: Math.round(2.0 * USD_EUR * 100) / 100,
        batch: '2026-Q3-C',
      },
    ],
  },
  {
    id: 'ALI-2026-0020',
    supplier: 'Qingdao Dried Plants Co.',
    status: 'IN_PRODUCTION',
    incoterm: 'EXW',
    placedAt: '2026-04-15T10:00:00Z',
    eta: '2026-07-25T00:00:00Z',
    currentEta: '2026-07-25T00:00:00Z',
    deliveredAt: null,
    tracking: { courier: null, number: null, lastEvent: null },
    totalUsd: 5600,
    totalEur: Math.round(5600 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'PAN-PAMP-200G',
        productName: 'Pampas Grass Natural 200g',
        qty: 700,
        unitCostUsd: 2.9,
        unitCostEur: Math.round(2.9 * USD_EUR * 100) / 100,
        batch: '2026-Q3-D',
      },
      {
        sku: 'PALM-BLEACH-1U',
        productName: 'Bleached Palm Leaf',
        qty: 1000,
        unitCostUsd: 0.9,
        unitCostEur: Math.round(0.9 * USD_EUR * 100) / 100,
        batch: '2026-Q3-D',
      },
    ],
  },
  {
    id: 'ALI-2026-0021',
    supplier: 'Foshan Botanical Crafts',
    status: 'IN_PRODUCTION',
    incoterm: 'DDP',
    placedAt: '2026-04-10T08:00:00Z',
    eta: '2026-07-30T00:00:00Z',
    currentEta: '2026-07-30T00:00:00Z',
    deliveredAt: null,
    tracking: { courier: null, number: null, lastEvent: null },
    totalUsd: 3900,
    totalEur: Math.round(3900 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'LAV-BUND-50G',
        productName: 'Lavender Bundle 50g',
        qty: 2000,
        unitCostUsd: 0.95,
        unitCostEur: Math.round(0.95 * USD_EUR * 100) / 100,
        batch: '2026-Q3-E',
      },
      {
        sku: 'LAG-PUR-100G',
        productName: 'Lagurus Purple 100g',
        qty: 800,
        unitCostUsd: 1.2,
        unitCostEur: Math.round(1.2 * USD_EUR * 100) / 100,
        batch: '2026-Q3-E',
      },
    ],
  },

  // SHIPPED (2)
  {
    id: 'ALI-2026-0017',
    supplier: 'Yiwu Bloom Co.',
    status: 'SHIPPED',
    incoterm: 'FOB',
    placedAt: '2026-03-10T09:00:00Z',
    eta: '2026-06-15T00:00:00Z',
    currentEta: '2026-06-15T00:00:00Z',
    deliveredAt: null,
    tracking: {
      courier: 'COSCO Shipping',
      number: 'COSCO-2026-YW114455',
      lastEvent: 'Saiu do porto de Xangai em 2026-05-02.',
    },
    totalUsd: 11200,
    totalEur: Math.round(11200 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'LIM-NAT-200G',
        productName: 'Limonium Natural 200g',
        qty: 1500,
        unitCostUsd: 2.75,
        unitCostEur: Math.round(2.75 * USD_EUR * 100) / 100,
        batch: '2026-Q2-A',
      },
      {
        sku: 'HEL-ROS-150G',
        productName: 'Helichrysum Rosa 150g',
        qty: 2000,
        unitCostUsd: 2.0,
        unitCostEur: Math.round(2.0 * USD_EUR * 100) / 100,
        batch: '2026-Q2-A',
      },
      {
        sku: 'STRAW-FLWR-100G',
        productName: 'Strawflower Mixed 100g',
        qty: 1000,
        unitCostUsd: 1.85,
        unitCostEur: Math.round(1.85 * USD_EUR * 100) / 100,
        batch: '2026-Q2-A',
      },
    ],
  },
  {
    id: 'ALI-2026-0018',
    supplier: 'Kunming Floral Trade',
    status: 'SHIPPED',
    incoterm: 'CIF',
    placedAt: '2026-03-05T10:00:00Z',
    eta: '2026-06-20T00:00:00Z',
    currentEta: '2026-06-20T00:00:00Z',
    deliveredAt: null,
    tracking: {
      courier: 'MSC Mediterranean',
      number: 'MSC-2026-KM998877',
      lastEvent: 'Em navegação — estimativa de chegada a Lisboa: 2026-06-18.',
    },
    totalUsd: 7800,
    totalEur: Math.round(7800 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'ROSA-SEC-12U',
        productName: 'Dried Roses 12 units',
        qty: 1200,
        unitCostUsd: 4.0,
        unitCostEur: Math.round(4.0 * USD_EUR * 100) / 100,
        batch: '2026-Q2-B',
      },
      {
        sku: 'EUC-PRES-100G',
        productName: 'Preserved Eucalyptus 100g',
        qty: 600,
        unitCostUsd: 3.7,
        unitCostEur: Math.round(3.7 * USD_EUR * 100) / 100,
        batch: '2026-Q2-B',
      },
    ],
  },

  // IN_TRANSIT (3)
  {
    id: 'ALI-2026-0014',
    supplier: 'Qingdao Dried Plants Co.',
    status: 'IN_TRANSIT',
    incoterm: 'CIF',
    placedAt: '2026-02-20T09:00:00Z',
    eta: '2026-05-25T00:00:00Z',
    currentEta: '2026-05-25T00:00:00Z',
    deliveredAt: null,
    tracking: {
      courier: 'CMA CGM',
      number: 'CMA-2026-QD556677',
      lastEvent: 'Chegou ao porto de Sines em 2026-05-13. Aguarda descarga.',
    },
    totalUsd: 9300,
    totalEur: Math.round(9300 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'PAN-PAMP-200G',
        productName: 'Pampas Grass Natural 200g',
        qty: 1800,
        unitCostUsd: 2.8,
        unitCostEur: Math.round(2.8 * USD_EUR * 100) / 100,
        batch: '2026-Q2-C',
      },
      {
        sku: 'PALM-BLEACH-1U',
        productName: 'Bleached Palm Leaf',
        qty: 2500,
        unitCostUsd: 0.85,
        unitCostEur: Math.round(0.85 * USD_EUR * 100) / 100,
        batch: '2026-Q2-C',
      },
      {
        sku: 'BROOM-BLOOM-200G',
        productName: 'Broom Bloom 200g',
        qty: 900,
        unitCostUsd: 1.95,
        unitCostEur: Math.round(1.95 * USD_EUR * 100) / 100,
        batch: '2026-Q2-C',
      },
    ],
  },
  {
    id: 'ALI-2026-0015',
    supplier: 'Foshan Botanical Crafts',
    status: 'IN_TRANSIT',
    incoterm: 'FOB',
    placedAt: '2026-02-15T10:00:00Z',
    eta: '2026-05-30T00:00:00Z',
    currentEta: '2026-05-30T00:00:00Z',
    deliveredAt: null,
    tracking: {
      courier: 'Evergreen Marine',
      number: 'EMC-2026-FS334455',
      lastEvent: 'Passou pelo canal de Suez em 2026-05-01.',
    },
    totalUsd: 4100,
    totalEur: Math.round(4100 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'LAV-BUND-50G',
        productName: 'Lavender Bundle 50g',
        qty: 3000,
        unitCostUsd: 0.9,
        unitCostEur: Math.round(0.9 * USD_EUR * 100) / 100,
        batch: '2026-Q2-D',
      },
      {
        sku: 'GNAPH-WHITE-100G',
        productName: 'Gnaphalium White 100g',
        qty: 800,
        unitCostUsd: 1.45,
        unitCostEur: Math.round(1.45 * USD_EUR * 100) / 100,
        batch: '2026-Q2-D',
      },
    ],
  },
  {
    id: 'ALI-2026-0016',
    supplier: 'Yiwu Bloom Co.',
    status: 'IN_TRANSIT',
    incoterm: 'CIF',
    placedAt: '2026-02-10T09:00:00Z',
    eta: '2026-05-28T00:00:00Z',
    currentEta: '2026-05-28T00:00:00Z',
    deliveredAt: null,
    tracking: {
      courier: 'Yang Ming',
      number: 'YML-2026-YW667788',
      lastEvent: 'Partiu de Singapura em 2026-05-05.',
    },
    totalUsd: 6800,
    totalEur: Math.round(6800 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'HEL-ORG-150G',
        productName: 'Helichrysum Orange 150g',
        qty: 1600,
        unitCostUsd: 2.05,
        unitCostEur: Math.round(2.05 * USD_EUR * 100) / 100,
        batch: '2026-Q2-E',
      },
      {
        sku: 'LIM-NAT-200G',
        productName: 'Limonium Natural 200g',
        qty: 1200,
        unitCostUsd: 2.7,
        unitCostEur: Math.round(2.7 * USD_EUR * 100) / 100,
        batch: '2026-Q2-E',
      },
    ],
  },

  // CUSTOMS (2)
  {
    id: 'ALI-2026-0011',
    supplier: 'Kunming Floral Trade',
    status: 'CUSTOMS',
    incoterm: 'CIF',
    placedAt: '2026-01-20T09:00:00Z',
    eta: '2026-05-10T00:00:00Z',
    currentEta: '2026-05-16T00:00:00Z',
    deliveredAt: null,
    tracking: {
      courier: 'COSCO Shipping',
      number: 'COSCO-2026-KM889900',
      lastEvent: 'Em processo de desalfandegamento em Lisboa. Aguarda certificado fitossanitário.',
    },
    totalUsd: 13500,
    totalEur: Math.round(13500 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'ROSA-SEC-12U',
        productName: 'Dried Roses 12 units',
        qty: 2000,
        unitCostUsd: 3.9,
        unitCostEur: Math.round(3.9 * USD_EUR * 100) / 100,
        batch: '2026-Q1-A',
      },
      {
        sku: 'EUC-PRES-100G',
        productName: 'Preserved Eucalyptus 100g',
        qty: 1500,
        unitCostUsd: 3.6,
        unitCostEur: Math.round(3.6 * USD_EUR * 100) / 100,
        batch: '2026-Q1-A',
      },
      {
        sku: 'HEL-ROS-150G',
        productName: 'Helichrysum Rosa 150g',
        qty: 1000,
        unitCostUsd: 1.95,
        unitCostEur: Math.round(1.95 * USD_EUR * 100) / 100,
        batch: '2026-Q1-A',
      },
    ],
  },
  {
    id: 'ALI-2026-0012',
    supplier: 'Qingdao Dried Plants Co.',
    status: 'CUSTOMS',
    incoterm: 'FOB',
    placedAt: '2026-01-25T10:00:00Z',
    eta: '2026-05-12T00:00:00Z',
    currentEta: '2026-05-18T00:00:00Z',
    deliveredAt: null,
    tracking: {
      courier: 'MSC Mediterranean',
      number: 'MSC-2026-QD112233',
      lastEvent: 'Declaração aduaneira submetida. Aguarda despacho — DUA 2026-PT-0458821.',
    },
    totalUsd: 7200,
    totalEur: Math.round(7200 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'PAN-PAMP-200G',
        productName: 'Pampas Grass Natural 200g',
        qty: 2500,
        unitCostUsd: 2.75,
        unitCostEur: Math.round(2.75 * USD_EUR * 100) / 100,
        batch: '2026-Q1-B',
      },
      {
        sku: 'GNAPH-WHITE-100G',
        productName: 'Gnaphalium White 100g',
        qty: 500,
        unitCostUsd: 1.42,
        unitCostEur: Math.round(1.42 * USD_EUR * 100) / 100,
        batch: '2026-Q1-B',
      },
    ],
  },

  // DELIVERED (2)
  {
    id: 'ALI-2026-0008',
    supplier: 'Yiwu Bloom Co.',
    status: 'DELIVERED',
    incoterm: 'CIF',
    placedAt: '2025-11-10T09:00:00Z',
    eta: '2026-02-20T00:00:00Z',
    currentEta: '2026-02-20T00:00:00Z',
    deliveredAt: '2026-02-22T10:00:00Z',
    tracking: {
      courier: 'CMA CGM',
      number: 'CMA-2026-YW445566',
      lastEvent: 'Entregue no armazém em 2026-02-22.',
    },
    totalUsd: 15800,
    totalEur: Math.round(15800 * USD_EUR * 100) / 100,
    landedCostEur: Math.round(15800 * USD_EUR * 1.12 * 100) / 100,
    items: [
      {
        sku: 'LIM-NAT-200G',
        productName: 'Limonium Natural 200g',
        qty: 3000,
        unitCostUsd: 2.65,
        unitCostEur: Math.round(2.65 * USD_EUR * 100) / 100,
        batch: '2025-Q4-A',
      },
      {
        sku: 'HEL-ROS-150G',
        productName: 'Helichrysum Rosa 150g',
        qty: 2500,
        unitCostUsd: 1.9,
        unitCostEur: Math.round(1.9 * USD_EUR * 100) / 100,
        batch: '2025-Q4-A',
      },
      {
        sku: 'LAG-NAT-100G',
        productName: 'Lagurus Natural 100g',
        qty: 2000,
        unitCostUsd: 1.3,
        unitCostEur: Math.round(1.3 * USD_EUR * 100) / 100,
        batch: '2025-Q4-A',
      },
      {
        sku: 'BROOM-BLOOM-200G',
        productName: 'Broom Bloom 200g',
        qty: 1500,
        unitCostUsd: 1.88,
        unitCostEur: Math.round(1.88 * USD_EUR * 100) / 100,
        batch: '2025-Q4-A',
      },
    ],
  },
  {
    id: 'ALI-2026-0009',
    supplier: 'Foshan Botanical Crafts',
    status: 'DELIVERED',
    incoterm: 'DDP',
    placedAt: '2025-11-20T10:00:00Z',
    eta: '2026-03-05T00:00:00Z',
    currentEta: '2026-03-05T00:00:00Z',
    deliveredAt: '2026-03-04T11:00:00Z',
    tracking: {
      courier: 'Evergreen Marine',
      number: 'EMC-2026-FB778899',
      lastEvent: 'Entregue no armazém em 2026-03-04.',
    },
    totalUsd: 8900,
    totalEur: Math.round(8900 * USD_EUR * 100) / 100,
    landedCostEur: Math.round(8900 * USD_EUR * 1.08 * 100) / 100,
    items: [
      {
        sku: 'LAV-BUND-50G',
        productName: 'Lavender Bundle 50g',
        qty: 5000,
        unitCostUsd: 0.88,
        unitCostEur: Math.round(0.88 * USD_EUR * 100) / 100,
        batch: '2025-Q4-B',
      },
      {
        sku: 'PALM-BLEACH-1U',
        productName: 'Bleached Palm Leaf',
        qty: 3000,
        unitCostUsd: 0.82,
        unitCostEur: Math.round(0.82 * USD_EUR * 100) / 100,
        batch: '2025-Q4-B',
      },
      {
        sku: 'STRAW-FLWR-100G',
        productName: 'Strawflower Mixed 100g',
        qty: 1800,
        unitCostUsd: 1.8,
        unitCostEur: Math.round(1.8 * USD_EUR * 100) / 100,
        batch: '2025-Q4-B',
      },
    ],
  },

  // DELAYED (1)
  {
    id: 'ALI-2026-0013',
    supplier: 'Kunming Floral Trade',
    status: 'DELAYED',
    incoterm: 'FOB',
    placedAt: '2026-01-15T09:00:00Z',
    eta: '2026-04-30T00:00:00Z',
    currentEta: '2026-06-10T00:00:00Z',
    deliveredAt: null,
    tracking: {
      courier: 'Yang Ming',
      number: 'YML-2026-KM001122',
      lastEvent:
        'Atraso em produção — novo lote de Eucalyptus não cumpriu inspecção de qualidade. Reenvio agendado para 2026-05-20.',
    },
    totalUsd: 10200,
    totalEur: Math.round(10200 * USD_EUR * 100) / 100,
    landedCostEur: null,
    items: [
      {
        sku: 'EUC-PRES-100G',
        productName: 'Preserved Eucalyptus 100g',
        qty: 2500,
        unitCostUsd: 3.5,
        unitCostEur: Math.round(3.5 * USD_EUR * 100) / 100,
        batch: '2026-Q2-DELAY',
      },
      {
        sku: 'ROSA-SEC-12U',
        productName: 'Dried Roses 12 units',
        qty: 800,
        unitCostUsd: 3.85,
        unitCostEur: Math.round(3.85 * USD_EUR * 100) / 100,
        batch: '2026-Q2-DELAY',
      },
    ],
  },
];
