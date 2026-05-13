/**
 * Dados simulados para o módulo de Devoluções (Fase 3).
 * Workflow: RECEIVED → INSPECTED → APPROVED | REJECTED → REFUNDED | REPLACED
 */

export type ReturnStatus =
  | 'RECEIVED'
  | 'INSPECTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REFUNDED'
  | 'REPLACED';
export type ReturnReason = 'DAMAGED' | 'WRONG_ITEM' | 'QUALITY' | 'EXCESS' | 'OTHER';
export type ReturnCondition = 'PRISTINE' | 'DAMAGED' | 'SCRAP';
export type ReturnResolution = 'REFUND_FULL' | 'REFUND_PARTIAL' | 'REPLACE' | 'CREDIT_NOTE' | null;

export interface ReturnLine {
  variantSku: string;
  variantName: string;
  qty: number;
  reason: ReturnReason;
  condition: ReturnCondition;
}

export interface MockReturn {
  id: string;
  orderId: string;
  customer: string;
  lines: ReturnLine[];
  status: ReturnStatus;
  inspectionNotes: string | null;
  photos: string[];
  decidedAt: string | null;
  resolution: ReturnResolution;
  createdAt: string;
  updatedAt: string;
}

export const mockReturns: MockReturn[] = [
  // RECEIVED (2)
  {
    id: 'RET-2026-0041',
    orderId: 'ORD-2026-0132',
    customer: 'Rosa Perfeita',
    lines: [
      {
        variantSku: 'ROSA-SEC-12U',
        variantName: 'Rosas Secas 12 unidades',
        qty: 10,
        reason: 'DAMAGED',
        condition: 'SCRAP',
      },
    ],
    status: 'RECEIVED',
    inspectionNotes: null,
    photos: [
      'https://placehold.co/400x300?text=Foto+1',
      'https://placehold.co/400x300?text=Foto+2',
    ],
    decidedAt: null,
    resolution: null,
    createdAt: '2026-05-12T10:00:00Z',
    updatedAt: '2026-05-12T10:00:00Z',
  },
  {
    id: 'RET-2026-0042',
    orderId: 'ORD-2026-0133',
    customer: 'Floricultura Margarida',
    lines: [
      {
        variantSku: 'EUC-PRES-100G',
        variantName: 'Eucalyptus Preservado 100g',
        qty: 5,
        reason: 'WRONG_ITEM',
        condition: 'PRISTINE',
      },
      {
        variantSku: 'HEL-ROS-150G',
        variantName: 'Helichrysum Rosa 150g',
        qty: 8,
        reason: 'WRONG_ITEM',
        condition: 'PRISTINE',
      },
    ],
    status: 'RECEIVED',
    inspectionNotes: null,
    photos: ['https://placehold.co/400x300?text=Foto+1'],
    decidedAt: null,
    resolution: null,
    createdAt: '2026-05-11T14:30:00Z',
    updatedAt: '2026-05-11T14:30:00Z',
  },

  // INSPECTED (2)
  {
    id: 'RET-2026-0038',
    orderId: 'ORD-2026-0100',
    customer: 'Bouquet Shop Porto',
    lines: [
      {
        variantSku: 'BROOM-BLOOM-200G',
        variantName: 'Broom Bloom 200g',
        qty: 15,
        reason: 'QUALITY',
        condition: 'DAMAGED',
      },
    ],
    status: 'INSPECTED',
    inspectionNotes:
      'Produto apresenta manchas de humidade em 15 embalagens. Lote afectado: 2026-03.',
    photos: [
      'https://placehold.co/400x300?text=Inspecção+1',
      'https://placehold.co/400x300?text=Inspecção+2',
      'https://placehold.co/400x300?text=Inspecção+3',
    ],
    decidedAt: null,
    resolution: null,
    createdAt: '2026-05-05T09:00:00Z',
    updatedAt: '2026-05-08T11:00:00Z',
  },
  {
    id: 'RET-2026-0039',
    orderId: 'ORD-2026-0099',
    customer: 'Flores Ibéricas SL',
    lines: [
      {
        variantSku: 'HEL-ROS-150G',
        variantName: 'Helichrysum Rosa 150g',
        qty: 30,
        reason: 'EXCESS',
        condition: 'PRISTINE',
      },
    ],
    status: 'INSPECTED',
    inspectionNotes:
      'Cliente recebeu 30 unidades a mais por erro de picking. Produto em perfeito estado.',
    photos: ['https://placehold.co/400x300?text=Inspecção+1'],
    decidedAt: null,
    resolution: null,
    createdAt: '2026-05-03T10:00:00Z',
    updatedAt: '2026-05-07T15:00:00Z',
  },

  // APPROVED (2)
  {
    id: 'RET-2026-0034',
    orderId: 'ORD-2026-0072',
    customer: 'Floricultura Lurdes',
    lines: [
      {
        variantSku: 'HEL-ROS-150G',
        variantName: 'Helichrysum Rosa 150g',
        qty: 40,
        reason: 'QUALITY',
        condition: 'SCRAP',
      },
      {
        variantSku: 'BROOM-BLOOM-200G',
        variantName: 'Broom Bloom 200g',
        qty: 20,
        reason: 'DAMAGED',
        condition: 'DAMAGED',
      },
    ],
    status: 'APPROVED',
    inspectionNotes:
      'Helichrysum com decoloração grave (lote 2026-01 — problema no processo de secagem). Broom Bloom esmagado no transporte. Aprovada devolução total.',
    photos: [
      'https://placehold.co/400x300?text=Foto+1',
      'https://placehold.co/400x300?text=Foto+2',
    ],
    decidedAt: '2026-03-10T14:00:00Z',
    resolution: 'REFUND_FULL',
    createdAt: '2026-03-06T09:00:00Z',
    updatedAt: '2026-03-10T14:00:00Z',
  },
  {
    id: 'RET-2026-0035',
    orderId: 'ORD-2026-0098',
    customer: 'Sol e Flor Lda',
    lines: [
      {
        variantSku: 'LAV-BUND-50G',
        variantName: 'Lavanda Seca 50g',
        qty: 50,
        reason: 'QUALITY',
        condition: 'DAMAGED',
      },
    ],
    status: 'APPROVED',
    inspectionNotes:
      'Lavanda com odor a humidade. 50 embalagens afectadas. Cliente prefere nota de crédito.',
    photos: ['https://placehold.co/400x300?text=Inspecção+1'],
    decidedAt: '2026-04-10T10:00:00Z',
    resolution: 'CREDIT_NOTE',
    createdAt: '2026-04-05T08:00:00Z',
    updatedAt: '2026-04-10T10:00:00Z',
  },

  // REJECTED (1)
  {
    id: 'RET-2026-0030',
    orderId: 'ORD-2026-0099',
    customer: 'Flores Ibéricas SL',
    lines: [
      {
        variantSku: 'EUC-PRES-100G',
        variantName: 'Eucalyptus Preservado 100g',
        qty: 20,
        reason: 'OTHER',
        condition: 'PRISTINE',
      },
    ],
    status: 'REJECTED',
    inspectionNotes:
      'Produto em perfeito estado. Motivo de devolução não válido — cliente invocou "excesso de stock" 45 dias após entrega. Prazo de devolução expirado (30 dias).',
    photos: [],
    decidedAt: '2026-03-25T11:00:00Z',
    resolution: null,
    createdAt: '2026-03-20T09:00:00Z',
    updatedAt: '2026-03-25T11:00:00Z',
  },

  // REFUNDED (2)
  {
    id: 'RET-2026-0020',
    orderId: 'ORD-2026-0072',
    customer: 'Floricultura Lurdes',
    lines: [
      {
        variantSku: 'ROSA-SEC-12U',
        variantName: 'Rosas Secas 12 unidades',
        qty: 15,
        reason: 'DAMAGED',
        condition: 'SCRAP',
      },
    ],
    status: 'REFUNDED',
    inspectionNotes:
      'Flores danificadas no transporte. Seguro de transporte activado. Reembolso de €112,50 processado.',
    photos: ['https://placehold.co/400x300?text=Dano+1'],
    decidedAt: '2026-02-10T09:00:00Z',
    resolution: 'REFUND_FULL',
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-12T14:00:00Z',
  },
  {
    id: 'RET-2026-0021',
    orderId: 'ORD-2026-0098',
    customer: 'Sol e Flor Lda',
    lines: [
      {
        variantSku: 'ROSA-SEC-12U',
        variantName: 'Rosas Secas 12 unidades',
        qty: 5,
        reason: 'DAMAGED',
        condition: 'DAMAGED',
      },
    ],
    status: 'REFUNDED',
    inspectionNotes:
      'Reembolso parcial de €28,13 processado. 5 unidades danificadas na embalagem exterior.',
    photos: ['https://placehold.co/400x300?text=Dano+parcial'],
    decidedAt: '2026-03-15T10:00:00Z',
    resolution: 'REFUND_PARTIAL',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-17T09:00:00Z',
  },

  // REPLACED (1)
  {
    id: 'RET-2026-0015',
    orderId: 'ORD-2026-0100',
    customer: 'Bouquet Shop Porto',
    lines: [
      {
        variantSku: 'LIM-NAT-200G',
        variantName: 'Limonium Natural 200g',
        qty: 20,
        reason: 'WRONG_ITEM',
        condition: 'PRISTINE',
      },
    ],
    status: 'REPLACED',
    inspectionNotes:
      'Enviado Limonium Branco em vez de Natural por engano. Substituição efectuada e enviada na semana seguinte.',
    photos: [],
    decidedAt: '2026-01-20T11:00:00Z',
    resolution: 'REPLACE',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-25T14:00:00Z',
  },
];
