// backend/src/domain/alibaba/sync.ts
//
// Lógica pura de decisão do sync Alibaba → stock (§10.12). Sem imports de
// framework nem Prisma — testável isoladamente.
//
// INVARIANTE: stock incrementado EXATAMENTE uma vez por encomenda. A guarda de
// idempotência é `stockAlreadyApplied` (derivada de AlibabaOrder.stockAppliedAt),
// não o status local — assim um IN que falhou a meio é reaplicado no próximo sync
// em vez de ficar perdido para sempre.

export type AlibabaStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface StatusDecision {
  /** A encomenda ainda não existia localmente. */
  isNew: boolean;
  /** O estado remoto difere do local (ou é nova) — vale a pena upsert. */
  changed: boolean;
  /** Deve criar os StockMovement IN nesta passagem. */
  shouldApplyStock: boolean;
}

export function decideStatusChange(
  local: AlibabaStatus | null,
  remote: AlibabaStatus,
  stockAlreadyApplied: boolean,
): StatusDecision {
  const isNew = local === null;
  const changed = isNew || local !== remote;
  const shouldApplyStock = remote === 'DELIVERED' && !stockAlreadyApplied;
  return { isNew, changed, shouldApplyStock };
}
