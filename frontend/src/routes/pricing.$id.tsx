/**
 * Rota /pricing/$id — detalhe de uma lista de preços.
 * Tabs: Linhas / Auditoria.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { Archive, ArrowLeft, CheckCircle } from 'lucide-react';
import { useState } from 'react';

import {
  PriceListLinesEditor,
  type PriceListLineApi,
} from '@/components/pricing/PriceListLinesEditor';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { api, type ApiError } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { PriceListStatus, PricingTier } from '@/lib/schemas/pricing';

export const Route = createFileRoute('/pricing/$id')({
  component: PriceListDetailPage,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: '/sign-in' });
  },
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

const TIER_LABEL: Record<PricingTier, string> = {
  STANDARD: 'Standard',
  PROFESSIONAL: 'Profissional',
  KEY_ACCOUNT: 'Key Account',
  DISTRIBUTOR: 'Distribuidor',
};

const TABS = [
  { id: 'linhas', label: 'Linhas' },
  { id: 'auditoria', label: 'Auditoria' },
];

interface PriceListDetail {
  id: string;
  name: string;
  tier: PricingTier;
  currency: 'EUR';
  validFrom: string;
  validUntil: string | null;
  status: PriceListStatus;
  _count: { lines: number };
}

interface AuditLogEntry {
  id: string;
  action: string;
  changes: unknown;
  createdAt: string;
  actor: { id: string; name: string | null; email: string } | null;
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ACTION_LABEL(a: string): string {
  switch (a) {
    case 'CREATE':
      return 'Criada';
    case 'UPDATE':
      return 'Editada';
    case 'DELETE':
      return 'Apagada';
    case 'STATUS_CHANGE':
      return 'Estado alterado';
    case 'RESTORE':
      return 'Restaurada';
    default:
      return a;
  }
}

function summarizeChanges(changes: unknown): string {
  if (changes == null) return '';
  if (typeof changes === 'object') {
    const obj = changes as Record<string, unknown>;
    if ('from' in obj && 'to' in obj) return `${String(obj.from)} → ${String(obj.to)}`;
    return Object.keys(obj)
      .filter((k) => k !== 'reason')
      .slice(0, 4)
      .join(', ');
  }
  return String(changes);
}

function PriceListDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('linhas');
  const [opError, setOpError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ['priceLists', id],
    queryFn: () => api.get<PriceListDetail>(`/api/pricing/lists/${id}`),
  });

  const linesQuery = useQuery({
    queryKey: ['priceListLines', id],
    queryFn: () => api.get<{ items: PriceListLineApi[] }>(`/api/pricing/lists/${id}/lines`),
    enabled: activeTab === 'linhas',
  });

  const auditQuery = useQuery({
    queryKey: ['audit', 'price_list', id],
    queryFn: () =>
      api.get<{ items: AuditLogEntry[]; total: number }>(
        `/api/audit?entityType=price_list&entityId=${id}`,
      ),
    enabled: activeTab === 'auditoria',
  });

  const invalidateAll = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['priceLists'] }),
      qc.invalidateQueries({ queryKey: ['priceLists', id] }),
      qc.invalidateQueries({ queryKey: ['audit', 'price_list', id] }),
    ]);
  };

  const activate = useMutation({
    mutationFn: () => api.post(`/api/pricing/lists/${id}/activate`, {}),
    onMutate: () => setOpError(null),
    onSuccess: invalidateAll,
    onError: (err: unknown) => setOpError((err as ApiError).message ?? 'Erro a activar.'),
  });

  const archive = useMutation({
    mutationFn: () => api.post(`/api/pricing/lists/${id}/archive`, {}),
    onMutate: () => setOpError(null),
    onSuccess: invalidateAll,
    onError: (err: unknown) => setOpError((err as ApiError).message ?? 'Erro a arquivar.'),
  });

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-500">Lista de preços não encontrada.</p>
        <Link to="/pricing" className="mt-4 inline-block text-sm text-cruor-600 hover:underline">
          ← Voltar a Preços
        </Link>
      </div>
    );
  }

  const priceList = detailQuery.data;
  const status = priceList.status;

  const headerAction = (
    <div className="flex items-center gap-2">
      {status === 'DRAFT' && (
        <Button
          variant="primary"
          size="sm"
          icon={<CheckCircle className="h-4 w-4" />}
          loading={activate.isPending}
          onClick={() => activate.mutate()}
        >
          Activar
        </Button>
      )}
      {status === 'ACTIVE' && (
        <Button
          variant="secondary"
          size="sm"
          icon={<Archive className="h-4 w-4" />}
          loading={archive.isPending}
          onClick={() => {
            if (!confirm('Arquivar esta lista? Deixará de ser usada em novos preços.')) return;
            archive.mutate();
          }}
        >
          Arquivar
        </Button>
      )}
    </div>
  );

  return (
    <section className="space-y-6">
      <Link
        to="/pricing"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Preços
      </Link>

      <PageHeader
        title={priceList.name}
        subtitle={`Escalão ${TIER_LABEL[priceList.tier]} · ${priceList.currency}`}
        action={
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
            {headerAction}
          </div>
        }
      />

      {opError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{opError}</div>
      )}

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'linhas' && (
        <div>
          {linesQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : linesQuery.error ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {(linesQuery.error as ApiError).message}
            </div>
          ) : (
            <PriceListLinesEditor
              priceListId={id}
              lines={linesQuery.data?.items ?? []}
              readOnly={status === 'ARCHIVED'}
            />
          )}
        </div>
      )}

      {activeTab === 'auditoria' && (
        <Card padding="none">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-medium text-neutral-700">Histórico de alterações</h3>
          </div>
          {auditQuery.isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : auditQuery.error ? (
            <div className="px-4 py-4 text-sm text-red-700">
              {(auditQuery.error as ApiError).message}
            </div>
          ) : (auditQuery.data?.items ?? []).length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-500">
              Sem registo de alterações para esta lista.
            </div>
          ) : (
            <ol className="divide-y divide-neutral-100">
              {auditQuery.data!.items.map((entry, idx) => (
                <li key={entry.id} className="flex items-start gap-4 px-4 py-4">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {ACTION_LABEL(entry.action)}
                    </p>
                    <p className="text-xs text-neutral-500">{summarizeChanges(entry.changes)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-neutral-500">{fmtDateTime(entry.createdAt)}</p>
                    <p className="text-xs text-neutral-400">
                      {entry.actor?.name ?? entry.actor?.email ?? 'sistema'}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}
    </section>
  );
}
