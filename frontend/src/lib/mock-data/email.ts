/**
 * Mock data para Email marketing (§10.21) — Resend + React Email.
 */

export interface EmailSend {
  id: string;
  subject: string;
  template: string;
  segment: string;
  sentAt: string;
  recipients: number;
  openRate: number; // 0-1
  clickRate: number; // 0-1
  bounceRate: number; // 0-1
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  lastEditedAt: string;
}

export const mockEmailSends: EmailSend[] = [
  {
    id: 'send-001',
    subject: 'Newsletter Maio 2026 — Novidades no Catálogo',
    template: 'newsletter-monthly',
    segment: 'Subscritores newsletter',
    sentAt: '2026-05-01T08:00:00Z',
    recipients: 315,
    openRate: 0.43,
    clickRate: 0.12,
    bounceRate: 0.01,
  },
  {
    id: 'send-002',
    subject: 'Oferta especial Dia da Mãe — até 15% desconto',
    template: 'promotional',
    segment: 'Todos os clientes activos',
    sentAt: '2026-04-28T09:00:00Z',
    recipients: 208,
    openRate: 0.61,
    clickRate: 0.24,
    bounceRate: 0.02,
  },
  {
    id: 'send-003',
    subject: 'Cross-sell: descubra os nossos acessórios',
    template: 'cross-sell',
    segment: 'Clientes flores secas sem acessórios',
    sentAt: '2026-04-15T08:00:00Z',
    recipients: 95,
    openRate: 0.38,
    clickRate: 0.09,
    bounceRate: 0.0,
  },
  {
    id: 'send-004',
    subject: 'Newsletter Abril 2026',
    template: 'newsletter-monthly',
    segment: 'Subscritores newsletter',
    sentAt: '2026-04-01T08:00:00Z',
    recipients: 308,
    openRate: 0.41,
    clickRate: 0.11,
    bounceRate: 0.01,
  },
  {
    id: 'send-005',
    subject: 'Bem-vindo à Cruor Florals!',
    template: 'welcome',
    segment: 'Novos clientes',
    sentAt: '2026-04-10T10:00:00Z',
    recipients: 12,
    openRate: 0.92,
    clickRate: 0.5,
    bounceRate: 0.0,
  },
  {
    id: 'send-006',
    subject: 'A sua encomenda foi expedida',
    template: 'transactional-shipped',
    segment: 'Clientes com encomenda expedida',
    sentAt: '2026-05-08T14:30:00Z',
    recipients: 34,
    openRate: 0.88,
    clickRate: 0.41,
    bounceRate: 0.0,
  },
  {
    id: 'send-007',
    subject: 'Lembrete de pagamento — fatura #2026-0234',
    template: 'payment-reminder',
    segment: 'Clientes com fatura em atraso',
    sentAt: '2026-05-05T09:00:00Z',
    recipients: 8,
    openRate: 0.75,
    clickRate: 0.25,
    bounceRate: 0.0,
  },
  {
    id: 'send-008',
    subject: 'Newsletter Março 2026',
    template: 'newsletter-monthly',
    segment: 'Subscritores newsletter',
    sentAt: '2026-03-01T08:00:00Z',
    recipients: 295,
    openRate: 0.39,
    clickRate: 0.1,
    bounceRate: 0.02,
  },
  {
    id: 'send-009',
    subject: 'Pré-venda catálogo Outono/Inverno',
    template: 'promotional',
    segment: 'Top 100 clientes',
    sentAt: '2026-03-15T08:00:00Z',
    recipients: 98,
    openRate: 0.55,
    clickRate: 0.18,
    bounceRate: 0.01,
  },
  {
    id: 'send-010',
    subject: 'Novo produto: Pampas ornamentais',
    template: 'product-launch',
    segment: 'Todos os clientes activos',
    sentAt: '2026-03-22T10:00:00Z',
    recipients: 200,
    openRate: 0.47,
    clickRate: 0.15,
    bounceRate: 0.01,
  },
  {
    id: 'send-011',
    subject: 'Resumo da sua conta — Fevereiro 2026',
    template: 'account-summary',
    segment: 'Clientes premium',
    sentAt: '2026-03-05T08:00:00Z',
    recipients: 45,
    openRate: 0.62,
    clickRate: 0.2,
    bounceRate: 0.0,
  },
  {
    id: 'send-012',
    subject: 'Avaliação de serviço — como foi a sua experiência?',
    template: 'feedback',
    segment: 'Clientes com entrega recente',
    sentAt: '2026-02-28T10:00:00Z',
    recipients: 67,
    openRate: 0.34,
    clickRate: 0.08,
    bounceRate: 0.01,
  },
];

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 'tmpl-001',
    name: 'Newsletter mensal',
    description: 'Template base para newsletters mensais com destaques do catálogo e novidades.',
    lastEditedAt: '2026-04-30T15:00:00Z',
  },
  {
    id: 'tmpl-002',
    name: 'Promoção / campanha',
    description: 'Template para campanhas promocionais com CTA destacado e oferta limitada.',
    lastEditedAt: '2026-04-20T11:00:00Z',
  },
  {
    id: 'tmpl-003',
    name: 'Boas-vindas',
    description:
      'Email de onboarding enviado automaticamente a novos clientes após criação de conta.',
    lastEditedAt: '2026-03-10T09:00:00Z',
  },
];
