import type { ReactNode } from 'react';

import { Card } from './Card';

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
  const deltaColor =
    delta?.direction === 'up'
      ? 'text-green-600'
      : delta?.direction === 'down'
        ? 'text-red-500'
        : 'text-neutral-500';

  const deltaArrow = delta?.direction === 'up' ? '↑' : delta?.direction === 'down' ? '↓' : '→';

  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-neutral-400">{icon}</span>}
          <p className="text-[13px] text-neutral-500">{label}</p>
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-neutral-900 md:text-3xl">{value}</p>
      {delta && (
        <p className={`mt-1.5 flex items-center gap-0.5 text-xs font-medium ${deltaColor}`}>
          <span>{deltaArrow}</span>
          <span>{delta.value} vs. período anterior</span>
        </p>
      )}
    </Card>
  );
}
