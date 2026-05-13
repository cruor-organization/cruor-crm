/**
 * Dados simulados para o dashboard — KPIs, actividade recente, visitas e alertas.
 */

export interface DashboardKpi {
  label: string;
  value: string;
  delta: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

export const dashboardKpis: DashboardKpi[] = [
  {
    label: 'Vendas (30d)',
    value: '€ 18.240',
    delta: { value: '+12,4%', direction: 'up' },
  },
  {
    label: 'Floristas activos',
    value: '47',
    delta: { value: '+3', direction: 'up' },
  },
  {
    label: 'Encomendas pendentes',
    value: '9',
    delta: { value: '+2', direction: 'down' },
  },
  {
    label: 'Stock crítico',
    value: '4 SKUs',
    delta: { value: '-1', direction: 'neutral' },
  },
];

export type ActivityType = 'lead' | 'order' | 'stock' | 'customer' | 'visit';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  actor: string;
  description: string;
  timestamp: string;
}

export const recentActivity: ActivityEvent[] = [
  {
    id: 'act-01',
    type: 'lead',
    actor: 'Sistema',
    description: 'Florista potencial "Flores do Vale" (Porto) convertida em cliente.',
    timestamp: 'há 1h',
  },
  {
    id: 'act-02',
    type: 'order',
    actor: 'Ana Ferreira',
    description: 'Encomenda #ORD-2026-0148 criada — Florista "Ramos & Flores" (Lisboa).',
    timestamp: 'há 2h',
  },
  {
    id: 'act-03',
    type: 'stock',
    actor: 'Sistema',
    description: 'Stock de Limonium sinuatum (cx. 50u) abaixo do mínimo em armazém PT_LX.',
    timestamp: 'há 3h',
  },
  {
    id: 'act-04',
    type: 'customer',
    actor: 'Rui Costa',
    description:
      'Contacto via WhatsApp com "Orquídea Dourada" (Braga) — pedido de tabela de preços.',
    timestamp: 'há 4h',
  },
  {
    id: 'act-05',
    type: 'order',
    actor: 'Sistema',
    description: 'Encomenda #ORD-2026-0143 confirmada pelo fornecedor Alibaba.',
    timestamp: 'há 5h',
  },
  {
    id: 'act-06',
    type: 'lead',
    actor: 'Rui Costa',
    description: 'Nova florista potencial adicionada: "Jardim Encantado" (Coimbra).',
    timestamp: 'há 7h',
  },
  {
    id: 'act-07',
    type: 'stock',
    actor: 'Sistema',
    description: 'Recepção de lote #L2026-0088: Eucalyptus cinerea — 200 caixas em PT_PORTO.',
    timestamp: 'ontem',
  },
  {
    id: 'act-08',
    type: 'order',
    actor: 'Ana Ferreira',
    description: 'Encomenda #ORD-2026-0140 entregue — "Sol e Flor" (Setúbal).',
    timestamp: 'ontem',
  },
  {
    id: 'act-09',
    type: 'customer',
    actor: 'Sistema',
    description: '"Rosa Perfeita" (Madrid) actualizou dados de contacto via portal.',
    timestamp: 'ontem',
  },
  {
    id: 'act-10',
    type: 'lead',
    actor: 'Rui Costa',
    description: 'Visita agendada com "Flores do Prado" (Valladolid) — 15 Maio 2026.',
    timestamp: 'há 2 dias',
  },
];

export interface UpcomingVisit {
  id: string;
  floristName: string;
  city: string;
  scheduledDate: string;
  salesRep: string;
}

export const upcomingVisits: UpcomingVisit[] = [
  {
    id: 'visit-01',
    floristName: 'Flores do Prado',
    city: 'Valladolid',
    scheduledDate: '15 Mai 2026',
    salesRep: 'Rui Costa',
  },
  {
    id: 'visit-02',
    floristName: 'Orquídea Dourada',
    city: 'Braga',
    scheduledDate: '16 Mai 2026',
    salesRep: 'Ana Ferreira',
  },
  {
    id: 'visit-03',
    floristName: 'Jardim Encantado',
    city: 'Coimbra',
    scheduledDate: '19 Mai 2026',
    salesRep: 'Rui Costa',
  },
  {
    id: 'visit-04',
    floristName: 'Verde & Flor',
    city: 'Aveiro',
    scheduledDate: '21 Mai 2026',
    salesRep: 'Ana Ferreira',
  },
];

export interface Alert {
  id: string;
  severity: 'warning' | 'danger';
  message: string;
}

export const dashboardAlerts: Alert[] = [
  {
    id: 'alert-01',
    severity: 'danger',
    message: 'Stock crítico: Eucalyptus cinerea — 8 unidades restantes em PT_PORTO.',
  },
  {
    id: 'alert-02',
    severity: 'warning',
    message: 'Encomenda #ORD-2026-0143 sem confirmação de pagamento há 48h.',
  },
  {
    id: 'alert-03',
    severity: 'warning',
    message: 'Preço de Gypsophila paniculata abaixo do floor para 3 floristas.',
  },
];
