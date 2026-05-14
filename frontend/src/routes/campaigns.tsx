/**
 * Rota /campaigns — Campanhas multi-canal + n8n workflows (§10.11).
 */
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Mail, MessageCircle, Monitor, Plus } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stat } from '@/components/ui/Stat';
import { formatDate } from '@/lib/format';
import { mockFetch } from '@/lib/mock-api';
import {
  mockCampaigns,
  type Campaign,
  type CampaignChannel,
  type CampaignStatus,
} from '@/lib/mock-data/campaigns';

export const Route = createFileRoute('/campaigns')({
  component: CampaignsPage,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const STATUS_VARIANT: Record<CampaignStatus, BadgeVariant> = {
  draft: 'neutral',
  scheduled: 'info',
  running: 'warning',
  done: 'success',
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  running: 'A correr',
  done: 'Concluída',
};

function ChannelIcon({ channel }: { channel: CampaignChannel }) {
  if (channel === 'email') return <Mail className="h-4 w-4 text-blue-500" />;
  if (channel === 'whatsapp') return <MessageCircle className="h-4 w-4 text-cruor-500" />;
  return <Monitor className="h-4 w-4 text-blue-500" />;
}

const CHANNEL_LABEL: Record<CampaignChannel, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  social: 'Redes sociais',
};

function pct(v: number | undefined): string {
  if (v === undefined) return '—';
  return `${(v * 100).toFixed(0)}%`;
}

// ---------------------------------------------------------------------------
// Card de campanha
// ---------------------------------------------------------------------------

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <div className="rounded-card border border-neutral-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ChannelIcon channel={campaign.channel} />
          <p className="font-semibold text-neutral-900">{campaign.name}</p>
        </div>
        <Badge variant={STATUS_VARIANT[campaign.status]}>{STATUS_LABEL[campaign.status]}</Badge>
      </div>

      <p className="mt-2 text-sm text-neutral-500">
        {CHANNEL_LABEL[campaign.channel]} · {campaign.segment}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-4 text-center">
        <div>
          <p className="text-xs text-neutral-400">Audiência</p>
          <p className="mt-0.5 font-semibold text-neutral-800">
            {campaign.audienceCount.toLocaleString('pt-PT')}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Enviados</p>
          <p className="mt-0.5 font-semibold text-neutral-800">
            {campaign.sentCount.toLocaleString('pt-PT')}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Open rate</p>
          <p className="mt-0.5 font-semibold text-neutral-800">{pct(campaign.openRate)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
        <span>Início: {formatDate(campaign.startAt)}</span>
        {campaign.endAt && <span>Fim: {formatDate(campaign.endAt)}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

function CampaignsPage() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'all'>('all');

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => mockFetch(mockCampaigns),
  });

  const active = campaigns.filter((c) => c.status === 'running').length;
  const scheduled = campaigns.filter((c) => c.status === 'scheduled').length;
  const totalReach = campaigns.reduce((sum, c) => sum + c.sentCount, 0);

  const filtered =
    filterStatus === 'all' ? campaigns : campaigns.filter((c) => c.status === filterStatus);

  const filterTabs: { key: CampaignStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'running', label: 'A correr' },
    { key: 'scheduled', label: 'Agendadas' },
    { key: 'draft', label: 'Rascunhos' },
    { key: 'done', label: 'Concluídas' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campanhas"
        subtitle="Campanhas multi-canal e automações n8n"
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowNewModal(true)}>
            Nova campanha
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Activas" value={active} />
        <Stat label="Agendadas" value={scheduled} />
        <Stat label="Alcance total (enviados)" value={totalReach.toLocaleString('pt-PT')} />
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filterStatus === tab.key
                ? 'bg-cruor-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid de cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {/* Modal nova campanha */}
      <Modal open={showNewModal} title="Nova campanha" onClose={() => setShowNewModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Nome</label>
            <input
              type="text"
              placeholder="Ex: Promoção Verão 2026"
              className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-cruor-500 focus:ring-1 focus:ring-cruor-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Canal</label>
            <select className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-cruor-500 focus:ring-1 focus:ring-cruor-500">
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="social">Redes sociais</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Segmento</label>
            <input
              type="text"
              placeholder="Ex: Clientes activos Lisboa"
              className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-cruor-500 focus:ring-1 focus:ring-cruor-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Data de início
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-cruor-500 focus:ring-1 focus:ring-cruor-500"
            />
          </div>
          <p className="text-xs text-neutral-400">
            Mock — nenhuma campanha será criada. O builder completo será implementado com n8n.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                console.info('[Campaigns] criar campanha (mock)');
                setShowNewModal(false);
              }}
            >
              Criar campanha
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
