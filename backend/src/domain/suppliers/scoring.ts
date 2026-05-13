/**
 * Score de fornecedor (§10.2 few-shot 2).
 * Pontualidade (40) + Qualidade (40) + Comunicação (20). Range [0, 100].
 */

export interface SupplierStats {
  /** Taxa de entregas no tempo prometido. [0, 1]. */
  onTimeRate: number;
  /** Taxa de defeitos (devoluções por culpa do fornecedor). [0, 1]. */
  defectRate: number;
  /** Média de horas até responder. Quanto maior, pior. */
  avgResponseHours: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export function scoreSupplier(stats: SupplierStats): number {
  const punctuality = clamp(stats.onTimeRate, 0, 1) * 40;
  const quality = (1 - clamp(stats.defectRate, 0, 1)) * 40;
  const comms = clamp(20 * (1 - stats.avgResponseHours / 48), 0, 20);
  return Math.round(punctuality + quality + comms);
}
