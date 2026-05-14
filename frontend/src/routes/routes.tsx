/**
 * Rota /routes — Planeamento de rotas de visita por zona.
 */
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ChevronDown, ChevronUp, MapPin, Navigation, Plus, User } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/format';
import { mockFetch } from '@/lib/mock-api';
import { mockRoutes, type MockRoute, type RouteStatus } from '@/lib/mock-data/routes';

export const Route = createFileRoute('/routes')({
  component: RoutesPage,
});

// ---------------------------------------------------------------------------
// Mapa de cores + rótulos de estado
// ---------------------------------------------------------------------------
type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const STATUS_VARIANT: Record<RouteStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  ACTIVE: 'info',
  DONE: 'success',
};

const STATUS_LABEL: Record<RouteStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativa',
  DONE: 'Concluída',
};

// ---------------------------------------------------------------------------
// Modal placeholder nova rota
// ---------------------------------------------------------------------------
function NewRouteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Nova rota" size="md">
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">
          O assistente de criação de rotas (com otimização automática) será implementado na Fase 7
          (Operação em Campo).
        </p>
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-700">
            <strong>Mock:</strong> nenhuma rota será criada.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              console.info('[Routes] nova rota (mock)');
              onClose();
            }}
          >
            Criar (simulação)
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Card de rota com expansão inline
// ---------------------------------------------------------------------------
function RouteCard({ route }: { route: MockRoute }) {
  const [expanded, setExpanded] = useState(false);

  const etaHours = Math.floor(route.totalEtaMinutes / 60);
  const etaMins = route.totalEtaMinutes % 60;
  const etaLabel = etaHours > 0 ? `${etaHours}h${etaMins > 0 ? `${etaMins}m` : ''}` : `${etaMins}m`;

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Cabeçalho do card */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-5 text-left hover:bg-neutral-50 transition-colors"
      >
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-neutral-900">{route.name}</p>
            <Badge variant={STATUS_VARIANT[route.status]}>{STATUS_LABEL[route.status]}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {route.salesRep}
            </span>
            <span className="flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5" />
              {formatDate(route.plannedDate)}
            </span>
            <span>{route.stops.length} paragens</span>
            <span>{route.totalKm} km</span>
            <span>ETA {etaLabel}</span>
          </div>
          <p className="font-mono text-[11px] text-neutral-400">{route.id}</p>
        </div>
        <div className="shrink-0 mt-1 text-neutral-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Conteúdo expandido */}
      {expanded && (
        <div className="border-t border-neutral-100">
          <div className="flex gap-0 divide-x divide-neutral-100">
            {/* Tabela de paragens */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Paragens
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => console.info('[Routes] reordenar (mock)', route.id)}
                  >
                    Reordenar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => console.info('[Routes] otimizar (mock)', route.id)}
                  >
                    <Navigation className="h-3.5 w-3.5 mr-1" />
                    Otimizar
                  </Button>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-400">
                      #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-400">
                      Cliente
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-400">
                      Cidade
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-neutral-400">
                      ETA prev.
                    </th>
                    {route.status === 'DONE' && (
                      <th className="px-4 py-2 text-right text-xs font-semibold text-neutral-400">
                        Real
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {route.stops.map((stop) => (
                    <tr key={stop.customerId} className="hover:bg-neutral-50">
                      <td className="px-4 py-2 text-xs text-neutral-400">{stop.sequence}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-neutral-300 shrink-0" />
                          <span className="font-medium text-neutral-800">{stop.customerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-neutral-500">{stop.city}</td>
                      <td className="px-4 py-2 text-right text-neutral-600">{stop.etaMinutes}m</td>
                      {route.status === 'DONE' && (
                        <td className="px-4 py-2 text-right">
                          {stop.actualMinutes !== undefined ? (
                            <span
                              className={
                                stop.actualMinutes > stop.etaMinutes
                                  ? 'text-amber-600'
                                  : 'text-green-600'
                              }
                            >
                              {stop.actualMinutes}m
                            </span>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Placeholder mapa */}
            <div className="w-64 shrink-0 flex flex-col items-center justify-center bg-neutral-100 p-4">
              <MapPin className="h-8 w-8 text-neutral-300 mb-2" />
              <p className="text-center text-xs text-neutral-400 leading-snug">
                Mapa em desenvolvimento
              </p>
              <p className="text-center text-[10px] text-neutral-300 mt-1">
                Fase 7 — Mapbox / Leaflet
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
function RoutesPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: () => mockFetch(mockRoutes),
  });

  const draft = routes.filter((r) => r.status === 'DRAFT');
  const active = routes.filter((r) => r.status === 'ACTIVE');
  const done = routes.filter((r) => r.status === 'DONE');

  return (
    <section className="space-y-6">
      <PageHeader
        title="Rotas"
        subtitle="Planeamento de rotas de visita por zona e comercial"
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
            Nova rota
          </Button>
        }
      />

      {isLoading ? (
        <div className="py-8 text-center text-sm text-neutral-400">A carregar…</div>
      ) : (
        <div className="space-y-8">
          {/* Ativas */}
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Em curso ({active.length})
              </h2>
              <div className="space-y-3">
                {active.map((r) => (
                  <RouteCard key={r.id} route={r} />
                ))}
              </div>
            </div>
          )}

          {/* Rascunhos */}
          {draft.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Rascunhos ({draft.length})
              </h2>
              <div className="space-y-3">
                {draft.map((r) => (
                  <RouteCard key={r.id} route={r} />
                ))}
              </div>
            </div>
          )}

          {/* Concluídas */}
          {done.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Concluídas ({done.length})
              </h2>
              <div className="space-y-3">
                {done.map((r) => (
                  <RouteCard key={r.id} route={r} />
                ))}
              </div>
            </div>
          )}

          {routes.length === 0 && (
            <div className="py-12 text-center text-sm text-neutral-400">
              Nenhuma rota criada ainda.
            </div>
          )}
        </div>
      )}

      <NewRouteModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
