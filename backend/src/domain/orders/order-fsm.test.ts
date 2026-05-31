// backend/src/domain/orders/order-fsm.test.ts
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../shared/errors.js';

import { assertTransition, isValidOrderTransition } from './order-fsm.js';

describe('isValidOrderTransition (núcleo + fulfilment)', () => {
  it('aceita as transições do núcleo comercial', () => {
    expect(isValidOrderTransition('DRAFT', 'PENDING_CONFIRMATION')).toBe(true);
    expect(isValidOrderTransition('DRAFT', 'CANCELLED')).toBe(true);
    expect(isValidOrderTransition('PENDING_CONFIRMATION', 'CONFIRMED')).toBe(true);
    expect(isValidOrderTransition('PENDING_CONFIRMATION', 'CANCELLED')).toBe(true);
    expect(isValidOrderTransition('CONFIRMED', 'CANCELLED')).toBe(true);
  });

  it('aceita o caminho de fulfilment', () => {
    expect(isValidOrderTransition('CONFIRMED', 'PICKING')).toBe(true);
    expect(isValidOrderTransition('PICKING', 'PACKED')).toBe(true);
    expect(isValidOrderTransition('PACKED', 'SHIPPED')).toBe(true);
    expect(isValidOrderTransition('SHIPPED', 'DELIVERED')).toBe(true);
    expect(isValidOrderTransition('PICKING', 'CANCELLED')).toBe(true);
    expect(isValidOrderTransition('PACKED', 'CANCELLED')).toBe(true);
  });

  it('rejeita saltos inválidos', () => {
    expect(isValidOrderTransition('DRAFT', 'CONFIRMED')).toBe(false);
    expect(isValidOrderTransition('CONFIRMED', 'DRAFT')).toBe(false);
    expect(isValidOrderTransition('CONFIRMED', 'SHIPPED')).toBe(false);
  });

  it('rejeita cancelar depois de expedir', () => {
    expect(isValidOrderTransition('SHIPPED', 'CANCELLED')).toBe(false);
    expect(isValidOrderTransition('DELIVERED', 'CANCELLED')).toBe(false);
  });

  it('rejeita devoluções (fatia futura)', () => {
    expect(isValidOrderTransition('SHIPPED', 'RETURN_REQUESTED')).toBe(false);
    expect(isValidOrderTransition('DELIVERED', 'RETURN_REQUESTED')).toBe(false);
    expect(isValidOrderTransition('RETURN_REQUESTED', 'RETURN_RECEIVED')).toBe(false);
  });

  it('estados terminais não permitem nada', () => {
    expect(isValidOrderTransition('CANCELLED', 'DRAFT')).toBe(false);
    expect(isValidOrderTransition('DELIVERED', 'DRAFT')).toBe(false);
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
