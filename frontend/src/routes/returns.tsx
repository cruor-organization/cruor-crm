/**
 * Rota /returns — lista de devoluções com expansão inline.
 */
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/format';
import { mockFetch } from '@/lib/mock-api';
import {
  mockReturns,
  type MockReturn,
  type ReturnStatus,
  type ReturnReason,
  type ReturnCondition,
  type ReturnResolution,
} from '@/lib/mock-data/returns';

export const Route = createFileRoute('/returns')({
  component: ReturnsPage,
});

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const STATUS_VARIANT: Record<ReturnStatus, BadgeVariant> = {
  RECEIVED: 'neutral',
  INSPECTED: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  REFUNDED: 'success',
  REPLACED: 'success',
};

const STATUS_LABEL: Record<ReturnStatus, string> = {
  RECEIVED: 'Recebida',
  INSPECTED: 'Inspeccionada',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  REFUNDED: 'Reembolsada',
  REPLACED: 'Substituída',
};

const REASON_LABEL: Record<ReturnReason, string> = {
  DAMAGED: 'Danificado',
  WRONG_ITEM: 'Artigo errado',
  QUALITY: 'Qualidade',
  EXCESS: 'Excesso',
  OTHER: 'Outro',
};

const REASON_VARIANT: Record<ReturnReason, BadgeVariant> = {
  DAMAGED: 'danger',
  WRONG_ITEM: 'warning',
  QUALITY: 'warning',
  EXCESS: 'info',
  OTHER: 'neutral',
};

const CONDITION_LABEL: Record<ReturnCondition, string> = {
  PRISTINE: 'Intacto',
  DAMAGED: 'Danificado',
  SCRAP: 'Sucata',
};

const CONDITION_VARIANT: Record<ReturnCondition, BadgeVariant> = {
  PRISTINE: 'success',
  DAMAGED: 'warning',
  SCRAP: 'danger',
};

const RESOLUTION_LABEL: Record<NonNullable<ReturnResolution>, string> = {
  REFUND_FULL: 'Reembolso total',
  REFUND_PARTIAL: 'Reembolso parcial',
  REPLACE: 'Substituição',
  CREDIT_NOTE: 'Nota de crédito',
};

// ---------------------------------------------------------------------------
// Modal: nova devolução (placeholder)
// ---------------------------------------------------------------------------
function NewReturnModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Nova devolução" size="md">
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">
          O formulário de criação de devolução será implementado na Fase 3.
        </p>
        <div className="rounded-control border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-700">
            <strong>Mock:</strong> nenhuma devolução será criada.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              console.info('[Returns] nova devolução (mock)');
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
// Row expandida
// ---------------------------------------------------------------------------
function ReturnDetail({ ret }: { ret: MockReturn }) {
  return (
    <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-4 space-y-4">
      {/* Linhas */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Artigos devolvidos
        </h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="pb-2 text-left text-xs font-semibold text-neutral-500">SKU</th>
              <th className="pb-2 text-left text-xs font-semibold text-neutral-500">Produto</th>
              <th className="pb-2 text-right text-xs font-semibold text-neutral-500">Qty</th>
              <th className="pb-2 text-left text-xs font-semibold text-neutral-500">Motivo</th>
              <th className="pb-2 text-left text-xs font-semibold text-neutral-500">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {ret.lines.map((line, i) => (
              <tr key={i}>
                <td className="py-2 font-mono text-xs text-neutral-500">{line.variantSku}</td>
                <td className="py-2 text-neutral-900">{line.variantName}</td>
                <td className="py-2 text-right text-neutral-700">{line.qty}</td>
                <td className="py-2">
                  <Badge variant={REASON_VARIANT[line.reason]}>{REASON_LABEL[line.reason]}</Badge>
                </td>
                <td className="py-2">
                  <Badge variant={CONDITION_VARIANT[line.condition]}>
                    {CONDITION_LABEL[line.condition]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notas de inspecção */}
      {ret.inspectionNotes && (
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Notas de inspecção
          </h4>
          <p className="text-sm text-neutral-700">{ret.inspectionNotes}</p>
        </div>
      )}

      {/* Fotos */}
      {ret.photos.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Fotografias ({ret.photos.length})
          </h4>
          <div className="flex gap-2 flex-wrap">
            {ret.photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Foto ${i + 1}`}
                className="h-20 w-28 rounded-md object-cover border border-neutral-200"
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolução */}
      {ret.resolution && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Resolução:</span>
          <Badge variant="success">{RESOLUTION_LABEL[ret.resolution]}</Badge>
          {ret.decidedAt && (
            <span className="text-xs text-neutral-400">em {formatDate(ret.decidedAt)}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
function ReturnsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newReturnOpen, setNewReturnOpen] = useState(false);

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: () => mockFetch(mockReturns),
  });

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Devoluções"
        subtitle="Gestão de devoluções e notas de crédito"
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setNewReturnOpen(true)}>
            Nova devolução
          </Button>
        }
      />

      {isLoading ? (
        <div className="py-8 text-center text-sm text-neutral-500">A carregar…</div>
      ) : returns.length === 0 ? (
        <div className="py-12 text-center text-sm text-neutral-500">Sem devoluções registadas.</div>
      ) : (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Encomenda
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Artigos
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Criada
                </th>
              </tr>
            </thead>
            <tbody>
              {returns.map((ret: MockReturn) => {
                const isExpanded = expandedId === ret.id;
                return (
                  <>
                    <tr
                      key={ret.id}
                      className="cursor-pointer border-b border-neutral-100 hover:bg-neutral-50"
                      onClick={() => toggleExpand(ret.id)}
                    >
                      <td className="px-4 py-3 text-neutral-400">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-cruor-700">
                        {ret.id}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                        {ret.orderId}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900">{ret.customer}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[ret.status]}>
                          {STATUS_LABEL[ret.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">
                        {ret.lines.reduce((sum, l) => sum + l.qty, 0)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{formatDate(ret.createdAt)}</td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${ret.id}-detail`}>
                        <td colSpan={7} className="p-0">
                          <ReturnDetail ret={ret} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <NewReturnModal open={newReturnOpen} onClose={() => setNewReturnOpen(false)} />
    </section>
  );
}
