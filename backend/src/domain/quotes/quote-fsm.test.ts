// backend/src/domain/quotes/quote-fsm.test.ts
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../shared/errors.js';

import { assertQuoteTransition, isValidQuoteTransition } from './quote-fsm.js';

describe('isValidQuoteTransition', () => {
  it('aceita o caminho normal', () => {
    expect(isValidQuoteTransition('DRAFT', 'SENT')).toBe(true);
    expect(isValidQuoteTransition('SENT', 'ACCEPTED')).toBe(true);
    expect(isValidQuoteTransition('SENT', 'REJECTED')).toBe(true);
    expect(isValidQuoteTransition('SENT', 'EXPIRED')).toBe(true);
  });

  it('aceita cancelar em DRAFT e SENT', () => {
    expect(isValidQuoteTransition('DRAFT', 'CANCELLED')).toBe(true);
    expect(isValidQuoteTransition('SENT', 'CANCELLED')).toBe(true);
  });

  it('rejeita saltos inválidos', () => {
    expect(isValidQuoteTransition('DRAFT', 'ACCEPTED')).toBe(false);
    expect(isValidQuoteTransition('ACCEPTED', 'SENT')).toBe(false);
    expect(isValidQuoteTransition('SENT', 'DRAFT')).toBe(false);
  });

  it('estados terminais não permitem nada', () => {
    for (const t of ['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'] as const) {
      expect(isValidQuoteTransition(t, 'SENT')).toBe(false);
    }
  });
});

describe('assertQuoteTransition', () => {
  it('não lança em transição válida', () => {
    expect(() => assertQuoteTransition('SENT', 'ACCEPTED')).not.toThrow();
  });

  it('lança ValidationError em transição inválida', () => {
    expect(() => assertQuoteTransition('DRAFT', 'ACCEPTED')).toThrowError(ValidationError);
    expect(() => assertQuoteTransition('ACCEPTED', 'REJECTED')).toThrowError(ValidationError);
  });
});
