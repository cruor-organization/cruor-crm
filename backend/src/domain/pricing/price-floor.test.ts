import { describe, expect, it } from 'vitest';

import { AppError } from '../../shared/errors.js';

import { enforceFloor, floorFor, landedCost } from './price-floor.js';

describe('landedCost', () => {
  it('compõe custo + shipping + customs', () => {
    expect(landedCost({ unitCostEur: 10, shippingEur: 2, customsPct: 0.06 })).toBe(12.72);
  });

  it('apenas unitCost quando shipping/customs ausentes', () => {
    expect(landedCost({ unitCostEur: 5 })).toBe(5);
  });
});

describe('floorFor', () => {
  it('aplica multiplicador 1.10 e arredonda a cêntimo', () => {
    expect(floorFor(5)).toBe(5.5);
    expect(floorFor(7.34)).toBe(8.07);
  });
});

describe('enforceFloor', () => {
  it('passa quando exactamente no floor', () => {
    expect(() => enforceFloor(5.5, 5)).not.toThrow();
  });

  it('passa quando confortavelmente acima', () => {
    expect(() => enforceFloor(10, 5)).not.toThrow();
  });

  it('lança PRICE_BELOW_FLOOR quando abaixo', () => {
    try {
      enforceFloor(4, 5);
      expect.fail('devia ter lançado');
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      const err = e as AppError;
      expect(err.code).toBe('PRICE_BELOW_FLOOR');
      expect(err.httpStatus).toBe(400);
      expect(err.details).toMatchObject({ netUnitEur: 4, floor: 5.5, landedEur: 5 });
    }
  });
});
