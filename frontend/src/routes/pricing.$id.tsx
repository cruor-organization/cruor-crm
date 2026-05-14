/**
 * Rota /pricing/$id — detalhe de uma lista de preços.
 * Tabs: Linhas / Auditoria.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle, Archive } from 'lucide-react';
import { useState } from 'react';

import { PriceListLinesEditor } from '@/components/pricing/PriceListLinesEditor';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { mockFetch } from '@/lib/mock-api';
import { mockPriceLists, mockPriceListLines, type PriceListStatus } from '@/lib/mock-data/pricing';

export const Route = createFileRoute('/pricing/$id')({
  component: PriceListDetailPage,
});

const STATUS_LABEL: Record<PriceListStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Activa',
  ARCHIVED: 'Arquivada',
};

const STATUS_VARIANT: Record<PriceListStatus, 'warning' | 'success' | 'neutral'> = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  ARCHIVED: 'neutral',
};

const TABS = [
  { id: 'linhas', label: 'Linhas' },
  { id: 'auditoria', label: 'Auditoria' },
];

// Mock de entradas de auditoria
const MOCK_AUDIT = [
  {
    id: 'aud-1',
    action: 'Lista criada',
    actor: 'Ana Ferreira',
    timestamp: '01/01/2026 09:00',
    detail: 'Status inicial: RASCUNHO',
  },
  {
    id: 'aud-2',
    action: 'Activada',
    actor: 'Rui Costa',
    timestamp: '05/01/2026 14:22',
    detail: 'Status: RASCUNHO → ACTIVA',
  },
  {
    id: 'aud-3',
    action: 'Linhas editadas',
    actor: 'Ana Ferreira',
    timestamp: '10/05/2026 11:45',
    detail: '3 linhas actualizadas (Limonium, Eucalyptus, Gypsophila)',
  },
];

function PriceListDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('linhas');

  const { data: priceList, isLoading } = useQuery({
    queryKey: ['priceLists', id],
    queryFn: () => {
      const found = mockPriceLists.find((pl) => pl.id === id) ?? null;
      return mockFetch(found);
    },
  });

  const { data: lines, isLoading: loadingLines } = useQuery({
    queryKey: ['priceListLines', id],
    queryFn: () => {
      const filtered = mockPriceListLines.filter((l) => l.priceListId === id);
      return mockFetch(filtered);
    },
  });

  function handleActivate() {
    if (!priceList) return;
    console.info('[PriceList] activar lista', id);
    void qc.invalidateQueries({ queryKey: ['priceLists'] });
    alert('Lista activada (simulação).');
  }

  function handleArchive() {
    if (!priceList) return;
    if (!confirm('Arquivar esta lista? Deixará de ser usada em novos preços.')) return;
    console.info('[PriceList] arquivar lista', id);
    void qc.invalidateQueries({ queryKey: ['priceLists'] });
    alert('Lista arquivada (simulação).');
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!priceList) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-500">Lista de preços não encontrada.</p>
        <Link to="/pricing" className="mt-4 inline-block text-sm text-cruor-600 hover:underline">
          ← Voltar a Preços
        </Link>
      </div>
    );
  }

  const status = priceList.status;

  const headerAction = (
    <div className="flex items-center gap-2">
      {status === 'DRAFT' && (
        <Button
          variant="primary"
          size="sm"
          icon={<CheckCircle className="h-4 w-4" />}
          onClick={handleActivate}
        >
          Activar
        </Button>
      )}
      {status === 'ACTIVE' && (
        <Button
          variant="secondary"
          size="sm"
          icon={<Archive className="h-4 w-4" />}
          onClick={handleArchive}
        >
          Arquivar
        </Button>
      )}
    </div>
  );

  return (
    <section className="space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/pricing"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Preços
      </Link>

      <PageHeader
        title={priceList.name}
        subtitle={`Escalão ${priceList.tier} · ${priceList.currency}`}
        action={
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
            {headerAction}
          </div>
        }
      />

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'linhas' && (
        <div>
          {loadingLines ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <PriceListLinesEditor priceListId={id} lines={lines ?? []} />
          )}
        </div>
      )}

      {activeTab === 'auditoria' && (
        <Card padding="none">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-medium text-neutral-700">Histórico de alterações</h3>
          </div>
          <ol className="divide-y divide-neutral-100">
            {MOCK_AUDIT.map((entry, idx) => (
              <li key={entry.id} className="flex items-start gap-4 px-4 py-4">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">{entry.action}</p>
                  <p className="text-xs text-neutral-500">{entry.detail}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-neutral-500">{entry.timestamp}</p>
                  <p className="text-xs text-neutral-400">{entry.actor}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </section>
  );
}
