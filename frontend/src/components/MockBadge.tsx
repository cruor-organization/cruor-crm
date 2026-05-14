/**
 * Indicador visual para páginas com dados simulados (mock).
 * Remove em produção quando o backend estiver pronto.
 */
export function MockBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
      mock
    </span>
  );
}
