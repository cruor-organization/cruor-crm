import { describe, expect, it } from 'vitest';

import { evaluateSafety } from './safety-stock.js';

describe('evaluateSafety', () => {
  it('OK quando available acima do safetyStock e sem velocidade', () => {
    const r = evaluateSafety({ available: 100, reserved: 10, safetyStock: 20 });
    expect(r.status).toBe('OK');
    expect(r.runwayDays).toBeNull();
  });

  it('BELOW_SAFETY quando available < safetyStock', () => {
    const r = evaluateSafety({ available: 5, reserved: 0, safetyStock: 10 });
    expect(r.status).toBe('BELOW_SAFETY');
  });

  it('STOCKOUT quando available <= 0', () => {
    expect(evaluateSafety({ available: 0, reserved: 0, safetyStock: 5 }).status).toBe('STOCKOUT');
  });

  it('STOCKOUT_IMMINENT quando runwayDays < leadTimeDays', () => {
    const r = evaluateSafety({
      available: 20,
      reserved: 0,
      safetyStock: 5,
      velocity28dPerDay: 2,
      leadTimeDays: 30,
    });
    // 20 / 2 = 10 dias de cobertura; lead time 30 → não dá tempo
    expect(r.status).toBe('STOCKOUT_IMMINENT');
    expect(r.runwayDays).toBe(10);
  });

  it('runwayDays calculado mas OK quando lead time o permite', () => {
    const r = evaluateSafety({
      available: 100,
      reserved: 0,
      safetyStock: 5,
      velocity28dPerDay: 2,
      leadTimeDays: 30,
    });
    expect(r.status).toBe('OK');
    expect(r.runwayDays).toBe(50);
  });
});
