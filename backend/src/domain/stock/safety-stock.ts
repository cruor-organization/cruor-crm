/**
 * Avaliação de cobertura de stock (§10.13).
 *
 * Pura: recebe estado actual de uma `StockLevel` + opcional de velocidade e
 * lead time. Sem Prisma, sem framework — testável em isolamento.
 *
 * Status:
 *   STOCKOUT          available <= 0
 *   STOCKOUT_IMMINENT runwayDays conhecido e < leadTimeDays
 *   BELOW_SAFETY      available < safetyStock
 *   OK                acima de tudo
 */

export interface SafetyInput {
  available: number;
  reserved: number;
  safetyStock: number;
  /** Vendas diárias médias (rolling 28d). null/0 = sem sinal. */
  velocity28dPerDay?: number | null;
  /** Lead time do supplier; usado para flag de stockout iminente. */
  leadTimeDays?: number | null;
}

export type SafetyStatus = 'OK' | 'BELOW_SAFETY' | 'STOCKOUT_IMMINENT' | 'STOCKOUT';

export interface SafetyResult {
  status: SafetyStatus;
  runwayDays: number | null;
}

export function evaluateSafety(input: SafetyInput): SafetyResult {
  const v = input.velocity28dPerDay ?? null;
  const runwayDays = v != null && v > 0 ? Math.floor(input.available / v) : null;

  if (input.available <= 0) {
    return { status: 'STOCKOUT', runwayDays };
  }
  if (runwayDays != null && input.leadTimeDays != null && runwayDays < input.leadTimeDays) {
    return { status: 'STOCKOUT_IMMINENT', runwayDays };
  }
  if (input.available < input.safetyStock) {
    return { status: 'BELOW_SAFETY', runwayDays };
  }
  return { status: 'OK', runwayDays };
}
