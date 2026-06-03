// backend/src/domain/invoices/credit.test.ts
import { describe, expect, it } from 'vitest';

import { ConflictError } from '../../shared/errors.js';

import { assertCreditAvailable } from './credit.js';

describe('assertCreditAvailable (§10.14)', () => {
  it('passa quando dentro do limite', () => {
    expect(() => assertCreditAvailable(100, 50, 200, false)).not.toThrow();
  });

  it('passa no limite exato', () => {
    expect(() => assertCreditAvailable(150, 50, 200, false)).not.toThrow();
  });

  it('lança CREDIT_LIMIT_EXCEEDED quando excede sem pronto-pagamento', () => {
    try {
      assertCreditAvailable(150, 60, 200, false);
      throw new Error('devia ter lançado');
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictError);
      expect((err as ConflictError).code).toBe('CREDIT_LIMIT_EXCEEDED');
    }
  });

  it('pronto-pagamento (paymentUpfront) ignora o limite', () => {
    expect(() => assertCreditAvailable(500, 500, 0, true)).not.toThrow();
  });
});
