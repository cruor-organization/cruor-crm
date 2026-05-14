/**
 * OrderStatusFlow — indicador de passos horizontal do FSM de encomendas.
 * Mostra o pipeline completo com o passo actual destacado.
 */
import { CheckCircle, XCircle } from 'lucide-react';

import type { OrderStatus } from '@/lib/mock-data/orders';

interface OrderStatusFlowProps {
  current: OrderStatus;
}

// Passos do pipeline principal (excluindo terminais especiais)
const MAIN_STEPS: OrderStatus[] = [
  'DRAFT',
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'PICKING',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
];

const STEP_LABELS: Record<OrderStatus, string> = {
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

export function OrderStatusFlow({ current }: OrderStatusFlowProps) {
  const isTerminal = current === 'CANCELLED' || current === 'RETURNED';
  const currentIndex = MAIN_STEPS.indexOf(current);

  return (
    <div className="space-y-3">
      {/* Pipeline principal */}
      <div className="flex items-center gap-0">
        {MAIN_STEPS.map((step, i) => {
          const isPast = !isTerminal && currentIndex > i;
          const isCurrent = !isTerminal && currentIndex === i;

          return (
            <div key={step} className="flex items-center">
              {/* Conectador — fino 1px */}
              {i > 0 && (
                <div
                  className={`h-px w-6 shrink-0 ${
                    isPast || (isCurrent && i > 0) ? 'bg-green-600' : 'bg-neutral-200'
                  }`}
                />
              )}
              {/* Nó */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors duration-150 ${
                    isCurrent
                      ? 'border-cruor-200 bg-cruor-600 text-white ring-2 ring-cruor-200'
                      : isPast
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-neutral-300 bg-surface text-neutral-400'
                  }`}
                >
                  {isPast ? <CheckCircle className="h-4 w-4" /> : <span>{i + 1}</span>}
                </div>
                <span
                  className={`max-w-[72px] text-center text-[10px] leading-tight ${
                    isCurrent
                      ? 'font-semibold text-cruor-700'
                      : isPast
                        ? 'text-green-600'
                        : 'text-neutral-400'
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estado terminal especial */}
      {isTerminal && (
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-medium ${
              current === 'CANCELLED'
                ? 'border border-red-200 bg-red-50 text-red-700'
                : 'border border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            {current === 'CANCELLED' ? 'Encomenda cancelada' : 'Encomenda devolvida'}
          </div>
        </div>
      )}
    </div>
  );
}
