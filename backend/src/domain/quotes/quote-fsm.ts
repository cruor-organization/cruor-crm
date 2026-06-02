// backend/src/domain/quotes/quote-fsm.ts
/**
 * FSM de Quote (§7 "Quote"). Proposta comercial que converte em CustomerOrder ao aceitar.
 *
 *   DRAFT → SENT → ACCEPTED | REJECTED | EXPIRED
 *   (DRAFT e SENT podem ainda ser CANCELLED)
 *
 * Único destino com efeito é ACCEPTED, honrado pelo quotesService (cria a encomenda
 * com os snapshots de preço). Os restantes são mudanças de estado puras (sem stock).
 * Invariante: "transição válida ≡ transição honrada".
 */
import { ValidationError } from '../../shared/errors.js';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

const QUOTE_TRANSITIONS: Partial<Record<QuoteStatus, QuoteStatus[]>> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
  CANCELLED: [],
};

export function isValidQuoteTransition(from: QuoteStatus, to: QuoteStatus): boolean {
  return (QUOTE_TRANSITIONS[from] ?? []).includes(to);
}

export function assertQuoteTransition(from: QuoteStatus, to: QuoteStatus): void {
  if (!isValidQuoteTransition(from, to)) {
    throw new ValidationError('INVALID_QUOTE_TRANSITION', 'Transição de proposta inválida.', {
      from,
      to,
    });
  }
}
