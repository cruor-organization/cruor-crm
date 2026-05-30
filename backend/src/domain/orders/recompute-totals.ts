/**
 * Recálculo de totais de uma encomenda a partir das linhas.
 * Puro: não toca em Prisma. `lineTotalEur` é o snapshot ex-IVA (já com desconto).
 * IVA calculado por linha e arredondado a 2 casas, depois somado (§9: totais no servidor).
 */
export interface OrderLineForTotals {
  lineTotalEur: number;
  vatPct: number;
}

export interface OrderTotals {
  subtotalEur: number;
  vatEur: number;
  totalEur: number;
}

export function recomputeTotals(lines: OrderLineForTotals[]): OrderTotals {
  let subtotal = 0;
  let vat = 0;
  for (const line of lines) {
    const net = round2(line.lineTotalEur);
    subtotal += net;
    vat += round2(net * (line.vatPct / 100));
  }
  const subtotalEur = round2(subtotal);
  const vatEur = round2(vat);
  return { subtotalEur, vatEur, totalEur: round2(subtotalEur + vatEur) };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
