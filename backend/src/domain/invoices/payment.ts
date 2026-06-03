// backend/src/domain/invoices/payment.ts
import { ValidationError } from '../../shared/errors.js';

/** Aplica um pagamento e indica se a fatura passa a totalmente paga. */
export function applyPayment(
  totalEur: number,
  paidEur: number,
  amount: number,
): { paidEur: number; reachesPaid: boolean } {
  const outstanding = totalEur - paidEur;
  if (amount > outstanding + 1e-9) {
    throw new ValidationError('PAYMENT_EXCEEDS_OUTSTANDING', 'Pagamento excede o valor em aberto.', {
      outstanding,
      amount,
    });
  }
  const next = paidEur + amount;
  return { paidEur: next, reachesPaid: next + 1e-9 >= totalEur };
}
