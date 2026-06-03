// backend/src/domain/invoices/trigger.test.ts
import { describe, expect, it } from 'vitest';

import { invoiceTriggerFor } from './trigger.js';

describe('invoiceTriggerFor (§10.14)', () => {
  it('pronto-pagamento (0 dias) → CONFIRMED', () => {
    expect(invoiceTriggerFor(0)).toBe('CONFIRMED');
  });

  it('conta corrente (>0 dias) → SHIPPED', () => {
    expect(invoiceTriggerFor(30)).toBe('SHIPPED');
    expect(invoiceTriggerFor(1)).toBe('SHIPPED');
  });
});
