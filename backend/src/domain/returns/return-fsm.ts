// backend/src/domain/returns/return-fsm.ts
/**
 * FSM de Return (§10.18) — espelha o caminho de devolução do CustomerOrder
 * (§10.14 few-shot 3). Mantida em lockstep:
 *
 *   REQUESTED → RECEIVED → REFUNDED | REPLACED
 *
 * Efeitos de stock honrados pelo returnsService (RETURN→quarentena no RECEIVED;
 * RESTOCK via transfer / SCRAP via OUT no REFUNDED|REPLACED). Como na FSM da
 * encomenda: NÃO adicionar uma aresta sem o handler de efeito correspondente.
 * Invariante: "transição válida ≡ transição honrada".
 */
import { ValidationError } from '../../shared/errors.js';

export type ReturnStatus = 'REQUESTED' | 'RECEIVED' | 'REFUNDED' | 'REPLACED';

const RETURN_TRANSITIONS: Partial<Record<ReturnStatus, ReturnStatus[]>> = {
  REQUESTED: ['RECEIVED'],
  RECEIVED: ['REFUNDED', 'REPLACED'],
  REFUNDED: [],
  REPLACED: [],
};

export function isValidReturnTransition(from: ReturnStatus, to: ReturnStatus): boolean {
  return (RETURN_TRANSITIONS[from] ?? []).includes(to);
}

export function assertReturnTransition(from: ReturnStatus, to: ReturnStatus): void {
  if (!isValidReturnTransition(from, to)) {
    throw new ValidationError('INVALID_RETURN_TRANSITION', 'Transição de devolução inválida.', {
      from,
      to,
    });
  }
}
