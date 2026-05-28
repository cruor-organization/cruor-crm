import { describe, expect, it } from 'vitest';

import { ConflictError } from '../../shared/errors.js';

import { assertTransition } from './pricing.service.js';

describe('assertTransition (PriceList FSM)', () => {
  it('permite DRAFT → ACTIVE', () => {
    expect(() => assertTransition('DRAFT', 'ACTIVE')).not.toThrow();
  });

  it('permite DRAFT → ARCHIVED (descartar rascunho)', () => {
    expect(() => assertTransition('DRAFT', 'ARCHIVED')).not.toThrow();
  });

  it('permite ACTIVE → ARCHIVED', () => {
    expect(() => assertTransition('ACTIVE', 'ARCHIVED')).not.toThrow();
  });

  it('rejeita ACTIVE → DRAFT', () => {
    expect(() => assertTransition('ACTIVE', 'DRAFT')).toThrowError(ConflictError);
  });

  it('rejeita ARCHIVED → ACTIVE', () => {
    expect(() => assertTransition('ARCHIVED', 'ACTIVE')).toThrowError(ConflictError);
  });

  it('rejeita ARCHIVED → DRAFT', () => {
    expect(() => assertTransition('ARCHIVED', 'DRAFT')).toThrowError(ConflictError);
  });

  it('rejeita transição idempotente (same status)', () => {
    expect(() => assertTransition('DRAFT', 'DRAFT')).toThrowError(ConflictError);
    expect(() => assertTransition('ACTIVE', 'ACTIVE')).toThrowError(ConflictError);
  });
});
