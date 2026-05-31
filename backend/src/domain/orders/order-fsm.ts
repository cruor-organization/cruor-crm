// backend/src/domain/orders/order-fsm.ts
/**
 * FSM de CustomerOrder (§7.4, §10.14 few-shot 3).
 *
 * Caminho núcleo + fulfilment já honrado (CONFIRMED→PICKING→PACKED→SHIPPED→DELIVERED).
 * As devoluções (RETURN_REQUESTED, RETURN_RECEIVED, REFUNDED, REPLACED) entram
 * na fatia seguinte, juntamente com os respetivos efeitos de stock.
 * NÃO adicionar uma aresta sem adicionar o handler de efeito correspondente.
 * Invariante: "transição válida ≡ transição honrada".
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
  CONFIRMED: ['PICKING', 'CANCELLED'],
  PICKING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'], // RETURN_REQUESTED entra na fatia de devoluções, com o efeito RETURN
  DELIVERED: [], // idem
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
