import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/Badge';
import { BarChart } from '@/components/ui/BarChart';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stat } from '@/components/ui/Stat';
import { formatEur } from '@/lib/format';
import {
  mockCustomerMargins,
  mockProductMargins,
  mockCategoryMargins,
  type CustomerMarginRow,
  type ProductMarginRow,
  type MarginClassification,
} from '@/lib/mock-data';

export const Route = createFileRoute('/reports/margins')({
  component: MarginsPage,
});

const classificationVariant: Record<
  MarginClassification,
  'success' | 'info' | 'warning' | 'danger'
> = {
  A: 'success',
  B: 'info',
  C: 'warning',
  D: 'danger',
};

function MarginsPage() {
  const [customerMargins, setCustomerMargins] = useState<CustomerMarginRow[]>([]);
  const [productMargins, setProductMargins] = useState<ProductMarginRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setCustomerMargins(mockCustomerMargins);
      setProductMargins(mockProductMargins);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const avgMarginPct =
    customerMargins.length > 0
      ? (customerMargins.reduce((acc, r) => acc + r.marginPct, 0) / customerMargins.length).toFixed(
          1,
        )
      : '—';

  const bestCustomer = customerMargins[0];
  const bestProduct = productMargins[0];

  const top10Customers = [...customerMargins]
    .sort((a, b) => b.marginEur - a.marginEur)
    .slice(0, 10);

  const top10Products = [...productMargins].sort((a, b) => b.marginPct - a.marginPct).slice(0, 10);

  const bottom5Customers = [...customerMargins]
    .sort((a, b) => a.marginPct - b.marginPct)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Análise de Margens"
        subtitle="Margem por florista, produto e categoria — período corrente"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Margem média (floristas)"
          value={loading ? '—' : `${avgMarginPct}%`}
          delta={{ value: '2.1 pp', direction: 'up' }}
        />
        <Stat
          label="Melhor florista"
          value={loading ? '—' : (bestCustomer?.name.split(' — ')[0] ?? '—')}
          delta={{ value: `${bestCustomer?.marginPct.toFixed(1)}%`, direction: 'up' }}
        />
        <Stat
          label="Melhor produto (margem %)"
          value={loading ? '—' : (bestProduct?.name.split(' (')[0] ?? '—')}
          delta={{ value: `${bestProduct?.marginPct.toFixed(1)}%`, direction: 'up' }}
        />
      </div>

      {/* Bar chart — top 10 floristas por margem €  */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-700">
          Top 10 floristas — margem bruta (€)
        </h2>
        {loading ? (
          <div className="h-48 animate-pulse rounded bg-neutral-100" />
        ) : (
          <BarChart
            data={top10Customers.map((c) => ({
              label: c.name.split(' — ')[0] ?? c.name,
              value: c.marginEur,
              sublabel: `${c.marginPct.toFixed(1)}%`,
            }))}
            format={formatEur}
            colorClass="bg-cruor-500"
          />
        )}
      </Card>

      {/* Tabelas lado a lado */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tabela floristas */}
        <Card padding="none">
          <div className="border-b border-neutral-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-neutral-700">Floristas — top + bottom</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
                  <th className="px-4 py-2 font-medium">Florista</th>
                  <th className="px-4 py-2 text-right font-medium">Receita</th>
                  <th className="px-4 py-2 text-right font-medium">Margem</th>
                  <th className="px-4 py-2 text-right font-medium">%</th>
                  <th className="px-4 py-2 font-medium">Classe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-4 py-2">
                          <div className="h-4 animate-pulse rounded bg-neutral-100" />
                        </td>
                      </tr>
                    ))
                  : [...top10Customers.slice(0, 7), ...bottom5Customers].map((row) => (
                      <tr key={row.id} className="hover:bg-neutral-50">
                        <td className="max-w-[160px] truncate px-4 py-2 text-neutral-800">
                          {row.name.split(' — ')[0]}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-600">
                          {formatEur(row.revenueEur)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-neutral-800">
                          {formatEur(row.marginEur)}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-600">
                          {row.marginPct.toFixed(1)}%
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={classificationVariant[row.classification]}>
                            {row.classification}
                          </Badge>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Tabela produtos */}
        <Card padding="none">
          <div className="border-b border-neutral-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-neutral-700">Produtos — melhores margens</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
                  <th className="px-4 py-2 font-medium">Produto</th>
                  <th className="px-4 py-2 font-medium">Categoria</th>
                  <th className="px-4 py-2 text-right font-medium">Margem €</th>
                  <th className="px-4 py-2 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="px-4 py-2">
                          <div className="h-4 animate-pulse rounded bg-neutral-100" />
                        </td>
                      </tr>
                    ))
                  : top10Products.map((row) => (
                      <tr key={row.id} className="hover:bg-neutral-50">
                        <td
                          className="max-w-[160px] truncate px-4 py-2 text-neutral-800"
                          title={row.name}
                        >
                          {row.name.split(' (')[0]}
                        </td>
                        <td className="px-4 py-2 text-neutral-500">{row.category}</td>
                        <td className="px-4 py-2 text-right font-medium text-neutral-800">
                          {formatEur(row.marginEur)}
                        </td>
                        <td className="px-4 py-2 text-right text-green-600 font-medium">
                          {row.marginPct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Categorias */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-700">Por categoria</h2>
        <BarChart
          data={mockCategoryMargins.map((c) => ({
            label: c.category,
            value: c.marginPct,
            sublabel: `${formatEur(c.marginEur)}`,
          }))}
          format={(n) => `${n.toFixed(1)}%`}
          colorClass="bg-blue-400"
          maxItems={6}
        />
      </Card>
    </div>
  );
}
