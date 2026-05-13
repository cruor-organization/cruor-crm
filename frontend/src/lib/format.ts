/**
 * Utilitários de formatação de dados para pt-PT.
 */

/**
 * Formata um número como moeda EUR em locale pt-PT.
 * Exemplo: formatEur(1234.56) → "€ 1.234,56"
 */
export function formatEur(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata uma data como string legível em pt-PT.
 * Exemplo: formatDate("2026-05-13") → "13 Mai 2026"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formata uma data + hora.
 * Exemplo: formatDatetime("2026-05-13T10:30:00Z") → "13 Mai 2026, 10:30"
 */
export function formatDatetime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
