/**
 * Mock data para Scraping — concorrentes (§10.7) e leads (§10.9).
 */

export type ScrapingTargetKind = 'competitor' | 'lead_source';
export type ScrapingTargetStatus = 'active' | 'paused' | 'error';
export type ScrapingRunStatus = 'success' | 'failed' | 'partial';

export interface ScrapingTarget {
  id: string;
  name: string;
  kind: ScrapingTargetKind;
  url: string;
  lastRunAt: string | null;
  status: ScrapingTargetStatus;
  cadence: string; // e.g. "Diário", "Semanal"
}

export interface ScrapingRun {
  id: string;
  targetId: string;
  startedAt: string;
  finishedAt: string | null;
  status: ScrapingRunStatus;
  itemsFound: number;
  notes?: string;
}

export const mockScrapingTargets: ScrapingTarget[] = [
  {
    id: 'tgt-001',
    name: 'FloresOnline.pt',
    kind: 'competitor',
    url: 'https://floresonline.pt/grossista',
    lastRunAt: '2026-05-13T06:00:00Z',
    status: 'active',
    cadence: 'Diário',
  },
  {
    id: 'tgt-002',
    name: 'NaturSeco — catálogo B2B',
    kind: 'competitor',
    url: 'https://naturseco.com/b2b',
    lastRunAt: '2026-05-12T06:00:00Z',
    status: 'active',
    cadence: 'Diário',
  },
  {
    id: 'tgt-003',
    name: 'Google Places — Florists Lisboa',
    kind: 'lead_source',
    url: 'https://maps.googleapis.com/maps/api/place/textsearch/?query=florista+lisboa',
    lastRunAt: '2026-05-11T04:00:00Z',
    status: 'active',
    cadence: 'Semanal',
  },
  {
    id: 'tgt-004',
    name: 'Google Places — Florists Porto',
    kind: 'lead_source',
    url: 'https://maps.googleapis.com/maps/api/place/textsearch/?query=florista+porto',
    lastRunAt: '2026-05-10T04:00:00Z',
    status: 'error',
    cadence: 'Semanal',
  },
  {
    id: 'tgt-005',
    name: 'IberiFlor — preços exportação',
    kind: 'competitor',
    url: 'https://iberflor.es/exportacao',
    lastRunAt: '2026-04-28T06:00:00Z',
    status: 'paused',
    cadence: 'Semanal',
  },
];

export const mockScrapingRuns: ScrapingRun[] = [
  {
    id: 'run-001',
    targetId: 'tgt-001',
    startedAt: '2026-05-13T06:00:00Z',
    finishedAt: '2026-05-13T06:03:12Z',
    status: 'success',
    itemsFound: 134,
    notes: '134 preços capturados.',
  },
  {
    id: 'run-002',
    targetId: 'tgt-002',
    startedAt: '2026-05-12T06:00:00Z',
    finishedAt: '2026-05-12T06:04:45Z',
    status: 'success',
    itemsFound: 89,
    notes: '89 referências actualizadas.',
  },
  {
    id: 'run-003',
    targetId: 'tgt-003',
    startedAt: '2026-05-11T04:00:00Z',
    finishedAt: '2026-05-11T04:07:22Z',
    status: 'success',
    itemsFound: 23,
    notes: '23 novos leads gerados.',
  },
  {
    id: 'run-004',
    targetId: 'tgt-004',
    startedAt: '2026-05-10T04:00:00Z',
    finishedAt: '2026-05-10T04:01:05Z',
    status: 'failed',
    itemsFound: 0,
    notes: 'Erro HTTP 429 — rate limit da API Google Places.',
  },
  {
    id: 'run-005',
    targetId: 'tgt-001',
    startedAt: '2026-05-12T06:00:00Z',
    finishedAt: '2026-05-12T06:02:50Z',
    status: 'success',
    itemsFound: 131,
  },
  {
    id: 'run-006',
    targetId: 'tgt-005',
    startedAt: '2026-04-28T06:00:00Z',
    finishedAt: '2026-04-28T06:08:00Z',
    status: 'partial',
    itemsFound: 42,
    notes: 'Bloqueado após 42 itens — captcha detectado.',
  },
  {
    id: 'run-007',
    targetId: 'tgt-002',
    startedAt: '2026-05-11T06:00:00Z',
    finishedAt: '2026-05-11T06:05:10Z',
    status: 'success',
    itemsFound: 87,
  },
  {
    id: 'run-008',
    targetId: 'tgt-003',
    startedAt: '2026-05-04T04:00:00Z',
    finishedAt: '2026-05-04T04:06:55Z',
    status: 'success',
    itemsFound: 19,
    notes: '19 leads gerados em Lisboa.',
  },
  {
    id: 'run-009',
    targetId: 'tgt-004',
    startedAt: '2026-05-03T04:00:00Z',
    finishedAt: '2026-05-03T04:09:30Z',
    status: 'success',
    itemsFound: 31,
  },
  {
    id: 'run-010',
    targetId: 'tgt-001',
    startedAt: '2026-05-11T06:00:00Z',
    finishedAt: '2026-05-11T06:03:00Z',
    status: 'success',
    itemsFound: 130,
  },
];
