// backend/src/domain/invoices/payment.test.ts
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../shared/errors.js';

import { applyPayment } from './payment.js';

describe('applyPayment', () => {
  it('pagamento parcial não atinge PAID', () => {
    expect(applyPayment(100, 0, 40)).toEqual({ paidEur: 40, reachesPaid: false });
  });

  it('pagamento que cobre o total atinge PAID', () => {
    expect(applyPayment(100, 40, 60)).toEqual({ paidEur: 100, reachesPaid: true });
  });

  it('rejeita pagamento que excede o em aberto', () => {
    try {
      applyPayment(100, 40, 61);
      throw new Error('devia ter lançado');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).code).toBe('PAYMENT_EXCEEDS_OUTSTANDING');
    }
  });
});
