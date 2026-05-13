/**
 * Resolução de preço simulada (§10.15) — replica a lógica do backend
 * `backend/src/domain/pricing/resolve-price.ts` usando dados em memória.
 *
 * Hierarquia:
 *   1. override → valida floor.
 *   2. customerSpecial activo → valida floor.
 *   3. tierLine (ACTIVE, qty >= minQty) com maior break aplicável.
 *   4. Sem match → lança PRICE_NOT_FOUND.
 *
 * Função síncrona — todos os dados estão em memória.
 */

import {
  mockVariants,
  mockCustomerSpecials,
  mockPriceLists,
  mockPriceListLines,
} from './mock-data/pricing';

export type PriceResolutionSource = 'CUSTOMER_SPECIAL' | 'TIER_LIST' | 'OVERRIDE';

export interface ResolvePriceInput {
  variantId: string;
  qty: number;
  customerId?: string;
  overrideUnitEur?: number;
}

export interface ResolvedPrice {
  unitPriceEur: number;
  appliedDiscountPct: number;
  lineTotalEur: number;
  source: PriceResolutionSource;
}

export class PriceError extends Error {
  constructor(
    public readonly code: 'PRICE_NOT_FOUND' | 'PRICE_BELOW_FLOOR' | 'PRICE_QTY_INVALID',
    message: string,
  ) {
    super(message);
    this.name = 'PriceError';
  }
}

const FLOOR_MULTIPLIER = 1.1;

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function floorFor(costEur: number): number {
  return round2(costEur * FLOOR_MULTIPLIER);
}

function enforceFloor(netUnitEur: number, costEur: number): void {
  const floor = floorFor(costEur);
  if (netUnitEur < floor) {
    throw new PriceError(
      'PRICE_BELOW_FLOOR',
      `Preço unitário (${netUnitEur.toFixed(2)} €) abaixo do floor (${floor.toFixed(2)} €).`,
    );
  }
}

function pickBreak(breaks: { minQty: number; discountPct: number }[], qty: number): number {
  const sorted = [...breaks].sort((a, b) => b.minQty - a.minQty);
  for (const b of sorted) {
    if (qty >= b.minQty) return b.discountPct;
  }
  return 0;
}

export function resolvePrice(input: ResolvePriceInput): ResolvedPrice {
  const { variantId, qty, customerId, overrideUnitEur } = input;

  if (!Number.isInteger(qty) || qty <= 0) {
    throw new PriceError('PRICE_QTY_INVALID', 'Quantidade tem de ser um inteiro positivo.');
  }

  const variant = mockVariants.find((v) => v.id === variantId);
  if (!variant) {
    throw new PriceError('PRICE_NOT_FOUND', `Variante "${variantId}" não encontrada.`);
  }

  const costEur = variant.costEur;
  const now = new Date();

  // 1. Override
  if (overrideUnitEur != null) {
    enforceFloor(overrideUnitEur, costEur);
    const unit = round2(overrideUnitEur);
    return {
      unitPriceEur: unit,
      appliedDiscountPct: 0,
      lineTotalEur: round2(unit * qty),
      source: 'OVERRIDE',
    };
  }

  // 2. CustomerSpecial activo
  if (customerId) {
    const special = mockCustomerSpecials.find(
      (s) => s.customerId === customerId && s.variantId === variantId,
    );
    if (special) {
      const until = special.validUntil ? new Date(special.validUntil) : null;
      const isActive = until == null || until > now;
      if (isActive) {
        enforceFloor(special.unitPriceEur, costEur);
        const unit = round2(special.unitPriceEur);
        return {
          unitPriceEur: unit,
          appliedDiscountPct: 0,
          lineTotalEur: round2(unit * qty),
          source: 'CUSTOMER_SPECIAL',
        };
      }
    }
  }

  // 3. TierLine — procura listas ACTIVE com linha para o variant e qty >= minQty
  const activeLists = mockPriceLists.filter((pl) => pl.status === 'ACTIVE');

  let bestLine: (typeof mockPriceListLines)[number] | null = null;
  let bestMinQty = -1;

  for (const pl of activeLists) {
    const now2 = new Date();
    const validFrom = new Date(pl.validFrom);
    const validUntil = pl.validUntil ? new Date(pl.validUntil) : null;
    const inPeriod = now2 >= validFrom && (validUntil == null || now2 <= validUntil);
    if (!inPeriod) continue;

    const line = mockPriceListLines.find(
      (l) => l.priceListId === pl.id && l.variantId === variantId && qty >= l.minQty,
    );
    if (line && line.minQty > bestMinQty) {
      bestLine = line;
      bestMinQty = line.minQty;
    }
  }

  if (bestLine) {
    const discountPct = pickBreak(bestLine.discountBreaks, qty);
    const unit = round2(bestLine.unitPriceEur * (1 - discountPct));
    enforceFloor(unit, costEur);
    return {
      unitPriceEur: unit,
      appliedDiscountPct: discountPct,
      lineTotalEur: round2(unit * qty),
      source: 'TIER_LIST',
    };
  }

  throw new PriceError(
    'PRICE_NOT_FOUND',
    'Sem preço aplicável: sem special activo, sem lista de preços activa com linha para esta variante e quantidade.',
  );
}
