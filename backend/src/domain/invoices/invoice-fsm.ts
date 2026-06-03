// backend/src/domain/invoices/invoice-fsm.ts
import { ValidationError } from '../../shared/errors.js';

export type InvoiceStatus = 'PENDING' | 'ISSUED' | 'PAID' | 'VOID';

const ALLOWED: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  PENDING: ['ISSUED', 'VOID'],
  ISSUED: ['PAID', 'VOID'],
  PAID: [],
  VOID: [],
};

export function assertInvoiceTransition(from: InvoiceStatus, to: InvoiceStatus): void {
  if (!ALLOWED[from].includes(to)) {
    throw new ValidationError('INVALID_INVOICE_TRANSITION', 'Transição de fatura inválida.', {
      from,
      to,
    });
  }
}
