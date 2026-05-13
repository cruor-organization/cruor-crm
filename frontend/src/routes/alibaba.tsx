/**
 * Rota /alibaba — dashboard de encomendas a fornecedores Alibaba.
 */
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  Globe,
  AlertTriangle,
  Package,
  TrendingDown,
  Plus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stat } from '@/components/ui/Stat';
import { formatEur, formatDate } from '@/lib/format';
import { mockFetch } from '@/lib/mock-api';
import {
  mockAlibabaOrders,
  type MockAlibabaOrder,
  type AlibabaOrderStatus,
} from '@/lib/mock-data/alibaba';

export const Route = createFileRoute('/alibaba')({
  component: AlibabaPage,
});

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const STATUS_VARIANT: Record<AlibabaOrderStatus, BadgeVariant> = {
  PLACED: 'neutral',
  IN_PRODUCTION: 'info',
  SHIPPED: 'info',
  IN_TRANSIT: 'info',
  CUSTOMS: 'warning',
  DELIVERED: 'success',
  DELAYED: 'danger',
  CANCELLED: 'danger',
};

const STATUS_LABEL: Record<AlibabaOrderStatus, string> = {
  PLACED: 'Colocada',
  IN_PRODUCTION: 'Em produção',
  SHIPPED: 'Expedida',
  IN_TRANSIT: 'Em trânsito',
  CUSTOMS: 'Alfândega',
  DELIVERED: 'Entregue',
  DELAYED: 'Atrasada',
  CANCELLED: 'Cancelada',
};

const ACTIVE_STATUSES: AlibabaOrderStatus[] = [
  'PLACED',
  'IN_PRODUCTION',
  'SHIPPED',
  'IN_TRANSIT',
  'CUSTOMS',
];

const TODAY_DATE = new Date('2026-05-13');
const NEXT_14_DAYS = new Date('2026-05-27');

// ---------------------------------------------------------------------------
// Modal: importar encomenda (placeholder)
// ---------------------------------------------------------------------------
function ImportOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step] = useState(1);

  return (
    <Modal open={open} onClose={onClose} title="Wizard de importação Alibaba" size="lg">
      <div className="space-y-4">
        {/* Indicador de passos */}
        <div className="flex gap-2">
          {['Fornecedor', 'Artigos', 'Logística', 'Confirmar'].map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              {i > 0 && <div className="h-px w-6 bg-neutral-200" />}
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  i + 1 === step
                    ? 'bg-emerald-600 text-white'
                    : i + 1 < step
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                <span>{i + 1}</span>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-sm text-blue-800">
            <strong>Passo 1: Fornecedor</strong> — selecciona o fornecedor Alibaba, incoterm e data
            de entrega estimada.
          </p>
        </div>

        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-700">
            <strong>Mock:</strong> nenhuma encomenda será criada. Wizard completo disponível na Fase
            3.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              console.info('[Alibaba] importar encomenda (mock)');
              onClose();
            }}
          >
            Iniciar (simulação)
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Detalhe inline expandido
// ---------------------------------------------------------------------------
function AlibabaDetail({ order }: { order: MockAlibabaOrder }) {
  return (
    <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-4 space-y-4">
      {/* Artigos */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Artigos
        </h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="pb-2 text-left text-xs font-semibold text-neutral-500">SKU</th>
              <th className="pb-2 text-left text-xs font-semibold text-neutral-500">Produto</th>
              <th className="pb-2 text-right text-xs font-semibold text-neutral-500">Qty</th>
              <th className="pb-2 text-right text-xs font-semibold text-neutral-500">Unit (USD)</th>
              <th className="pb-2 text-right text-xs font-semibold text-neutral-500">Unit (EUR)</th>
              <th className="pb-2 text-left text-xs font-semibold text-neutral-500">Lote</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="py-2 font-mono text-xs text-neutral-500">{item.sku}</td>
                <td className="py-2 text-neutral-900">{item.productName}</td>
                <td className="py-2 text-right text-neutral-700">
                  {item.qty.toLocaleString('pt-PT')}
                </td>
                <td className="py-2 text-right text-neutral-700">${item.unitCostUsd.toFixed(2)}</td>
                <td className="py-2 text-right text-neutral-700">{formatEur(item.unitCostEur)}</td>
                <td className="py-2 font-mono text-xs text-neutral-500">{item.batch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tracking */}
      {order.tracking.lastEvent && (
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Tracking
          </h4>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
            <div>
              <p className="text-xs font-medium text-neutral-700">
                {order.tracking.courier}
                {order.tracking.number && (
                  <span className="ml-2 font-mono text-neutral-500">{order.tracking.number}</span>
                )}
              </p>
              <p className="text-xs text-neutral-500">{order.tracking.lastEvent}</p>
            </div>
          </div>
        </div>
      )}

      {/* Custos */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div>
          <span className="text-neutral-500">Total USD:</span>{' '}
          <span className="font-medium text-neutral-700">
            ${order.totalUsd.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-neutral-500">Total EUR:</span>{' '}
          <span className="font-medium text-neutral-700">{formatEur(order.totalEur)}</span>
        </div>
        {order.landedCostEur && (
          <div>
            <span className="text-neutral-500">Custo landed:</span>{' '}
            <span className="font-medium text-neutral-700">{formatEur(order.landedCostEur)}</span>
          </div>
        )}
        <div>
          <span className="text-neutral-500">Incoterm:</span>{' '}
          <span className="font-medium text-neutral-700">{order.incoterm}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
function AlibabaPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['alibaba-orders'],
    queryFn: () => mockFetch(mockAlibabaOrders),
  });

  // KPIs
  const emCurso = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const atrasadas = orders.filter((o) => o.status === 'DELAYED').length;
  const proximasEntregas = orders.filter((o) => {
    if (!ACTIVE_STATUSES.includes(o.status)) return false;
    const eta = new Date(o.currentEta);
    return eta >= TODAY_DATE && eta <= NEXT_14_DAYS;
  }).length;
  const custoEmTransito = orders
    .filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalEur, 0);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function isOverdue(order: MockAlibabaOrder): boolean {
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') return false;
    return new Date(order.currentEta) < TODAY_DATE;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Alibaba"
        subtitle="Encomendas a fornecedores Alibaba e tracking de importação"
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setImportOpen(true)}>
            Importar encomenda
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Em curso"
          value={isLoading ? '…' : emCurso}
          icon={<Globe className="h-5 w-5" />}
        />
        <Stat
          label="Atrasadas"
          value={isLoading ? '…' : atrasadas}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <Stat
          label="Entregas próx. 14d"
          value={isLoading ? '…' : proximasEntregas}
          icon={<Package className="h-5 w-5" />}
        />
        <Stat
          label="Custo em trânsito"
          value={isLoading ? '…' : formatEur(custoEmTransito)}
          icon={<TrendingDown className="h-5 w-5" />}
        />
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="py-8 text-center text-sm text-neutral-500">A carregar…</div>
      ) : (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Fornecedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Artigos
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Incoterm
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  ETA
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Total EUR
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Tracking
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: MockAlibabaOrder) => {
                const isExpanded = expandedId === order.id;
                const overdue = isOverdue(order);
                return (
                  <>
                    <tr
                      key={order.id}
                      className="cursor-pointer border-b border-neutral-100 hover:bg-neutral-50"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <td className="px-4 py-3 text-neutral-400">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-emerald-700">
                        {order.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900">{order.supplier}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[order.status]}>
                          {STATUS_LABEL[order.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">
                        {order.items.length}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono font-medium text-neutral-700">
                          {order.incoterm}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={overdue ? 'font-medium text-red-600' : 'text-neutral-700'}>
                          {formatDate(order.currentEta)}
                        </span>
                        {overdue && <span className="ml-1 text-[10px] text-red-500">atraso</span>}
                        {order.currentEta !== order.eta && (
                          <p className="text-[10px] text-amber-600">
                            orig. {formatDate(order.eta)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-neutral-900">
                        {formatEur(order.totalEur)}
                      </td>
                      <td className="px-4 py-3">
                        {order.tracking.number ? (
                          <span className="font-mono text-xs text-neutral-500">
                            {order.tracking.number}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={9} className="p-0">
                          <AlibabaDetail order={order} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <ImportOrderModal open={importOpen} onClose={() => setImportOpen(false)} />
    </section>
  );
}
