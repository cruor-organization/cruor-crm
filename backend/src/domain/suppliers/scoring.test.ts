import { describe, expect, it } from 'vitest';

import { scoreSupplier } from './scoring.js';

describe('scoreSupplier', () => {
  it('100 quando fornecedor é perfeito', () => {
    expect(scoreSupplier({ onTimeRate: 1, defectRate: 0, avgResponseHours: 0 })).toBe(100);
  });

  it('0 quando fornecedor é mau em todos os eixos', () => {
    expect(scoreSupplier({ onTimeRate: 0, defectRate: 1, avgResponseHours: 100 })).toBe(0);
  });

  it('pontua proporcionalmente', () => {
    const s = scoreSupplier({ onTimeRate: 0.9, defectRate: 0.05, avgResponseHours: 4 });
    expect(s).toBeGreaterThan(80);
    expect(s).toBeLessThan(100);
  });

  it('clampa inputs fora de range', () => {
    expect(scoreSupplier({ onTimeRate: 2, defectRate: -1, avgResponseHours: 999 })).toBe(80);
  });
});
