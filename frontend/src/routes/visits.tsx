/**
 * Rota /visits — Gestão de visitas comerciais.
 */
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Calendar, CheckCircle, Clock, MapPin, Plus, User } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stat } from '@/components/ui/Stat';
import { formatDatetime, formatDate } from '@/lib/format';
import { mockFetch } from '@/lib/mock-api';
import { mockVisits, type MockVisit, type VisitStatus } from '@/lib/mock-data/visits';

export const Route = createFileRoute('/visits')({
  component: VisitsPage,
});

// ---------------------------------------------------------------------------
// Mapa de cores + rótulos de estado
// ---------------------------------------------------------------------------
type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const STATUS_VARIANT: Record<VisitStatus, BadgeVariant> = {
  PLANNED: 'neutral',
  CONFIRMED: 'info',
  IN_PROGRESS: 'warning',
  DONE: 'success',
  NO_SHOW: 'danger',
  CANCELLED: 'danger',
};

const STATUS_LABEL: Record<VisitStatus, string> = {
  PLANNED: 'Planeada',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'Em curso',
  DONE: 'Feita',
  NO_SHOW: 'Não apareceu',
  CANCELLED: 'Cancelada',
};

const TODAY_STR = '2026-05-13';

function isToday(isoDate: string): boolean {
  return isoDate.startsWith(TODAY_STR);
}

function isNext7Days(isoDate: string): boolean {
  const dt = new Date(isoDate);
  const today = new Date(TODAY_STR);
  const limit = new Date(TODAY_STR);
  limit.setDate(limit.getDate() + 7);
  return dt >= today && dt <= limit;
}

function isFuture(isoDate: string): boolean {
  return new Date(isoDate) >= new Date(TODAY_STR);
}

// ---------------------------------------------------------------------------
// Modal placeholder
// ---------------------------------------------------------------------------
function NewVisitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Nova visita" size="md">
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">
          O formulário de criação de visitas será implementado na Fase 7 (Operação em Campo). Por
          agora, este ecrã confirma que o modal funciona.
        </p>
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-700">
            <strong>Mock:</strong> nenhuma visita será criada.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              console.info('[Visits] nova visita (mock)');
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
// Card de visita futura
// ---------------------------------------------------------------------------
function VisitCard({ visit }: { visit: MockVisit }) {
  return (
    <Card padding="md" className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-neutral-900">{visit.customerName}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
            <MapPin className="h-3 w-3" />
            <span>
              {visit.city}, {visit.country}
            </span>
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[visit.status]}>{STATUS_LABEL[visit.status]}</Badge>
      </div>
      <div className="space-y-1 text-xs text-neutral-600">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
          <span>{formatDatetime(visit.scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-neutral-400" />
          <span>{visit.salesRep}</span>
        </div>
        {visit.notes && (
          <p className="mt-1 rounded bg-neutral-50 px-2 py-1 text-neutral-500 leading-snug">
            {visit.notes}
          </p>
        )}
      </div>
      <div className="flex gap-2 border-t border-neutral-100 pt-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => console.info('[Visits] confirmar visita (mock)', visit.id)}
        >
          Confirmar
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => console.info('[Visits] marcar feita (mock)', visit.id)}
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          Feita
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => console.info('[Visits] cancelar (mock)', visit.id)}
          className="ml-auto text-red-600 hover:text-red-700"
        >
          Cancelar
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
function VisitsPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['visits'],
    queryFn: () => mockFetch(mockVisits),
  });

  const upcoming = visits.filter((v) => isFuture(v.scheduledAt));
  const historical = visits.filter((v) => !isFuture(v.scheduledAt));

  const next7 = visits.filter((v) => isNext7Days(v.scheduledAt)).length;
  const today = visits.filter((v) => isToday(v.scheduledAt)).length;
  const pendingConfirm = visits.filter((v) => v.status === 'PLANNED').length;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Visitas"
        subtitle="Gestão de visitas comerciais aos floristas"
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
            Nova visita
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat
          label="Próximos 7d"
          value={isLoading ? '…' : next7}
          icon={<Calendar className="h-5 w-5" />}
        />
        <Stat label="Hoje" value={isLoading ? '…' : today} icon={<Clock className="h-5 w-5" />} />
        <Stat
          label="Por confirmar"
          value={isLoading ? '…' : pendingConfirm}
          icon={<CheckCircle className="h-5 w-5" />}
        />
      </div>

      {/* Próximas visitas */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Próximas visitas ({upcoming.length})
        </h2>
        {isLoading ? (
          <div className="py-6 text-center text-sm text-neutral-400">A carregar…</div>
        ) : upcoming.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-400">Sem visitas planeadas.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((v) => (
              <VisitCard key={v.id} visit={v} />
            ))}
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Histórico ({historical.length})
        </h2>
        {!isLoading && historical.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Cidade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Comercial
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {historical.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{v.customerName}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {v.city}, {v.country}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{formatDate(v.scheduledAt)}</td>
                    <td className="px-4 py-3 text-neutral-600">{v.salesRep}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[v.status]}>{STATUS_LABEL[v.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewVisitModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
