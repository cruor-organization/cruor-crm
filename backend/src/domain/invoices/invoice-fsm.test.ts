// backend/src/domain/invoices/invoice-fsm.test.ts
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../shared/errors.js';

import { assertInvoiceTransition } from './invoice-fsm.js';

describe('assertInvoiceTransition', () => {
  it('permite PENDING→ISSUED, ISSUED→PAID', () => {
    expect(() => assertInvoiceTransition('PENDING', 'ISSUED')).not.toThrow();
    expect(() => assertInvoiceTransition('ISSUED', 'PAID')).not.toThrow();
  });

  it('permite VOID a partir de PENDING e ISSUED', () => {
    expect(() => assertInvoiceTransition('PENDING', 'VOID')).not.toThrow();
    expect(() => assertInvoiceTransition('ISSUED', 'VOID')).not.toThrow();
  });

  it('rejeita transições inválidas', () => {
    try {
      assertInvoiceTransition('PAID', 'ISSUED');
      throw new Error('devia ter lançado');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).code).toBe('INVALID_INVOICE_TRANSITION');
    }
  });

  it('rejeita saltar PENDING→PAID', () => {
    expect(() => assertInvoiceTransition('PENDING', 'PAID')).toThrow(ValidationError);
  });
});
