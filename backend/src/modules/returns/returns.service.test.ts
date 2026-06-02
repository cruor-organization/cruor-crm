// backend/src/modules/returns/returns.service.test.ts
import { describe, expect, it } from 'vitest';

import type { AuthContext } from '../../middlewares/auth-context.js';
import { ConflictError, ValidationError } from '../../shared/errors.js';

import {
  assertOrderReturnable,
  assertReturnLinesAgainstOrder,
  assertReturnStatus,
  scopeSalesRep,
} from './returns.service.js';

function ctx(role: AuthContext['role'], actorId = 'rep-1'): AuthContext {
  return { actorId, email: 'x@y.z', orgId: 'org-1', role };
}

describe('scopeSalesRep (ABAC)', () => {
  it('SALES_REP fica restrito a si próprio', () => {
    expect(scopeSalesRep(ctx('SALES_REP', 'rep-9'))).toEqual({ salesRepId: 'rep-9' });
  });

  it('SALES_MANAGER/ADMIN/OWNER veem tudo', () => {
    expect(scopeSalesRep(ctx('SALES_MANAGER'))).toEqual({});
    expect(scopeSalesRep(ctx('ADMIN'))).toEqual({});
    expect(scopeSalesRep(ctx('OWNER'))).toEqual({});
  });

  it('WAREHOUSE vê tudo (processa devoluções)', () => {
    expect(scopeSalesRep(ctx('WAREHOUSE'))).toEqual({});
  });
});

describe('assertOrderReturnable', () => {
  it('permite SHIPPED e DELIVERED', () => {
    expect(() => assertOrderReturnable({ status: 'SHIPPED' })).not.toThrow();
    expect(() => assertOrderReturnable({ status: 'DELIVERED' })).not.toThrow();
  });

  it('rejeita estados não-expedidos', () => {
    expect(() => assertOrderReturnable({ status: 'DRAFT' })).toThrowError(ConflictError);
    expect(() => assertOrderReturnable({ status: 'CONFIRMED' })).toThrowError(ConflictError);
    expect(() => assertOrderReturnable({ status: 'CANCELLED' })).toThrowError(ConflictError);
  });
});

describe('assertReturnStatus', () => {
  it('aceita o estado esperado', () => {
    expect(() => assertReturnStatus({ status: 'REQUESTED' }, 'REQUESTED')).not.toThrow();
  });

  it('rejeita estado diferente', () => {
    expect(() => assertReturnStatus({ status: 'REQUESTED' }, 'RECEIVED')).toThrowError(
      ConflictError,
    );
  });
});

describe('assertReturnLinesAgainstOrder', () => {
  const orderLines = [
    { variantId: 'v1', qty: 10 },
    { variantId: 'v2', qty: 5 },
  ];

  it('aceita qty ≤ encomendada', () => {
    expect(() =>
      assertReturnLinesAgainstOrder([{ variantId: 'v1', qty: 3 }], orderLines),
    ).not.toThrow();
  });

  it('rejeita variant repetido', () => {
    expect(() =>
      assertReturnLinesAgainstOrder(
        [
          { variantId: 'v1', qty: 1 },
          { variantId: 'v1', qty: 1 },
        ],
        orderLines,
      ),
    ).toThrowError(ConflictError);
  });

  it('rejeita variant fora da encomenda', () => {
    expect(() =>
      assertReturnLinesAgainstOrder([{ variantId: 'vX', qty: 1 }], orderLines),
    ).toThrowError(ValidationError);
  });

  it('rejeita qty acima da encomendada', () => {
    expect(() =>
      assertReturnLinesAgainstOrder([{ variantId: 'v2', qty: 6 }], orderLines),
    ).toThrowError(ValidationError);
  });
});
