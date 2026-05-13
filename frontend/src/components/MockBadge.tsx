/**
 * Indicador visual para páginas com dados simulados (mock).
 * Remove em produção quando o backend estiver pronto.
 */
export function MockBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
      mock
    </span>
  );
}
