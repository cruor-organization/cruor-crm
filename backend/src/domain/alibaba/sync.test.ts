// backend/src/domain/alibaba/sync.test.ts
import { describe, expect, it } from 'vitest';

import { decideStatusChange, type AlibabaStatus } from './sync.js';

describe('decideStatusChange — gate * → DELIVERED (§10.12)', () => {
  it('encomenda nova já DELIVERED aplica stock (1ª vez)', () => {
    expect(decideStatusChange(null, 'DELIVERED', false)).toEqual({
      isNew: true,
      changed: true,
      shouldApplyStock: true,
    });
  });

  it('transição normal SHIPPED → DELIVERED aplica stock', () => {
    expect(decideStatusChange('SHIPPED', 'DELIVERED', false)).toEqual({
      isNew: false,
      changed: true,
      shouldApplyStock: true,
    });
  });

  it('re-sync DELIVERED → DELIVERED com stock já aplicado NÃO reaplica (idempotente)', () => {
    expect(decideStatusChange('DELIVERED', 'DELIVERED', true)).toEqual({
      isNew: false,
      changed: false,
      shouldApplyStock: false,
    });
  });

  it('DELIVERED local mas stock por aplicar (falha anterior) — reaplica (self-healing)', () => {
    // Mais robusto que o few-shot do spec: a guarda real é stockAppliedAt, não o status local.
    expect(decideStatusChange('DELIVERED', 'DELIVERED', false)).toMatchObject({
      shouldApplyStock: true,
    });
  });

  it('CANCELLED nunca aplica stock', () => {
    expect(decideStatusChange('PLACED', 'CANCELLED', false).shouldApplyStock).toBe(false);
    expect(decideStatusChange(null, 'CANCELLED', false).shouldApplyStock).toBe(false);
  });

  it('estados intermédios não aplicam stock', () => {
    const intermediate: AlibabaStatus[] = ['PLACED', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT'];
    for (const s of intermediate) {
      expect(decideStatusChange('PLACED', s, false).shouldApplyStock).toBe(false);
    }
  });

  it('sem mudança de estado e stock já aplicado → noop', () => {
    expect(decideStatusChange('SHIPPED', 'SHIPPED', false)).toEqual({
      isNew: false,
      changed: false,
      shouldApplyStock: false,
    });
  });
});
