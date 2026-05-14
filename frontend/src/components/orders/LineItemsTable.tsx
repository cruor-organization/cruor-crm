/**
 * LineItemsTable — tabela de linhas de encomenda com totais.
 */
import { Badge } from '@/components/ui/Badge';
import { formatEur } from '@/lib/format';
import type { OrderLine, PricingSource } from '@/lib/mock-data/orders';

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface LineItemsTableProps {
  lines: OrderLine[];
  subtotalEur: number;
  vatEur: number;
  vatPct: number;
  totalEur: number;
}

const SOURCE_VARIANT: Record<PricingSource, BadgeVariant> = {
  TIER_LIST: 'neutral',
  CUSTOMER_SPECIAL: 'info',
  OVERRIDE: 'warning',
};

const SOURCE_LABEL: Record<PricingSource, string> = {
  TIER_LIST: 'Lista',
  CUSTOMER_SPECIAL: 'Especial',
  OVERRIDE: 'Manual',
};

export function LineItemsTable({
  lines,
  subtotalEur,
  vatEur,
  vatPct,
  totalEur,
}: LineItemsTableProps) {
  return (
    <div className="overflow-x-auto rounded-card border border-neutral-200 shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Produto
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Qty
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Unit (€)
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Desc.%
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Origem
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {lines.map((line, i) => (
            <tr key={i} className="bg-surface hover:bg-neutral-50">
              <td className="px-4 py-3 font-mono text-xs text-neutral-500">{line.variantSku}</td>
              <td className="px-4 py-3 font-medium text-neutral-900">{line.variantName}</td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-700">
                {line.qty}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-700">
                {formatEur(line.unitPriceEur)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-700">
                {line.discountPct > 0 ? (
                  <span className="text-amber-700">{line.discountPct}%</span>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge variant={SOURCE_VARIANT[line.pricingSource]}>
                  {SOURCE_LABEL[line.pricingSource]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums font-medium text-neutral-900">
                {formatEur(line.lineTotalEur)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-neutral-200 bg-neutral-50">
          <tr>
            <td colSpan={6} className="px-4 py-2 text-right text-sm text-neutral-600">
              Subtotal
            </td>
            <td className="px-4 py-2 text-right font-mono tabular-nums font-medium text-neutral-900">
              {formatEur(subtotalEur)}
            </td>
          </tr>
          <tr>
            <td colSpan={6} className="px-4 py-2 text-right text-sm text-neutral-600">
              IVA {vatPct > 0 ? `(${vatPct}%)` : '(isento)'}
            </td>
            <td className="px-4 py-2 text-right font-mono tabular-nums font-medium text-neutral-900">
              {vatPct > 0 ? formatEur(vatEur) : <span className="text-neutral-400">—</span>}
            </td>
          </tr>
          <tr className="border-t border-neutral-200">
            <td
              colSpan={6}
              className="px-4 py-2.5 text-right text-sm font-semibold text-neutral-900"
            >
              Total
            </td>
            <td className="px-4 py-2.5 text-right font-mono tabular-nums text-base font-bold text-neutral-900">
              {formatEur(totalEur)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
