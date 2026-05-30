import { describe, expect, it } from 'vitest';

import { recomputeTotals } from './recompute-totals.js';

describe('recomputeTotals', () => {
  it('soma vazia → tudo zero', () => {
    expect(recomputeTotals([])).toEqual({ subtotalEur: 0, vatEur: 0, totalEur: 0 });
  });

  it('uma linha com IVA 23%', () => {
    const r = recomputeTotals([{ lineTotalEur: 100, vatPct: 23 }]);
    expect(r).toEqual({ subtotalEur: 100, vatEur: 23, totalEur: 123 });
  });

  it('várias linhas somam e arredondam a 2 casas', () => {
    const r = recomputeTotals([
      { lineTotalEur: 33.33, vatPct: 23 },
      { lineTotalEur: 10.1, vatPct: 23 },
    ]);
    // IVA por linha: 7.6659→7.67 e 2.323→2.32
    expect(r).toEqual({ subtotalEur: 43.43, vatEur: 9.99, totalEur: 53.42 });
  });

  it('IVA 0 → total = subtotal', () => {
    const r = recomputeTotals([{ lineTotalEur: 50, vatPct: 0 }]);
    expect(r).toEqual({ subtotalEur: 50, vatEur: 0, totalEur: 50 });
  });
});
