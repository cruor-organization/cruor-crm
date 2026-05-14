/**
 * Rota /orders/$id — detalhe de encomenda com FSM, linhas e histórico.
 */
import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle, Truck, XCircle, FileText } from 'lucide-react';

import { LineItemsTable } from '@/components/orders/LineItemsTable';
import { OrderStatusFlow } from '@/components/orders/OrderStatusFlow';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate, formatDatetime } from '@/lib/format';
import { mockFetch } from '@/lib/mock-api';
import { mockOrders, type OrderStatus, type MockOrder } from '@/lib/mock-data/orders';

export const Route = createFileRoute('/orders/$id')({
  component: OrderDetailPage,
});

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
  AWAITING_PAYMENT: 'Aguarda pagamento',
  CONFIRMED: 'Confirmada',
  PICKING: 'Em picking',
  READY_TO_SHIP: 'Pronta a expedir',
  SHIPPED: 'Expedida',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelada',
  RETURNED: 'Devolvida',
};

const PAYMENT_LABEL: Record<string, string> = {
  BANK_TRANSFER: 'Transferência bancária',
  CARD: 'Cartão',
  COD: 'Pagamento na entrega',
};

function handleMockAction(label: string) {
  console.info(`[Orders] acção: ${label} (mock)`);
  alert(`${label} — funcionalidade disponível na Fase 3.`);
}

function OrderDetailPage() {
  const { id } = Route.useParams();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => mockFetch(mockOrders),
  });

  const order: MockOrder | undefined = orders.find((o) => o.id === id);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-neutral-500">A carregar encomenda…</div>;
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500">Encomenda não encontrada.</p>
        <Link to="/orders" className="mt-4 inline-block text-sm text-cruor-600 hover:underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  const isTerminal =
    order.status === 'DELIVERED' || order.status === 'CANCELLED' || order.status === 'RETURNED';

  return (
    <section className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            to="/orders"
            className="mt-0.5 rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-neutral-900 font-mono">{order.id}</h1>
              <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-neutral-500">
              {order.customer.name} · {order.customer.city}
            </p>
          </div>
        </div>

        {/* Acções contextuais */}
        {!isTerminal && (
          <div className="flex items-center gap-2">
            {order.status === 'AWAITING_PAYMENT' && (
              <Button
                size="sm"
                icon={<CheckCircle className="h-4 w-4" />}
                onClick={() => handleMockAction('Confirmar pagamento')}
              >
                Confirmar pag.
              </Button>
            )}
            {order.status === 'READY_TO_SHIP' && (
              <Button
                size="sm"
                icon={<Truck className="h-4 w-4" />}
                onClick={() => handleMockAction('Marcar como expedida')}
              >
                Marcar expedida
              </Button>
            )}
            {order.status === 'CONFIRMED' && (
              <Button
                size="sm"
                variant="secondary"
                icon={<FileText className="h-4 w-4" />}
                onClick={() => handleMockAction('Iniciar picking')}
              >
                Iniciar picking
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={<XCircle className="h-4 w-4" />}
              className="text-red-600 hover:bg-red-50"
              onClick={() => handleMockAction('Cancelar encomenda')}
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* FSM */}
      <Card padding="md">
        <OrderStatusFlow current={order.status} />
      </Card>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna esquerda — linhas */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Linhas
          </h2>
          <LineItemsTable
            lines={order.lines}
            subtotalEur={order.subtotalEur}
            vatEur={order.vatEur}
            vatPct={order.vatPct}
            totalEur={order.totalEur}
          />
        </div>

        {/* Coluna direita — info lateral */}
        <div className="space-y-4">
          {/* Cliente */}
          <Card padding="md">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Cliente
            </h3>
            <p className="font-medium text-neutral-900">{order.customer.name}</p>
            <p className="text-sm text-neutral-500">{order.customer.city}</p>
            <p className="mt-2 text-sm text-neutral-600">
              <span className="font-medium">Comercial:</span> {order.salesRep}
            </p>
          </Card>

          {/* Pagamento */}
          <Card padding="md">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Pagamento
            </h3>
            <p className="text-sm text-neutral-700">
              {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
            </p>
            <div className="mt-2 space-y-1 text-xs text-neutral-500">
              {order.placedAt && (
                <p>
                  <span className="font-medium">Colocada:</span> {formatDate(order.placedAt)}
                </p>
              )}
              {order.confirmedAt && (
                <p>
                  <span className="font-medium">Confirmada:</span> {formatDate(order.confirmedAt)}
                </p>
              )}
            </div>
          </Card>

          {/* Envio */}
          <Card padding="md">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Envio
            </h3>
            <p className="text-sm text-neutral-700">{order.shipping.address}</p>
            {order.shipping.courier && (
              <p className="mt-2 text-sm text-neutral-600">
                <span className="font-medium">Transportadora:</span> {order.shipping.courier}
              </p>
            )}
            {order.shipping.tracking && (
              <p className="text-sm text-neutral-600">
                <span className="font-medium">Tracking:</span>{' '}
                <span className="font-mono text-xs">{order.shipping.tracking}</span>
              </p>
            )}
            {order.shippedAt && (
              <p className="mt-1 text-xs text-neutral-500">
                <span className="font-medium">Expedida:</span> {formatDate(order.shippedAt)}
              </p>
            )}
            {order.deliveredAt && (
              <p className="text-xs text-neutral-500">
                <span className="font-medium">Entregue:</span> {formatDate(order.deliveredAt)}
              </p>
            )}
            {!order.shipping.courier && (
              <p className="mt-1 text-xs text-neutral-400">Transportadora ainda não atribuída.</p>
            )}
          </Card>

          {/* Histórico de estado */}
          <Card padding="md">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Histórico de estado
            </h3>
            <ol className="space-y-3">
              {[...order.statusHistory].reverse().map((entry, i) => (
                <li key={i} className="flex gap-2.5">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neutral-400" />
                  <div>
                    <p className="text-xs font-medium text-neutral-800">
                      {entry.fromStatus
                        ? `${STATUS_LABEL[entry.fromStatus]} → ${STATUS_LABEL[entry.toStatus]}`
                        : STATUS_LABEL[entry.toStatus]}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {entry.by} · {formatDatetime(entry.at)}
                    </p>
                    {entry.note && (
                      <p className="mt-0.5 text-[11px] text-neutral-400 italic">{entry.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </section>
  );
}
