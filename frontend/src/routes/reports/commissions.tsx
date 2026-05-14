import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';

import { Badge } from '@/components/ui/Badge';
import { BarChart } from '@/components/ui/BarChart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { formatEur } from '@/lib/format';
import { mockCommissions, COMMISSION_MONTHS, type CommissionRow } from '@/lib/mock-data';

export const Route = createFileRoute('/reports/commissions')({
  component: CommissionsPage,
});

const MONTH_LABELS: Record<string, string> = {
  '2025-12': 'Dezembro 2025',
  '2026-01': 'Janeiro 2026',
  '2026-02': 'Fevereiro 2026',
  '2026-03': 'Março 2026',
  '2026-04': 'Abril 2026',
  '2026-05': 'Maio 2026 (corrente)',
};

const MONTH_OPTIONS = COMMISSION_MONTHS.map((m) => ({ value: m, label: MONTH_LABELS[m] ?? m }));

function CommissionsPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [closingMonth, setClosingMonth] = useState(false);
  const [closedMonths, setClosedMonths] = useState<Set<string>>(
    new Set(mockCommissions.filter((r) => r.frozen).map((r) => r.month)),
  );

  const monthRows = useMemo(
    () => mockCommissions.filter((r: CommissionRow) => r.month === selectedMonth),
    [selectedMonth],
  );

  const totalCommission = monthRows.reduce((acc, r) => acc + r.commissionEur, 0);
  const totalOrders = monthRows.reduce((acc, r) => acc + r.ordersCount, 0);

  const isFrozen = closedMonths.has(selectedMonth);

  function handleCloseMonth() {
    setClosingMonth(true);
    setTimeout(() => {
      setClosedMonths((prev) => new Set([...prev, selectedMonth]));
      setClosingMonth(false);
      console.info('[mock] Mês fechado:', selectedMonth);
    }, 1200);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comissões"
        subtitle="Comissões mensais por representante de vendas"
        action={
          <div className="flex items-center gap-3">
            <Select
              value={selectedMonth}
              options={MONTH_OPTIONS}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            {!isFrozen && (
              <Button variant="primary" onClick={handleCloseMonth} disabled={closingMonth}>
                {closingMonth ? 'A fechar…' : 'Fechar mês'}
              </Button>
            )}
            {isFrozen && <Badge variant="neutral">Mês fechado</Badge>}
          </div>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-neutral-500">Total comissões</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {formatEur(totalCommission)}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-neutral-500">Encomendas no período</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">{totalOrders}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-neutral-500">Estado do mês</p>
          <p className="mt-2">
            {isFrozen ? (
              <Badge variant="neutral">Fechado</Badge>
            ) : (
              <Badge variant="warning">Em aberto</Badge>
            )}
          </p>
        </Card>
      </div>

      {/* Bar chart */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-700">
          Comissão por representante — {MONTH_LABELS[selectedMonth] ?? selectedMonth}
        </h2>
        <BarChart
          data={monthRows.map((r) => ({
            label: r.salesRep,
            value: r.commissionEur,
            sublabel: `(${r.pct}% s/ ${r.basis === 'MARGIN' ? 'margem' : 'receita'})`,
          }))}
          format={formatEur}
          colorClass="bg-violet-500"
        />
      </Card>

      {/* Tabela */}
      <Card padding="none">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-neutral-700">
            Detalhe — {MONTH_LABELS[selectedMonth] ?? selectedMonth}
          </h2>
          {isFrozen && <Badge variant="neutral">Declaração fechada</Badge>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
                <th className="px-4 py-2 font-medium">Representante</th>
                <th className="px-4 py-2 font-medium">Base</th>
                <th className="px-4 py-2 text-right font-medium">Base (€)</th>
                <th className="px-4 py-2 text-right font-medium">Taxa</th>
                <th className="px-4 py-2 text-right font-medium">Comissão</th>
                <th className="px-4 py-2 text-right font-medium">Encomendas</th>
                <th className="px-4 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {monthRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-400">
                    Sem dados para este período.
                  </td>
                </tr>
              ) : (
                <>
                  {monthRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800">{row.salesRep}</td>
                      <td className="px-4 py-3">
                        <Badge variant={row.basis === 'MARGIN' ? 'success' : 'info'}>
                          {row.basis === 'MARGIN' ? 'Margem' : 'Receita'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-600">
                        {formatEur(row.baseEur)}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-600">{row.pct}%</td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                        {formatEur(row.commissionEur)}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-600">{row.ordersCount}</td>
                      <td className="px-4 py-3">
                        {isFrozen ? (
                          <Badge variant="neutral">Fechado</Badge>
                        ) : (
                          <Badge variant="warning">Provisório</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Linha de totais */}
                  <tr className="border-t-2 border-neutral-200 bg-neutral-50 font-semibold">
                    <td className="px-4 py-3 text-neutral-700" colSpan={4}>
                      Total
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-900">
                      {formatEur(totalCommission)}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700">{totalOrders}</td>
                    <td />
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
