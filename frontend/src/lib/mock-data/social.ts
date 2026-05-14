/**
 * Mock data para Redes Sociais (§10.10) — Instagram + Facebook via n8n.
 */

export type SocialPlatform = 'instagram' | 'facebook';
export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  status: PostStatus;
  scheduledFor?: string; // ISO date — dia de publicação
  publishedAt?: string;
  caption: string;
  mediaPlaceholder: string; // descrição do media, e.g. "Foto produto — limonium azul"
  engagement?: { likes: number; comments: number };
}

export const mockSocialPosts: SocialPost[] = [
  {
    id: 'post-001',
    platform: 'instagram',
    status: 'published',
    scheduledFor: '2026-05-01T09:00:00Z',
    publishedAt: '2026-05-01T09:01:00Z',
    caption:
      'Maio chegou e com ele as cores do nosso catálogo de Primavera! 🌸 Descubra as novidades na loja. #flores #florista #primavera',
    mediaPlaceholder: 'Foto flat-lay flores secas coloridas',
    engagement: { likes: 142, comments: 18 },
  },
  {
    id: 'post-002',
    platform: 'facebook',
    status: 'published',
    scheduledFor: '2026-05-02T10:00:00Z',
    publishedAt: '2026-05-02T10:00:00Z',
    caption:
      'Gypsophila branca — o toque perfeito para qualquer arranjo. Stock limitado! Contacte-nos pelo WhatsApp.',
    mediaPlaceholder: 'Foto gypsophila branca em vaso',
    engagement: { likes: 87, comments: 9 },
  },
  {
    id: 'post-003',
    platform: 'instagram',
    status: 'published',
    scheduledFor: '2026-05-04T09:00:00Z',
    publishedAt: '2026-05-04T09:02:00Z',
    caption:
      'Flores preservadas para o Dia da Mãe — eternas como o vosso amor. Encomende já! #diamae #florespreservadas',
    mediaPlaceholder: 'Flat-lay flores preservadas tons pastel',
    engagement: { likes: 231, comments: 34 },
  },
  {
    id: 'post-004',
    platform: 'instagram',
    status: 'published',
    scheduledFor: '2026-05-05T09:00:00Z',
    publishedAt: '2026-05-05T09:01:00Z',
    caption: 'Limonium — cor e textura para os vossos arranjos. Disponível em 5 tonalidades.',
    mediaPlaceholder: 'Foto limonium 5 cores lado a lado',
    engagement: { likes: 198, comments: 22 },
  },
  {
    id: 'post-005',
    platform: 'facebook',
    status: 'published',
    scheduledFor: '2026-05-06T10:00:00Z',
    publishedAt: '2026-05-06T10:00:00Z',
    caption:
      'Dica de arranjo: combine pampas ornamentais com lagurus para um look natural e moderno. Veja o tutorial no link em baixo.',
    mediaPlaceholder: 'Foto arranjo pampas + lagurus',
    engagement: { likes: 112, comments: 14 },
  },
  {
    id: 'post-006',
    platform: 'instagram',
    status: 'published',
    scheduledFor: '2026-05-08T09:00:00Z',
    publishedAt: '2026-05-08T09:01:00Z',
    caption:
      'Novos pampas ornamentais no catálogo! Tamanhos M e L disponíveis. #pampas #decoration',
    mediaPlaceholder: 'Foto pampas ornamentais em estúdio',
    engagement: { likes: 267, comments: 41 },
  },
  {
    id: 'post-007',
    platform: 'facebook',
    status: 'published',
    scheduledFor: '2026-05-09T10:00:00Z',
    publishedAt: '2026-05-09T10:00:00Z',
    caption:
      'Entrega rápida em todo o território nacional! Encomendas até às 14h expedidas no mesmo dia.',
    mediaPlaceholder: 'Foto caixa de envio com flores',
    engagement: { likes: 76, comments: 5 },
  },
  {
    id: 'post-008',
    platform: 'instagram',
    status: 'published',
    scheduledFor: '2026-05-11T09:00:00Z',
    publishedAt: '2026-05-11T09:02:00Z',
    caption:
      'Lagurus ovatus — suave, delicado e perfeito para arranjos minimalistas. Stock renovado!',
    mediaPlaceholder: 'Foto lagurus close-up fundo neutro',
    engagement: { likes: 189, comments: 27 },
  },
  {
    id: 'post-009',
    platform: 'instagram',
    status: 'published',
    scheduledFor: '2026-05-13T09:00:00Z',
    publishedAt: '2026-05-13T09:01:00Z',
    caption: 'Eucalipto preservado — o verde que nunca murcha. Ideal para decoração de interiores.',
    mediaPlaceholder: 'Foto eucalipto preservado em ramo',
    engagement: { likes: 154, comments: 19 },
  },
  {
    id: 'post-010',
    platform: 'facebook',
    status: 'scheduled',
    scheduledFor: '2026-05-15T10:00:00Z',
    caption:
      'Campanha Verão 2026 — até 20% de desconto em flores secas selecionadas. Aproveite até 31 de Julho!',
    mediaPlaceholder: 'Banner promoção verão',
  },
  {
    id: 'post-011',
    platform: 'instagram',
    status: 'scheduled',
    scheduledFor: '2026-05-16T09:00:00Z',
    caption:
      'Rosas secas em tons pastel — tendência do Verão. Disponíveis a partir de 1 de Junho. Pré-encomenda aberta!',
    mediaPlaceholder: 'Foto rosas secas pastel flat-lay',
  },
  {
    id: 'post-012',
    platform: 'instagram',
    status: 'scheduled',
    scheduledFor: '2026-05-19T09:00:00Z',
    caption: 'Bastidores: como embalamos os vossos pedidos com cuidado. #behindthescenes',
    mediaPlaceholder: 'Vídeo stop-motion embalagem',
  },
  {
    id: 'post-013',
    platform: 'facebook',
    status: 'scheduled',
    scheduledFor: '2026-05-21T10:00:00Z',
    caption: 'FAQ: quanto tempo duram as flores secas? Descubra os nossos cuidados e dicas!',
    mediaPlaceholder: 'Infográfico cuidados flores secas',
  },
  {
    id: 'post-014',
    platform: 'instagram',
    status: 'draft',
    caption: 'Novidade em breve — fique atento ao nosso feed! 👀',
    mediaPlaceholder: 'Teaser produto novo (placeholder)',
  },
  {
    id: 'post-015',
    platform: 'facebook',
    status: 'draft',
    caption:
      'Dica para florists: combine flores secas com elementos naturais como pinhas e musgo para arranjos outono/inverno únicos.',
    mediaPlaceholder: 'Foto arranjo outono/inverno',
  },
];
