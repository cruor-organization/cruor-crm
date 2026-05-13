/**
 * Utilitários para simular chamadas à API com atraso artificial.
 * Compatível com TanStack Query: use como queryFn.
 *
 * Exemplo:
 *   useQuery({ queryKey: ['dashboard'], queryFn: () => mockFetch(dashboardData) })
 */

export function mockFetch<T>(data: T, delayMs = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function mockPaginated<T>(items: T[], page = 1, pageSize = 20): PaginatedResult<T> {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: items.slice(start, end),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
}
