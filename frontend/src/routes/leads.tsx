import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { LeadForm } from '@/components/forms/LeadForm';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

interface Lead {
  id: string;
  tradingName: string;
  legalName: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  email: string | null;
  source: string;
  businessType: string | null;
  estimatedMonthlyVolumeEur: string | null;
  geoZone: string | null;
  notes: string | null;
  score: number;
  status: string;
}

interface LeadList {
  items: Lead[];
  total: number;
}

interface ConvertResult {
  customerId?: string;
}

const KANBAN_COLUMNS = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST'] as const;

const COLUMN_COLORS: Record<string, string> = {
  NEW: 'bg-blue-50 border-blue-200',
  CONTACTED: 'bg-blue-50 border-blue-200',
  QUALIFIED: 'bg-amber-50 border-amber-200',
  NEGOTIATING: 'bg-amber-50 border-amber-200',
  WON: 'bg-green-50 border-green-200',
  LOST: 'bg-neutral-100 border-neutral-300',
};

const COLUMN_LABELS: Record<string, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Qualificado',
  NEGOTIATING: 'Em negociação',
  WON: 'Ganho',
  LOST: 'Perdido',
};

const NEXT_STATUS: Record<string, string | null> = {
  NEW: 'CONTACTED',
  CONTACTED: 'QUALIFIED',
  QUALIFIED: 'NEGOTIATING',
  NEGOTIATING: 'WON',
  WON: null,
  LOST: null,
};

export const Route = createFileRoute('/leads')({
  component: LeadsPage,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: '/sign-in' });
  },
});

function LeadsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Lead | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: () => api.get<LeadList>('/api/leads?take=200'),
  });

  const byStatus = (status: string) => data?.items.filter((l) => l.status === status) ?? [];

  const handleAdvanceStatus = async (lead: Lead) => {
    const next = NEXT_STATUS[lead.status];
    if (!next) return;
    await api.patch(`/api/leads/${lead.id}/status`, { status: next });
    await queryClient.invalidateQueries({ queryKey: ['leads'] });
    setMenuOpen(null);
  };

  const handleConvert = async (lead: Lead) => {
    const result = await api.post<ConvertResult>(`/api/leads/${lead.id}/convert`, {});
    await queryClient.invalidateQueries({ queryKey: ['leads'] });
    setMenuOpen(null);
    if (result?.customerId) {
      void navigate({ to: '/customers/$id', params: { id: result.customerId } });
    }
  };

  return (
    <section>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Floristas Potenciais
          </h1>
          <p className="text-sm text-neutral-500">
            Pipeline em Kanban — {data ? `${data.total} leads` : 'a carregar…'}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Novo potencial</Button>
      </header>

      {isLoading && <div className="text-neutral-500">A carregar…</div>}
      {error && <div className="text-red-600">Erro: {error.message}</div>}

      {data && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {KANBAN_COLUMNS.map((col) => {
            const leads = byStatus(col);
            return (
              <div
                key={col}
                className={`rounded-card border ${COLUMN_COLORS[col]} flex min-h-96 flex-col p-3`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {COLUMN_LABELS[col]}
                  </h2>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-neutral-600 shadow-card border border-neutral-100">
                    {leads.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {leads.map((l) => (
                    <article
                      key={l.id}
                      className="rounded-control border border-neutral-200 bg-surface p-3 text-sm shadow-card"
                    >
                      <h3 className="font-medium leading-tight text-neutral-900">
                        {l.tradingName}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[12px] text-neutral-500">
                        {l.businessType && <span>{l.businessType}</span>}
                        {l.geoZone && <span>· {l.geoZone}</span>}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-neutral-500">{l.source}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            l.score >= 70
                              ? 'bg-green-100 text-green-800'
                              : l.score >= 40
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          {l.score}/100
                        </span>
                      </div>

                      {/* Menu de ações */}
                      <div className="relative mt-2 border-t border-neutral-100 pt-2">
                        <button
                          type="button"
                          className="text-xs text-neutral-400 transition-colors hover:text-neutral-700"
                          onClick={() => setMenuOpen(menuOpen === l.id ? null : l.id)}
                        >
                          ···
                        </button>
                        {menuOpen === l.id && (
                          <div className="absolute right-0 z-10 mt-1 w-48 rounded-control border border-neutral-200 bg-surface py-1 shadow-pop">
                            <button
                              type="button"
                              className="w-full px-4 py-2 text-left text-xs transition-colors hover:bg-neutral-50"
                              onClick={() => {
                                setEditTarget(l);
                                setMenuOpen(null);
                              }}
                            >
                              Editar
                            </button>
                            {NEXT_STATUS[l.status] && (
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-xs transition-colors hover:bg-neutral-50"
                                onClick={() => void handleAdvanceStatus(l)}
                              >
                                Avançar → {COLUMN_LABELS[NEXT_STATUS[l.status]!]}
                              </button>
                            )}
                            {l.status !== 'WON' && l.status !== 'LOST' && (
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-xs text-cruor-600 transition-colors hover:bg-neutral-50"
                                onClick={() => void handleConvert(l)}
                              >
                                Converter em florista
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal criar */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo potencial">
        <LeadForm mode="create" onSuccess={() => setShowCreate(false)} />
      </Modal>

      {/* Modal editar */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Editar: ${editTarget?.tradingName ?? ''}`}
      >
        {editTarget && (
          <LeadForm mode="edit" lead={editTarget} onSuccess={() => setEditTarget(null)} />
        )}
      </Modal>
    </section>
  );
}
