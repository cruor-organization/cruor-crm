// backend/src/domain/orders/order-fsm.test.ts
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../shared/errors.js';

import { assertTransition, isValidOrderTransition } from './order-fsm.js';

describe('isValidOrderTransition (âmbito fatia 2)', () => {
  it('aceita as transições do núcleo comercial', () => {
    expect(isValidOrderTransition('DRAFT', 'PENDING_CONFIRMATION')).toBe(true);
    expect(isValidOrderTransition('DRAFT', 'CANCELLED')).toBe(true);
    expect(isValidOrderTransition('PENDING_CONFIRMATION', 'CONFIRMED')).toBe(true);
    expect(isValidOrderTransition('PENDING_CONFIRMATION', 'CANCELLED')).toBe(true);
    expect(isValidOrderTransition('CONFIRMED', 'CANCELLED')).toBe(true);
  });

  it('rejeita saltos inválidos', () => {
    expect(isValidOrderTransition('DRAFT', 'CONFIRMED')).toBe(false);
    expect(isValidOrderTransition('CONFIRMED', 'DRAFT')).toBe(false);
  });

  it('rejeita transições fora do âmbito desta fatia (fulfilment/devoluções)', () => {
    expect(isValidOrderTransition('CONFIRMED', 'PICKING')).toBe(false);
    expect(isValidOrderTransition('PACKED', 'SHIPPED')).toBe(false);
    expect(isValidOrderTransition('SHIPPED', 'DELIVERED')).toBe(false);
  });

  it('estados terminais e sem aresta não permitem nada', () => {
    expect(isValidOrderTransition('CANCELLED', 'DRAFT')).toBe(false);
    expect(isValidOrderTransition('PICKING', 'PACKED')).toBe(false);
  });
});

describe('assertTransition', () => {
  it('não lança em transição válida', () => {
    expect(() => assertTransition('DRAFT', 'PENDING_CONFIRMATION')).not.toThrow();
  });

  it('lança ValidationError em transição inválida', () => {
    expect(() => assertTransition('DRAFT', 'CONFIRMED')).toThrowError(ValidationError);
    expect(() => assertTransition('CANCELLED', 'CONFIRMED')).toThrowError(ValidationError);
  });
});
