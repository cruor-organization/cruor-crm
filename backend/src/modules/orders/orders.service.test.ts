// backend/src/modules/orders/orders.service.test.ts
import { describe, expect, it } from 'vitest';

import { ConflictError } from '../../shared/errors.js';
import type { AuthContext } from '../../middlewares/auth-context.js';

import { assertDraft, assertNoDuplicateVariants, scopeForRole } from './orders.service.js';
import type { ResolvedLine } from './orders.service.js';

function ctx(role: AuthContext['role'], actorId = 'rep-1'): AuthContext {
  return { actorId, email: 'x@y.z', orgId: 'org-1', role };
}

function line(variantId: string): ResolvedLine {
  return {
    variantId,
    qty: 1,
    unitPriceEur: 10,
    discountPct: 0,
    vatPct: 23,
    lineTotalEur: 10,
    priceSource: 'TIER_LIST',
  };
}

describe('scopeForRole (ABAC)', () => {
  it('SALES_REP fica restrito a si próprio', () => {
    expect(scopeForRole(ctx('SALES_REP', 'rep-9'))).toEqual({ salesRepId: 'rep-9' });
  });

  it('SALES_MANAGER/ADMIN/OWNER veem tudo', () => {
    expect(scopeForRole(ctx('SALES_MANAGER'))).toEqual({});
    expect(scopeForRole(ctx('ADMIN'))).toEqual({});
    expect(scopeForRole(ctx('OWNER'))).toEqual({});
  });
});

describe('assertDraft (gating)', () => {
  it('permite DRAFT', () => {
    expect(() => assertDraft({ status: 'DRAFT' })).not.toThrow();
  });

  it('rejeita qualquer outro estado', () => {
    expect(() => assertDraft({ status: 'CONFIRMED' })).toThrowError(ConflictError);
    expect(() => assertDraft({ status: 'CANCELLED' })).toThrowError(ConflictError);
  });
});

describe('assertNoDuplicateVariants', () => {
  it('aceita variants distintos', () => {
    expect(() => assertNoDuplicateVariants([line('v1'), line('v2')])).not.toThrow();
  });

  it('rejeita variant repetido', () => {
    expect(() => assertNoDuplicateVariants([line('v1'), line('v1')])).toThrowError(ConflictError);
  });
});
