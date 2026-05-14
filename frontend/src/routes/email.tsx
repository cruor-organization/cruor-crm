/**
 * Rota /email — Email marketing via Resend + React Email (§10.21).
 */
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Edit, Plus, Send } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { formatDatetime } from '@/lib/format';
import { mockFetch } from '@/lib/mock-api';
import { mockEmailSends, mockEmailTemplates } from '@/lib/mock-data/email';

export const Route = createFileRoute('/email')({
  component: EmailPage,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function openRateVariant(rate: number): 'success' | 'warning' | 'danger' | 'neutral' {
  if (rate >= 0.5) return 'success';
  if (rate >= 0.3) return 'neutral';
  if (rate >= 0.15) return 'warning';
  return 'danger';
}

// ---------------------------------------------------------------------------
// Tabs: Envios
// ---------------------------------------------------------------------------

function EnviosTab() {
  const { data: sends = [], isLoading } = useQuery({
    queryKey: ['email-sends'],
    queryFn: () => mockFetch(mockEmailSends),
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-neutral-400">
        A carregar…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-100 bg-neutral-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-neutral-500">Assunto</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-500">Template</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-500">Segmento</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-500">Enviado em</th>
            <th className="px-4 py-3 text-right font-medium text-neutral-500">Destinatários</th>
            <th className="px-4 py-3 text-right font-medium text-neutral-500">Open rate</th>
            <th className="px-4 py-3 text-right font-medium text-neutral-500">Click rate</th>
            <th className="px-4 py-3 text-right font-medium text-neutral-500">Bounce</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {sends.map((s) => (
            <tr key={s.id} className="hover:bg-neutral-50">
              <td className="max-w-[220px] px-4 py-3">
                <p className="truncate font-medium text-neutral-800">{s.subject}</p>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-neutral-500">{s.template}</span>
              </td>
              <td className="px-4 py-3 text-neutral-600 text-xs">{s.segment}</td>
              <td className="px-4 py-3 text-xs text-neutral-500">{formatDatetime(s.sentAt)}</td>
              <td className="px-4 py-3 text-right text-neutral-700">
                {s.recipients.toLocaleString('pt-PT')}
              </td>
              <td className="px-4 py-3 text-right">
                <Badge variant={openRateVariant(s.openRate)}>{pct(s.openRate)}</Badge>
              </td>
              <td className="px-4 py-3 text-right text-neutral-700">{pct(s.clickRate)}</td>
              <td className="px-4 py-3 text-right text-neutral-500">{pct(s.bounceRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs: Templates
// ---------------------------------------------------------------------------

function TemplatesTab() {
  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => mockFetch(mockEmailTemplates),
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((tmpl) => (
        <div
          key={tmpl.id}
          className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div>
            <p className="font-semibold text-neutral-900">{tmpl.name}</p>
            <p className="mt-1 text-sm text-neutral-500">{tmpl.description}</p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              Editado em {formatDatetime(tmpl.lastEditedAt)}
            </span>
            <Button
              size="sm"
              variant="secondary"
              icon={<Edit className="h-3.5 w-3.5" />}
              onClick={() => console.info('[Email] editar template (mock):', tmpl.id)}
            >
              Editar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

function EmailPage() {
  const [activeTab, setActiveTab] = useState('sends');
  const [showNewModal, setShowNewModal] = useState(false);

  const tabs = [
    { id: 'sends', label: 'Envios' },
    { id: 'templates', label: 'Templates' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email marketing"
        subtitle="Envios e templates via Resend + React Email"
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowNewModal(true)}>
            Novo envio
          </Button>
        }
      />

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab}>
        {activeTab === 'sends' ? <EnviosTab /> : <TemplatesTab />}
      </Tabs>

      {/* Modal novo envio */}
      <Modal open={showNewModal} title="Novo envio de email" onClose={() => setShowNewModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Assunto</label>
            <input
              type="text"
              placeholder="Ex: Newsletter Junho 2026"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Template</label>
            <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
              <option value="newsletter-monthly">Newsletter mensal</option>
              <option value="promotional">Promoção / campanha</option>
              <option value="welcome">Boas-vindas</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Segmento</label>
            <input
              type="text"
              placeholder="Ex: Subscritores newsletter"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <p className="text-xs text-neutral-400">Mock — nenhum email será enviado via Resend.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button
              icon={<Send className="h-4 w-4" />}
              onClick={() => {
                console.info('[Email] enviar email (mock)');
                setShowNewModal(false);
              }}
            >
              Enviar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
