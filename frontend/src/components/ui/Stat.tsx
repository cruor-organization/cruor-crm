import type { ReactNode } from 'react';

interface StatProps {
  label: string;
  value: string | number;
  delta?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
}

export function Stat({ label, value, delta, icon }: StatProps) {
  const deltaTone =
    delta?.direction === 'up'
      ? 'bg-green-50 text-green-700'
      : delta?.direction === 'down'
        ? 'bg-red-50 text-red-700'
        : 'bg-neutral-100 text-neutral-500';

  const deltaArrow = delta?.direction === 'up' ? '▲' : delta?.direction === 'down' ? '▼' : '—';

  return (
    <div className="rounded-card border border-neutral-200 bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      {/* Cabeçalho — label à esquerda, delta em pill à direita */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {icon && (
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-cruor-50 text-cruor-600">
              {icon}
            </span>
          )}
          <p className="truncate text-[13px] font-medium text-neutral-500">{label}</p>
        </div>
        {delta && (
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${deltaTone}`}
          >
            <span className="text-[8px] leading-none">{deltaArrow}</span>
            <span>{delta.value}</span>
          </span>
        )}
      </div>

      {/* Valor + sufixo discreto */}
      <div className="mt-2.5 flex items-baseline gap-2">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-neutral-900">{value}</p>
        {delta && (
          <span className="truncate text-[12px] text-neutral-400">vs. período anterior</span>
        )}
      </div>
    </div>
  );
}
