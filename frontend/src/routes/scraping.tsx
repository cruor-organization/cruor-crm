/**
 * Rota /scraping — Targets de scraping e histórico de execuções (§10.7, §10.9).
 */
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { AlertCircle, ExternalLink, Pause, Play, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDatetime } from '@/lib/format';
import { mockFetch } from '@/lib/mock-api';
import {
  mockScrapingTargets,
  mockScrapingRuns,
  type ScrapingTarget,
  type ScrapingTargetStatus,
  type ScrapingRunStatus,
} from '@/lib/mock-data/scraping';

export const Route = createFileRoute('/scraping')({
  component: ScrapingPage,
});

// ---------------------------------------------------------------------------
// Helpers de badge
// ---------------------------------------------------------------------------

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const TARGET_STATUS_VARIANT: Record<ScrapingTargetStatus, BadgeVariant> = {
  active: 'success',
  paused: 'neutral',
  error: 'danger',
};

const TARGET_STATUS_LABEL: Record<ScrapingTargetStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  error: 'Erro',
};

const RUN_STATUS_VARIANT: Record<ScrapingRunStatus, BadgeVariant> = {
  success: 'success',
  failed: 'danger',
  partial: 'warning',
};

const RUN_STATUS_LABEL: Record<ScrapingRunStatus, string> = {
  success: 'Sucesso',
  failed: 'Falhado',
  partial: 'Parcial',
};

const KIND_LABEL: Record<ScrapingTarget['kind'], string> = {
  competitor: 'Concorrente',
  lead_source: 'Fonte de leads',
};

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

function ScrapingPage() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());

  const { data: targets = [] } = useQuery({
    queryKey: ['scraping-targets'],
    queryFn: () => mockFetch(mockScrapingTargets),
  });

  const { data: runs = [] } = useQuery({
    queryKey: ['scraping-runs'],
    queryFn: () => mockFetch(mockScrapingRuns),
  });

  function handleRunNow(target: ScrapingTarget) {
    if (runningIds.has(target.id)) return;
    console.info('[Scraping] correr agora (mock):', target.id);
    setRunningIds((prev) => new Set([...prev, target.id]));
    setTimeout(() => {
      setRunningIds((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
    }, 2000);
  }

  // Ordenar runs: mais recentes primeiro
  const sortedRuns = [...runs].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scraping"
        subtitle="Captura automática de preços de concorrentes e geração de leads"
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowNewModal(true)}>
            Novo target
          </Button>
        }
      />

      {/* Tabela de targets */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Targets ({targets.length})
        </h2>
        <div className="overflow-hidden rounded-card border border-neutral-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Cadência</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">
                  Última execução
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {targets.map((target) => (
                <tr key={target.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-800">{target.name}</p>
                    <span className="flex items-center gap-0.5 text-xs text-blue-500">
                      <ExternalLink className="h-3 w-3" />
                      {target.url.length > 50 ? `${target.url.slice(0, 50)}…` : target.url}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={target.kind === 'competitor' ? 'info' : 'warning'}>
                      {KIND_LABEL[target.kind]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={TARGET_STATUS_VARIANT[target.status]}>
                      {target.status === 'error' && <AlertCircle className="mr-1 h-3 w-3" />}
                      {TARGET_STATUS_LABEL[target.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{target.cadence}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {target.lastRunAt ? formatDatetime(target.lastRunAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={
                          runningIds.has(target.id) ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )
                        }
                        onClick={() => handleRunNow(target)}
                        disabled={runningIds.has(target.id) || target.status === 'paused'}
                      >
                        {runningIds.has(target.id) ? 'A correr…' : 'Correr agora'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Pause className="h-3.5 w-3.5" />}
                        onClick={() => console.info('[Scraping] pausar/retomar (mock):', target.id)}
                      >
                        {target.status === 'paused' ? 'Retomar' : 'Pausar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Histórico de execuções */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Histórico de execuções
        </h2>
        <div className="overflow-hidden rounded-card border border-neutral-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Target</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Início</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Duração</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Itens</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sortedRuns.map((run) => {
                const target = targets.find((t) => t.id === run.targetId);
                const durationSec = run.finishedAt
                  ? Math.round(
                      (new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) /
                        1000,
                    )
                  : null;
                return (
                  <tr key={run.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-800">
                      {target?.name ?? run.targetId}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {formatDatetime(run.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {durationSec !== null ? `${durationSec}s` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={RUN_STATUS_VARIANT[run.status]}>
                        {RUN_STATUS_LABEL[run.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{run.itemsFound}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{run.notes ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal novo target */}
      <Modal
        open={showNewModal}
        title="Novo target de scraping"
        onClose={() => setShowNewModal(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Nome</label>
            <input
              type="text"
              placeholder="Ex: FloresOnline.pt"
              className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-cruor-500 focus:ring-1 focus:ring-cruor-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">URL</label>
            <input
              type="url"
              placeholder="https://…"
              className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-cruor-500 focus:ring-1 focus:ring-cruor-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Tipo</label>
            <select className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-cruor-500 focus:ring-1 focus:ring-cruor-500">
              <option value="competitor">Concorrente</option>
              <option value="lead_source">Fonte de leads</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Cadência</label>
            <select className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-cruor-500 focus:ring-1 focus:ring-cruor-500">
              <option>Diário</option>
              <option>Semanal</option>
              <option>Mensal</option>
            </select>
          </div>
          <p className="text-xs text-neutral-400">Mock — nenhum target será criado.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                console.info('[Scraping] criar target (mock)');
                setShowNewModal(false);
              }}
            >
              Criar target
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
