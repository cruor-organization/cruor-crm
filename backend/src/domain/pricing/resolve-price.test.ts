import { describe, expect, it } from 'vitest';

import { AppError } from '../../shared/errors.js';

import { resolvePrice } from './resolve-price.js';

const now = new Date('2026-05-11T12:00:00.000Z');
const landedEur = 5; // floor = 5.50

describe('resolvePrice', () => {
  it('TIER_LIST sem qty break devolve unitPrice da linha', () => {
    const r = resolvePrice({
      qty: 10,
      customerSpecial: null,
      tierLine: { unitPriceEur: 7.5, minQty: 1, discountBreaks: [] },
      landedEur,
      now,
    });
    expect(r).toEqual({
      unitPriceEur: 7.5,
      appliedDiscountPct: 0,
      lineTotalEur: 75,
      source: 'TIER_LIST',
    });
  });

  it('TIER_LIST com qty break aplica desconto', () => {
    const r = resolvePrice({
      qty: 60,
      customerSpecial: null,
      tierLine: {
        unitPriceEur: 7.5,
        minQty: 1,
        discountBreaks: [
          { minQty: 10, discountPct: 0.02 },
          { minQty: 50, discountPct: 0.05 },
        ],
      },
      landedEur,
      now,
    });
    // 7.50 * 0.95 = 7.125 → round 7.13; total 7.13 * 60 = 427.80
    expect(r.unitPriceEur).toBe(7.13);
    expect(r.appliedDiscountPct).toBe(0.05);
    expect(r.lineTotalEur).toBe(427.8);
    expect(r.source).toBe('TIER_LIST');
  });

  it('CUSTOMER_SPECIAL activo bate TIER_LIST', () => {
    const r = resolvePrice({
      qty: 10,
      customerSpecial: { unitPriceEur: 6, validUntil: null },
      tierLine: { unitPriceEur: 7.5, minQty: 1, discountBreaks: [] },
      landedEur,
      now,
    });
    expect(r.source).toBe('CUSTOMER_SPECIAL');
    expect(r.unitPriceEur).toBe(6);
  });

  it('CUSTOMER_SPECIAL expirado faz fallback para TIER_LIST', () => {
    const expired = new Date('2026-01-01T00:00:00.000Z');
    const r = resolvePrice({
      qty: 10,
      customerSpecial: { unitPriceEur: 6, validUntil: expired },
      tierLine: { unitPriceEur: 7.5, minQty: 1, discountBreaks: [] },
      landedEur,
      now,
    });
    expect(r.source).toBe('TIER_LIST');
  });

  it('OVERRIDE bypassa hierarquia mas valida floor', () => {
    const r = resolvePrice({
      qty: 5,
      customerSpecial: { unitPriceEur: 6, validUntil: null },
      tierLine: null,
      landedEur,
      now,
      override: 9,
    });
    expect(r.source).toBe('OVERRIDE');
    expect(r.unitPriceEur).toBe(9);
  });

  it('PRICE_NOT_FOUND sem special e sem tier', () => {
    try {
      resolvePrice({ qty: 1, customerSpecial: null, tierLine: null, landedEur, now });
      expect.fail('devia ter lançado');
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).code).toBe('PRICE_NOT_FOUND');
    }
  });

  it('PRICE_NOT_FOUND quando qty < line.minQty', () => {
    try {
      resolvePrice({
        qty: 5,
        customerSpecial: null,
        tierLine: { unitPriceEur: 7.5, minQty: 10, discountBreaks: [] },
        landedEur,
        now,
      });
      expect.fail('devia ter lançado');
    } catch (e) {
      expect((e as AppError).code).toBe('PRICE_NOT_FOUND');
    }
  });

  it('PRICE_BELOW_FLOOR quando tier price desce abaixo do floor após desconto', () => {
    try {
      resolvePrice({
        qty: 100,
        customerSpecial: null,
        tierLine: {
          unitPriceEur: 6,
          minQty: 1,
          discountBreaks: [{ minQty: 50, discountPct: 0.2 }], // 6 × 0.8 = 4.80 < 5.50
        },
        landedEur,
        now,
      });
      expect.fail('devia ter lançado');
    } catch (e) {
      expect((e as AppError).code).toBe('PRICE_BELOW_FLOOR');
    }
  });

  it('PRICE_QTY_INVALID quando qty <= 0', () => {
    try {
      resolvePrice({
        qty: 0,
        customerSpecial: null,
        tierLine: { unitPriceEur: 7.5, minQty: 1, discountBreaks: [] },
        landedEur,
        now,
      });
      expect.fail('devia ter lançado');
    } catch (e) {
      expect((e as AppError).code).toBe('PRICE_QTY_INVALID');
    }
  });
});
