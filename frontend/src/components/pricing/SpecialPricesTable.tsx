/**
 * Tabela de preços especiais por cliente.
 */
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { MockCustomerSpecialPrice } from '@/lib/mock-data/pricing';

interface SpecialPricesTableProps {
  specials: MockCustomerSpecialPrice[];
  onEdit?: (s: MockCustomerSpecialPrice) => void;
  onRemove?: (id: string) => void;
}

function isActive(validUntil: string | null): boolean {
  if (validUntil == null) return true;
  return new Date(validUntil) > new Date();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function fmtPrice(v: number) {
  return v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SpecialPricesTable({ specials, onEdit, onRemove }: SpecialPricesTableProps) {
  if (specials.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        Sem preços especiais. Cria o primeiro clicando em "Novo special".
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-neutral-200 bg-surface shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Florista</th>
            <th className="px-4 py-3">Variante</th>
            <th className="px-4 py-3 text-right">Preço especial (€)</th>
            <th className="px-4 py-3">Válido até</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acções</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {specials.map((s) => {
            const active = isActive(s.validUntil);
            return (
              <tr key={s.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-900">{s.customerName}</td>
                <td className="px-4 py-3 text-neutral-600">{s.variantName}</td>
                <td className="px-4 py-3 text-right font-mono text-sm">
                  {fmtPrice(s.unitPriceEur)} €
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {s.validUntil ? formatDate(s.validUntil) : 'Sem limite'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={active ? 'success' : 'neutral'}>
                    {active ? 'Activo' : 'Expirado'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        console.info('[SpecialPrice] editar', s);
                        onEdit?.(s);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (!confirm(`Remover preço especial de "${s.customerName}"?`)) return;
                        console.info('[SpecialPrice] remover', s.id);
                        onRemove?.(s.id);
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
