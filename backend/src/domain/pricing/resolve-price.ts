/**
 * Resolução de preço (§10.15).
 *
 * Pura: recebe inputs já fetched pelo repository; decide hierarquia,
 * aplica quebras de desconto, valida floor.
 *
 * Hierarquia:
 *   1. `override` (ex.: quote ajustada à mão) — bypassa lookup, valida floor.
 *   2. `customerSpecial` activo (validUntil null ou > now) — source: CUSTOMER_SPECIAL.
 *   3. `tierLine` com `qty >= line.minQty`; aplica break maior — source: TIER_LIST.
 *   4. Nenhum match → NotFoundError("PRICE_NOT_FOUND").
 *
 * Não toca em Prisma; o repository é responsável por escolher a melhor
 * `tierLine` (maior `minQty` <= qty) antes de chamar.
 */
import { NotFoundError, ValidationError } from '../../shared/errors.js';

import { enforceFloor } from './price-floor.js';

export type PriceResolutionSource = 'CUSTOMER_SPECIAL' | 'TIER_LIST' | 'OVERRIDE';

export interface DiscountBreak {
  minQty: number;
  discountPct: number;
}

export interface CustomerSpecialInput {
  unitPriceEur: number;
  validUntil: Date | null;
}

export interface TierLineInput {
  unitPriceEur: number;
  minQty: number;
  discountBreaks: DiscountBreak[];
}

export interface ResolveInput {
  qty: number;
  customerSpecial: CustomerSpecialInput | null;
  tierLine: TierLineInput | null;
  landedEur: number;
  now: Date;
  override?: number | null;
}

export interface ResolvedPrice {
  unitPriceEur: number;
  appliedDiscountPct: number;
  lineTotalEur: number;
  source: PriceResolutionSource;
}

export function resolvePrice(input: ResolveInput): ResolvedPrice {
  if (input.qty <= 0 || !Number.isFinite(input.qty)) {
    throw new ValidationError('PRICE_QTY_INVALID', 'Quantidade tem de ser positiva.', {
      qty: input.qty,
    });
  }

  if (input.override != null) {
    enforceFloor(input.override, input.landedEur);
    const unit = round2(input.override);
    return {
      unitPriceEur: unit,
      appliedDiscountPct: 0,
      lineTotalEur: round2(unit * input.qty),
      source: 'OVERRIDE',
    };
  }

  const cs = input.customerSpecial;
  if (cs && (cs.validUntil == null || cs.validUntil > input.now)) {
    enforceFloor(cs.unitPriceEur, input.landedEur);
    const unit = round2(cs.unitPriceEur);
    return {
      unitPriceEur: unit,
      appliedDiscountPct: 0,
      lineTotalEur: round2(unit * input.qty),
      source: 'CUSTOMER_SPECIAL',
    };
  }

  const t = input.tierLine;
  if (t && input.qty >= t.minQty) {
    const discountPct = pickBreak(t.discountBreaks, input.qty);
    const unit = round2(t.unitPriceEur * (1 - discountPct));
    enforceFloor(unit, input.landedEur);
    return {
      unitPriceEur: unit,
      appliedDiscountPct: discountPct,
      lineTotalEur: round2(unit * input.qty),
      source: 'TIER_LIST',
    };
  }

  throw new NotFoundError(
    'PRICE_NOT_FOUND',
    'Sem preço aplicável (sem special, sem tier line, ou qty abaixo do minQty).',
    { qty: input.qty },
  );
}

function pickBreak(breaks: DiscountBreak[], qty: number): number {
  const sorted = [...breaks].sort((a, b) => b.minQty - a.minQty);
  for (const b of sorted) {
    if (qty >= b.minQty) return b.discountPct;
  }
  return 0;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
