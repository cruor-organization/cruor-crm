// backend/src/domain/returns/return-fsm.test.ts
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../shared/errors.js';

import { assertReturnTransition, isValidReturnTransition } from './return-fsm.js';

describe('isValidReturnTransition', () => {
  it('aceita o caminho de devolução', () => {
    expect(isValidReturnTransition('REQUESTED', 'RECEIVED')).toBe(true);
    expect(isValidReturnTransition('RECEIVED', 'REFUNDED')).toBe(true);
    expect(isValidReturnTransition('RECEIVED', 'REPLACED')).toBe(true);
  });

  it('rejeita saltos inválidos', () => {
    expect(isValidReturnTransition('REQUESTED', 'REFUNDED')).toBe(false);
    expect(isValidReturnTransition('REQUESTED', 'REPLACED')).toBe(false);
    expect(isValidReturnTransition('RECEIVED', 'REQUESTED')).toBe(false);
  });

  it('estados terminais não permitem nada', () => {
    expect(isValidReturnTransition('REFUNDED', 'REPLACED')).toBe(false);
    expect(isValidReturnTransition('REPLACED', 'REFUNDED')).toBe(false);
    expect(isValidReturnTransition('REFUNDED', 'RECEIVED')).toBe(false);
  });
});

describe('assertReturnTransition', () => {
  it('não lança em transição válida', () => {
    expect(() => assertReturnTransition('REQUESTED', 'RECEIVED')).not.toThrow();
    expect(() => assertReturnTransition('RECEIVED', 'REFUNDED')).not.toThrow();
  });

  it('lança ValidationError em transição inválida', () => {
    expect(() => assertReturnTransition('REQUESTED', 'REFUNDED')).toThrowError(ValidationError);
    expect(() => assertReturnTransition('REFUNDED', 'REPLACED')).toThrowError(ValidationError);
  });
});
