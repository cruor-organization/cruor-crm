// backend/src/domain/invoices/trigger.ts
/**
 * Estado da encomenda que despoleta a emissão da fatura (§10.14 few-shot 2):
 * pronto-pagamento fatura ao CONFIRMED; conta corrente fatura ao SHIPPED.
 */
export function invoiceTriggerFor(paymentTermDays: number): 'CONFIRMED' | 'SHIPPED' {
  return paymentTermDays > 0 ? 'SHIPPED' : 'CONFIRMED';
}
