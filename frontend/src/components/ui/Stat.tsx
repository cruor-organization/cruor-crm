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
      ? 'text-emerald-600'
      : delta?.direction === 'down'
        ? 'text-red-500'
        : 'text-neutral-500';

  const deltaPrefix = delta?.direction === 'up' ? '↑' : delta?.direction === 'down' ? '↓' : '';

  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        {icon && <span className="text-neutral-400">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
      {delta && (
        <p className={`mt-1 text-xs font-medium ${deltaColor}`}>
          {deltaPrefix} {delta.value} vs. período anterior
        </p>
      )}
    </Card>
  );
}
