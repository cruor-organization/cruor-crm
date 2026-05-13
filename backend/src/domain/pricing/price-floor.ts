/**
 * Floor de preço — invariante hard §10.4 few-shot 2.
 *
 * Cada preço de venda deve ser >= custo logístico (landed) × 1.10.
 * Domain puro — lança `ValidationError("PRICE_BELOW_FLOOR")` se violar.
 */
import { ValidationError } from '../../shared/errors.js';

export const PRICE_FLOOR_MULTIPLIER = 1.1;

export interface LandedCostInput {
  unitCostEur: number;
  shippingEur?: number;
  /** Customs / impostos como fracção (0.06 = 6%). */
  customsPct?: number;
}

export function landedCost(input: LandedCostInput): number {
  const base = input.unitCostEur + (input.shippingEur ?? 0);
  const customs = input.customsPct ? base * input.customsPct : 0;
  return round2(base + customs);
}

export function floorFor(landedEur: number): number {
  return round2(landedEur * PRICE_FLOOR_MULTIPLIER);
}

export function enforceFloor(netUnitEur: number, landedEur: number): void {
  const floor = floorFor(landedEur);
  if (netUnitEur < floor) {
    throw new ValidationError(
      'PRICE_BELOW_FLOOR',
      'Preço unitário abaixo do floor (custo × 1.10).',
      { netUnitEur, floor, landedEur },
    );
  }
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
