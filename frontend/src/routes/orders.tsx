/**
 * Rota /orders — lista de encomendas com filtro de estado e KPIs.
 */
import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Plus, ShoppingCart, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stat } from '@/components/ui/Stat';
import { formatEur, formatDate } from '@/lib/format';
import { mockFetch } from '@/lib/mock-api';
import { mockOrders, type OrderStatus, type MockOrder } from '@/lib/mock-data/orders';

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
});

// ---------------------------------------------------------------------------
// Mapa de cores por estado
// ---------------------------------------------------------------------------
type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  AWAITING_PAYMENT: 'warning',
  CONFIRMED: 'info',
  PICKING: 'info',
  READY_TO_SHIP: 'info',
  SHIPPED: 'success',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  RETURNED: 'warning',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: 'Rascunho',
  AWAITING_PAYMENT: 'Aguarda pag.',
  CONFIRMED: 'Confirmada',
  PICKING: 'Em picking',
  READY_TO_SHIP: 'Pronta expedir',
  SHIPPED: 'Expedida',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelada',
  RETURNED: 'Devolvida',
};

// Labels dos filtros de status (null = todos)
const FILTER_TABS: { key: OrderStatus | null; label: string }[] = [
  { key: null, label: 'Todas' },
  { key: 'DRAFT', label: 'Rascunho' },
  { key: 'AWAITING_PAYMENT', label: 'Aguarda pag.' },
  { key: 'CONFIRMED', label: 'Confirmadas' },
  { key: 'PICKING', label: 'Picking' },
  { key: 'READY_TO_SHIP', label: 'Prontas' },
  { key: 'SHIPPED', label: 'Expedidas' },
  { key: 'DELIVERED', label: 'Entregues' },
  { key: 'CANCELLED', label: 'Canceladas' },
];

const TERMINAL_STATUSES: OrderStatus[] = ['DELIVERED', 'CANCELLED', 'RETURNED'];
const TODAY = '2026-05-13';

function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return dateStr.startsWith(TODAY);
}

function isNonTerminal(status: OrderStatus): boolean {
  return !TERMINAL_STATUSES.includes(status);
}

// ---------------------------------------------------------------------------
// Modal: nova encomenda (placeholder)
// ---------------------------------------------------------------------------
function NewOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Nova encomenda" size="md">
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">
          O wizard de criação de encomenda será implementado na Fase 3 do backend. Por agora, use
          este ecrã para confirmar que o modal funciona.
        </p>
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-700">
            <strong>Mock:</strong> nenhuma encomenda será criada.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              console.info('[Orders] nova encomenda (mock)');
              onClose();
            }}
          >
            Criar (simulação)
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => mockFetch(mockOrders),
  });

  const filtered: MockOrder[] = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  // KPIs
  const emCurso = orders.filter((o) => isNonTerminal(o.status)).length;
  const hoje = orders.filter((o) => isToday(o.createdAt)).length;
  const receita30d = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.totalEur, 0);
  const atrasadas = orders.filter(
    (o) =>
      o.status === 'AWAITING_PAYMENT' &&
      o.placedAt &&
      new Date(o.placedAt) < new Date('2026-05-06'),
  ).length;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Encomendas"
        subtitle="Pipeline de encomendas de clientes"
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setNewOrderOpen(true)}>
            Nova encomenda
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Em curso"
          value={isLoading ? '…' : emCurso}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <Stat
          label="Criadas hoje"
          value={isLoading ? '…' : hoje}
          icon={<Clock className="h-5 w-5" />}
        />
        <Stat
          label="Receita entregue"
          value={isLoading ? '…' : formatEur(receita30d)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <Stat
          label="Atraso pag."
          value={isLoading ? '…' : atrasadas}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Filtros de estado */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key ?? 'all'}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                active
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {tab.label}
              {!active && (
                <span className="ml-1.5 text-neutral-400">
                  {tab.key ? orders.filter((o) => o.status === tab.key).length : orders.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="py-8 text-center text-sm text-neutral-500">A carregar…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-neutral-500">
          Nenhuma encomenda com este estado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Criada
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Comercial
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link
                      to="/orders/$id"
                      params={{ id: order.id }}
                      className="font-mono text-xs font-medium text-emerald-700 hover:underline"
                    >
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{order.customer.name}</p>
                    <p className="text-xs text-neutral-500">{order.customer.city}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {STATUS_LABEL[order.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-900">
                    {formatEur(order.totalEur)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-neutral-600">{order.salesRep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewOrderModal open={newOrderOpen} onClose={() => setNewOrderOpen(false)} />
    </section>
  );
}
