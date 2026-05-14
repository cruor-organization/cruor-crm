/**
 * Mock data para Campanhas (§10.11).
 */

export type CampaignChannel = 'email' | 'whatsapp' | 'social';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'done';

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  segment: string;
  audienceCount: number;
  sentCount: number;
  openRate?: number; // 0-1
  startAt: string;
  endAt?: string;
}

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-001',
    name: 'Promoção Verão 2026 — flores secas',
    channel: 'email',
    status: 'scheduled',
    segment: 'Clientes activos Lisboa + Porto',
    audienceCount: 148,
    sentCount: 0,
    startAt: '2026-06-01T08:00:00Z',
  },
  {
    id: 'camp-002',
    name: 'Dia da Mãe — oferta especial',
    channel: 'whatsapp',
    status: 'done',
    segment: 'Todos os clientes',
    audienceCount: 212,
    sentCount: 208,
    openRate: 0.81,
    startAt: '2026-04-28T09:00:00Z',
    endAt: '2026-05-04T18:00:00Z',
  },
  {
    id: 'camp-003',
    name: 'Instagram — lançamento pampas',
    channel: 'social',
    status: 'running',
    segment: 'Seguidores Instagram',
    audienceCount: 3400,
    sentCount: 3400,
    openRate: 0.04,
    startAt: '2026-05-10T10:00:00Z',
  },
  {
    id: 'camp-004',
    name: 'Newsletter Maio — novidades catálogo',
    channel: 'email',
    status: 'done',
    segment: 'Subscritores newsletter',
    audienceCount: 320,
    sentCount: 315,
    openRate: 0.43,
    startAt: '2026-05-01T08:00:00Z',
    endAt: '2026-05-01T08:00:00Z',
  },
  {
    id: 'camp-005',
    name: 'Reactivação clientes inativos',
    channel: 'whatsapp',
    status: 'draft',
    segment: 'Clientes sem compra >90 dias',
    audienceCount: 54,
    sentCount: 0,
    startAt: '2026-05-20T10:00:00Z',
  },
  {
    id: 'camp-006',
    name: 'Campanha Facebook — gypsophila',
    channel: 'social',
    status: 'scheduled',
    segment: 'Seguidores Facebook',
    audienceCount: 1800,
    sentCount: 0,
    startAt: '2026-05-18T09:00:00Z',
  },
  {
    id: 'camp-007',
    name: 'Email cross-sell acessórios',
    channel: 'email',
    status: 'done',
    segment: 'Clientes flores secas sem acessórios',
    audienceCount: 98,
    sentCount: 95,
    openRate: 0.38,
    startAt: '2026-04-15T08:00:00Z',
    endAt: '2026-04-15T08:00:00Z',
  },
  {
    id: 'camp-008',
    name: 'WhatsApp — flash sale lagurus',
    channel: 'whatsapp',
    status: 'draft',
    segment: 'Top 50 clientes por volume',
    audienceCount: 50,
    sentCount: 0,
    startAt: '2026-05-25T12:00:00Z',
  },
];
