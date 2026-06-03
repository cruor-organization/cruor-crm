// backend/src/domain/invoices/credit.ts
import { ConflictError } from '../../shared/errors.js';

/**
 * Verifica o crédito disponível antes de criar a encomenda (§10.14 few-shot 1).
 * `paymentUpfront` (pronto-pagamento) salta a verificação.
 */
export function assertCreditAvailable(
  creditUsed: number,
  orderValue: number,
  creditLimitEur: number,
  paymentUpfront: boolean,
): void {
  if (!paymentUpfront && creditUsed + orderValue > creditLimitEur) {
    throw new ConflictError('CREDIT_LIMIT_EXCEEDED', 'Limite de crédito excedido.', {
      limit: creditLimitEur,
      used: creditUsed,
      orderValue,
    });
  }
}
