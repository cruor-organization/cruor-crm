/**
 * Tabela de listas de preços — listagem com navegação para /pricing/$id.
 */
import { useNavigate } from '@tanstack/react-router';

import { Badge } from '@/components/ui/Badge';
import type { MockPriceList, PriceListStatus, PricingTier } from '@/lib/mock-data/pricing';

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface PriceListsTableProps {
  lists: MockPriceList[];
}

const STATUS_VARIANT: Record<PriceListStatus, BadgeVariant> = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  ARCHIVED: 'neutral',
};

const STATUS_LABEL: Record<PriceListStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Activa',
  ARCHIVED: 'Arquivada',
};

const TIER_LABEL: Record<PricingTier, string> = {
  STANDARD: 'Standard',
  PROFESSIONAL: 'Profissional',
  KEY_ACCOUNT: 'Key Account',
  DISTRIBUTOR: 'Distribuidor',
};

const TIER_VARIANT: Record<PricingTier, BadgeVariant> = {
  STANDARD: 'neutral',
  PROFESSIONAL: 'info',
  KEY_ACCOUNT: 'success',
  DISTRIBUTOR: 'warning',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function PriceListsTable({ lists }: PriceListsTableProps) {
  const navigate = useNavigate();

  if (lists.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        Sem listas de preços. Cria a primeira clicando em "Nova lista".
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-neutral-200 bg-surface shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Escalão</th>
            <th className="px-4 py-3">Moeda</th>
            <th className="px-4 py-3">Vigência</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Linhas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {lists.map((pl) => (
            <tr
              key={pl.id}
              className="cursor-pointer hover:bg-neutral-50"
              onClick={() => navigate({ to: '/pricing/$id', params: { id: pl.id } })}
            >
              <td className="px-4 py-3 font-medium text-neutral-900">{pl.name}</td>
              <td className="px-4 py-3">
                <Badge variant={TIER_VARIANT[pl.tier]}>{TIER_LABEL[pl.tier]}</Badge>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-neutral-600">{pl.currency}</td>
              <td className="px-4 py-3 text-neutral-600">
                {formatDate(pl.validFrom)} —{' '}
                {pl.validUntil ? formatDate(pl.validUntil) : 'em aberto'}
              </td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[pl.status]}>{STATUS_LABEL[pl.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs text-neutral-600">
                {pl.lineCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
