import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

interface Lead {
  id: string;
  tradingName: string;
  status: string;
  source: string;
  score: number;
  businessType: string | null;
  estimatedMonthlyVolumeEur: string | null;
  geoZone: string | null;
}

interface LeadList {
  items: Lead[];
  total: number;
}

const KANBAN_COLUMNS = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST'] as const;

const COLUMN_COLORS: Record<string, string> = {
  NEW: 'bg-blue-50 border-blue-200',
  CONTACTED: 'bg-indigo-50 border-indigo-200',
  QUALIFIED: 'bg-purple-50 border-purple-200',
  NEGOTIATING: 'bg-amber-50 border-amber-200',
  WON: 'bg-green-50 border-green-200',
  LOST: 'bg-neutral-100 border-neutral-300',
};

export const Route = createFileRoute('/leads')({
  component: LeadsPage,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: '/sign-in' });
  },
});

function LeadsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: () => api.get<LeadList>('/api/leads?take=200'),
  });

  const byStatus = (status: string) => data?.items.filter((l) => l.status === status) ?? [];

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Floristas Potenciais</h1>
        <p className="text-sm text-neutral-500">
          Pipeline em Kanban — {data ? `${data.total} leads` : 'a carregar…'}
        </p>
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
                className={`rounded-md border ${COLUMN_COLORS[col]} flex min-h-96 flex-col p-3`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-700">
                    {col}
                  </h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs">{leads.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {leads.map((l) => (
                    <article
                      key={l.id}
                      className="rounded-md border bg-white p-3 text-sm shadow-sm"
                    >
                      <h3 className="font-medium leading-tight">{l.tradingName}</h3>
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-neutral-500">
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
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
