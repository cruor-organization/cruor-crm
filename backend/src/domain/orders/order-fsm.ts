// backend/src/domain/orders/order-fsm.ts
/**
 * FSM de CustomerOrder (§7.4, §10.14 few-shot 3).
 *
 * Tabela DELIBERADAMENTE reduzida às transições cujo efeito de stock já está
 * implementado nesta fatia. A tabela cresce por fatia até à forma canónica:
 * NÃO adicionar uma aresta sem adicionar o handler de efeito correspondente
 * (ex.: SHIPPED só entra com a conversão RESERVE→OUT). Invariante:
 * "transição válida ≡ transição honrada".
 */
import { ValidationError } from '../../shared/errors.js';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'PICKING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURN_RECEIVED'
  | 'REFUNDED'
  | 'REPLACED';

const ORDER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  DRAFT: ['PENDING_CONFIRMATION', 'CANCELLED'],
  PENDING_CONFIRMATION: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'], // PICKING+ entram na fatia 3, com os efeitos de stock
  CANCELLED: [],
};

export function isValidOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (ORDER_TRANSITIONS[from] ?? []).includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!isValidOrderTransition(from, to)) {
    throw new ValidationError('INVALID_ORDER_TRANSITION', 'Transição de estado inválida.', {
      from,
      to,
    });
  }
}
