import { describe, expect, it } from 'vitest';

import { AppError, ConflictError, ForbiddenError, isAppError, ValidationError } from './errors.js';

describe('AppError hierarchy', () => {
  it('serializa code + message + details em toJSON', () => {
    const err = new ValidationError('PRICE_BELOW_FLOOR', 'preço abaixo do mínimo', {
      sku: 'X',
      floor: 10,
    });
    expect(err.toJSON()).toEqual({
      code: 'PRICE_BELOW_FLOOR',
      message: 'preço abaixo do mínimo',
      details: { sku: 'X', floor: 10 },
    });
    expect(err.httpStatus).toBe(400);
  });

  it('ForbiddenError com httpStatus 403', () => {
    const err = new ForbiddenError('SIGNUP_DISABLED');
    expect(err.httpStatus).toBe(403);
  });

  it('ConflictError com httpStatus 409', () => {
    const err = new ConflictError('LEAD_ALREADY_CONVERTED');
    expect(err.httpStatus).toBe(409);
  });

  it('isAppError discrimina', () => {
    expect(isAppError(new ValidationError('X'))).toBe(true);
    expect(isAppError(new Error('plain'))).toBe(false);
    expect(isAppError(null)).toBe(false);
  });

  it('AppError nome reflete classe concreta', () => {
    const v = new ValidationError('X');
    expect(v.name).toBe('ValidationError');
    const a = new AppError('Y', 'm', 500);
    expect(a.name).toBe('AppError');
  });
});
