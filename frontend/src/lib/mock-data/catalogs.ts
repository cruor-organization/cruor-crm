/**
 * Mock data para Catálogos PDF sazonais (§10.5).
 */

export type CatalogStatus = 'draft' | 'generating' | 'ready' | 'archived';

export interface Catalog {
  id: string;
  name: string;
  season: string;
  status: CatalogStatus;
  productCount: number;
  createdAt: string;
  generatedAt?: string;
  fileSizeKb?: number;
  gradientFrom: string;
  gradientTo: string;
}

export const mockCatalogs: Catalog[] = [
  {
    id: 'cat-001',
    name: 'Catálogo Verão 2026',
    season: 'Verão 2026',
    status: 'ready',
    productCount: 142,
    createdAt: '2026-04-15T10:00:00Z',
    generatedAt: '2026-04-16T08:30:00Z',
    fileSizeKb: 4820,
    gradientFrom: '#f59e0b',
    gradientTo: '#ef4444',
  },
  {
    id: 'cat-002',
    name: 'Catálogo Outono/Inverno 2025',
    season: 'Outono-Inverno 2025',
    status: 'archived',
    productCount: 128,
    createdAt: '2025-08-10T09:00:00Z',
    generatedAt: '2025-08-11T07:45:00Z',
    fileSizeKb: 4210,
    gradientFrom: '#92400e',
    gradientTo: '#78350f',
  },
  {
    id: 'cat-003',
    name: 'Catálogo Primavera 2026',
    season: 'Primavera 2026',
    status: 'ready',
    productCount: 156,
    createdAt: '2026-01-20T11:00:00Z',
    generatedAt: '2026-01-21T09:00:00Z',
    fileSizeKb: 5340,
    gradientFrom: '#10b981',
    gradientTo: '#059669',
  },
  {
    id: 'cat-004',
    name: 'Catálogo Especial São Valentim',
    season: 'Especial',
    status: 'archived',
    productCount: 48,
    createdAt: '2026-01-05T14:00:00Z',
    generatedAt: '2026-01-06T10:00:00Z',
    fileSizeKb: 1820,
    gradientFrom: '#ec4899',
    gradientTo: '#be185d',
  },
  {
    id: 'cat-005',
    name: 'Catálogo Outono/Inverno 2026',
    season: 'Outono-Inverno 2026',
    status: 'generating',
    productCount: 0,
    createdAt: '2026-05-14T08:00:00Z',
    gradientFrom: '#7c3aed',
    gradientTo: '#4c1d95',
  },
  {
    id: 'cat-006',
    name: 'Seleção Premium 2026',
    season: 'Especial',
    status: 'draft',
    productCount: 32,
    createdAt: '2026-05-12T16:00:00Z',
    gradientFrom: '#1d4ed8',
    gradientTo: '#1e3a8a',
  },
];

export const CATALOG_SEASONS = ['Primavera 2027', 'Verão 2027', 'Outono-Inverno 2027', 'Especial'];
