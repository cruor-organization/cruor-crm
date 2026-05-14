import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatEur } from '@/lib/format';
import { mockAbcCustomers, type MarginClassification, type AbcCustomerRow } from '@/lib/mock-data';

export const Route = createFileRoute('/reports/abc')({
  component: AbcPage,
});

type BucketFilter = MarginClassification | 'ALL';

const BUCKET_LABELS: Record<MarginClassification, string> = {
  A: 'A — Âncoras',
  B: 'B — Crescimento',
  C: 'C — Manutenção',
  D: 'D — Risco',
};

const BUCKET_COLORS: Record<MarginClassification, { card: string; badge: string; text: string }> = {
  A: { card: 'border-green-200 bg-green-50', badge: 'success', text: 'text-green-700' },
  B: { card: 'border-blue-200 bg-blue-50', badge: 'info', text: 'text-blue-700' },
  C: { card: 'border-amber-200 bg-amber-50', badge: 'warning', text: 'text-amber-700' },
  D: { card: 'border-red-200 bg-red-50', badge: 'danger', text: 'text-red-700' },
};

// Floristas que desceram de bucket (mock alerts)
const DESCENT_ALERTS: {
  name: string;
  from: MarginClassification;
  to: MarginClassification;
  quarters: number;
}[] = [
  { name: 'Pétalas & Arte — Coimbra', from: 'A', to: 'B', quarters: 2 },
  { name: 'Verde Vivo — Setúbal', from: 'A', to: 'B', quarters: 2 },
];

const BUCKETS: MarginClassification[] = ['A', 'B', 'C', 'D'];

function AbcPage() {
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>('ALL');

  const totalRevenue = useMemo(
    () => mockAbcCustomers.reduce((acc, c) => acc + c.revenueEur, 0),
    [],
  );

  const bucketStats = useMemo(() => {
    return BUCKETS.map((b) => {
      const rows = mockAbcCustomers.filter((c) => c.bucket === b);
      const revenue = rows.reduce((acc, c) => acc + c.revenueEur, 0);
      return {
        bucket: b,
        count: rows.length,
        revenue,
        revenuePct: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      };
    });
  }, [totalRevenue]);

  const filteredCustomers = useMemo((): AbcCustomerRow[] => {
    if (bucketFilter === 'ALL') return mockAbcCustomers;
    return mockAbcCustomers.filter((c) => c.bucket === bucketFilter);
  }, [bucketFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ABC — Segmentação de Floristas"
        subtitle="A: top 20% margem · B: 20–50% · C: 50–80% · D: bottom 20%"
      />

      {/* Alertas de descida de bucket */}
      {DESCENT_ALERTS.length > 0 && (
        <div className="rounded-control border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="mb-1 text-sm font-semibold text-amber-800">Alertas de descida</p>
          <ul className="space-y-1">
            {DESCENT_ALERTS.map((alert, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-amber-700">
                <span className="text-amber-500">!</span>
                <strong>{alert.name.split(' — ')[0]}</strong> desceu de bucket{' '}
                <Badge variant="success">{alert.from}</Badge> para{' '}
                <Badge variant="info">{alert.to}</Badge> há {alert.quarters} trimestres
                consecutivos.
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bucket summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {bucketStats.map((stat) => {
          const colors = BUCKET_COLORS[stat.bucket];
          const isActive = bucketFilter === stat.bucket;
          return (
            <button
              key={stat.bucket}
              type="button"
              onClick={() => setBucketFilter(isActive ? 'ALL' : stat.bucket)}
              className={`rounded-card border p-4 text-left transition-all duration-150 ${colors.card} ${isActive ? 'ring-2 ring-offset-1 ring-cruor-400' : 'hover:opacity-80'}`}
            >
              <p className={`text-lg font-bold ${colors.text}`}>{BUCKET_LABELS[stat.bucket]}</p>
              <p className="mt-1 font-mono tabular-nums text-2xl font-semibold text-neutral-900">
                {stat.count}
              </p>
              <p className="font-mono tabular-nums text-xs text-neutral-600">
                {formatEur(stat.revenue)} · {stat.revenuePct.toFixed(1)}% receita
              </p>
            </button>
          );
        })}
      </div>
      {bucketFilter !== 'ALL' && (
        <div className="flex">
          <button
            type="button"
            onClick={() => setBucketFilter('ALL')}
            className="text-xs text-neutral-400 underline hover:text-neutral-600"
          >
            Mostrar todos
          </button>
        </div>
      )}

      {/* Tabela drill-in */}
      <Card padding="none">
        <div className="border-b border-neutral-100 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700">
            {bucketFilter === 'ALL'
              ? `Todos os floristas (${filteredCustomers.length})`
              : `Bucket ${bucketFilter} — ${filteredCustomers.length} floristas`}
          </h2>
          <div className="flex gap-2">
            {(['ALL', ...BUCKETS] as BucketFilter[]).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBucketFilter(b)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  bucketFilter === b
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {b === 'ALL' ? 'Todos' : b}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
                <th className="px-4 py-2 font-medium">Florista</th>
                <th className="px-4 py-2 font-medium">Região</th>
                <th className="px-4 py-2 text-right font-medium">Receita</th>
                <th className="px-4 py-2 text-right font-medium">Margem €</th>
                <th className="px-4 py-2 text-right font-medium">Margem %</th>
                <th className="px-4 py-2 font-medium">Bucket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredCustomers.map((c) => {
                const colors = BUCKET_COLORS[c.bucket];
                const hasAlert = DESCENT_ALERTS.some((a) => a.name === c.name);
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-neutral-50 ${c.bucket === 'A' ? 'bg-green-50/40' : ''}`}
                  >
                    <td className="px-4 py-2.5 font-medium text-neutral-800">
                      {c.name.split(' — ')[0]}
                      {hasAlert && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                          alerta
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500">{c.region}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-neutral-600">
                      {formatEur(c.revenueEur)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums font-medium text-neutral-800">
                      {formatEur(c.marginEur)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-neutral-600">
                      {c.marginPct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={colors.badge as 'success' | 'info' | 'warning' | 'danger'}>
                        {c.bucket}
                      </Badge>
                      {c.previousBucket && c.previousBucket !== c.bucket && (
                        <span className="ml-1 text-xs text-neutral-400">
                          era {c.previousBucket}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
