import { createFileRoute } from '@tanstack/react-router';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useState, type FormEvent, type ReactElement, type ReactNode } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { formatDatetime } from '@/lib/format';
import {
  mockOrgInfo,
  mockOrgUsers,
  mockIntegrations,
  mockAuditLog,
  type UserRole,
  type IntegrationStatus,
} from '@/lib/mock-data';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

const SETTINGS_TABS = [
  { id: 'org', label: 'Organização' },
  { id: 'users', label: 'Utilizadores' },
  { id: 'integrations', label: 'Integrações' },
  { id: 'audit', label: 'Auditoria' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  SALES_MANAGER: 'Dir. Comercial',
  SALES_REP: 'Comercial',
  WAREHOUSE: 'Armazém',
};

const ROLE_VARIANT: Record<UserRole, 'neutral' | 'success' | 'info' | 'warning' | 'danger'> = {
  OWNER: 'danger',
  ADMIN: 'warning',
  SALES_MANAGER: 'info',
  SALES_REP: 'success',
  WAREHOUSE: 'neutral',
};

const INTEGRATION_STATUS_ICON: Record<IntegrationStatus, ReactElement> = {
  connected: <CheckCircle className="h-4 w-4 text-green-500" />,
  disconnected: <XCircle className="h-4 w-4 text-neutral-400" />,
  error: <AlertTriangle className="h-4 w-4 text-red-500" />,
};

const INTEGRATION_STATUS_LABEL: Record<IntegrationStatus, string> = {
  connected: 'Ligado',
  disconnected: 'Desligado',
  error: 'Erro',
};

const INTEGRATION_STATUS_VARIANT: Record<IntegrationStatus, 'success' | 'neutral' | 'danger'> = {
  connected: 'success',
  disconnected: 'neutral',
  error: 'danger',
};

const ACTION_LABELS: Record<string, string> = {
  UPDATE: 'Atualização',
  CREATE: 'Criação',
  DELETE: 'Eliminação',
  INVITE: 'Convite',
  CLOSE_MONTH: 'Fecho de mês',
};

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('org');
  const [orgForm, setOrgForm] = useState({ ...mockOrgInfo });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('SALES_REP');
  const [inviting, setInviting] = useState(false);

  function handleSaveOrg(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      console.info('[mock] Organização guardada', orgForm);
      setTimeout(() => setSaved(false), 3000);
    }, 900);
  }

  function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviting(true);
    setTimeout(() => {
      setInviting(false);
      setInviteOpen(false);
      setInviteEmail('');
      console.info('[mock] Convite enviado para', inviteEmail, 'com papel', inviteRole);
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        subtitle="Organização, utilizadores, integrações e auditoria"
      />

      <Tabs tabs={SETTINGS_TABS} active={activeTab} onChange={setActiveTab} />

      {/* Organização */}
      {activeTab === 'org' && (
        <Card>
          <form onSubmit={handleSaveOrg} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-neutral-700">Dados da organização</h2>
            </div>

            <OrgField label="Nome da empresa">
              <input
                className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cruor-500 focus:outline-none focus:ring-1 focus:ring-cruor-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
              />
            </OrgField>

            <OrgField label="NIF">
              <input
                className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cruor-500 focus:outline-none focus:ring-1 focus:ring-cruor-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                value={orgForm.nif}
                onChange={(e) => setOrgForm({ ...orgForm, nif: e.target.value })}
              />
            </OrgField>

            <OrgField label="Morada" className="col-span-2">
              <input
                className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cruor-500 focus:outline-none focus:ring-1 focus:ring-cruor-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                value={orgForm.address}
                onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
              />
            </OrgField>

            <OrgField label="Telefone">
              <input
                className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cruor-500 focus:outline-none focus:ring-1 focus:ring-cruor-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                value={orgForm.phone}
                onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
              />
            </OrgField>

            <OrgField label="Email">
              <input
                type="email"
                className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cruor-500 focus:outline-none focus:ring-1 focus:ring-cruor-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                value={orgForm.email}
                onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
              />
            </OrgField>

            <OrgField label="Locale">
              <input
                className="w-full rounded-control border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
                value={orgForm.locale}
                disabled
              />
            </OrgField>

            <OrgField label="Moeda">
              <input
                className="w-full rounded-control border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
                value={orgForm.currency}
                disabled
              />
            </OrgField>

            <OrgField label="IVA padrão (%)">
              <input
                type="number"
                className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cruor-500 focus:outline-none focus:ring-1 focus:ring-cruor-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                value={orgForm.vatDefault}
                onChange={(e) => setOrgForm({ ...orgForm, vatDefault: Number(e.target.value) })}
              />
            </OrgField>

            <div className="col-span-2 flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'A guardar…' : 'Guardar alterações'}
              </Button>
              {saved && <span className="text-sm text-green-600">Guardado com sucesso.</span>}
            </div>
          </form>
        </Card>
      )}

      {/* Utilizadores */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setInviteOpen(true)}>
              Convidar utilizador
            </Button>
          </div>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
                    <th className="px-4 py-2 font-medium">Nome</th>
                    <th className="px-4 py-2 font-medium">Email</th>
                    <th className="px-4 py-2 font-medium">Papel</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                    <th className="px-4 py-2 font-medium">Última actividade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {mockOrgUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800">{user.name}</td>
                      <td className="px-4 py-3 text-neutral-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={ROLE_VARIANT[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            user.status === 'active'
                              ? 'success'
                              : user.status === 'invited'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {user.status === 'active'
                            ? 'Activo'
                            : user.status === 'invited'
                              ? 'Convite pendente'
                              : 'Suspenso'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {formatDatetime(user.lastActiveAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Integrações */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockIntegrations.map((int) => (
            <Card key={int.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {INTEGRATION_STATUS_ICON[int.status]}
                  <span className="font-medium text-neutral-800">{int.name}</span>
                </div>
                <Badge variant={INTEGRATION_STATUS_VARIANT[int.status]}>
                  {INTEGRATION_STATUS_LABEL[int.status]}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-neutral-500">{int.description}</p>
              <p className="mt-1 text-xs text-neutral-400">Categoria: {int.category}</p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => console.info('[mock] Configurar integração:', int.id)}
                >
                  {int.status === 'disconnected' ? 'Ligar' : 'Configurar'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Auditoria */}
      {activeTab === 'audit' && (
        <Card padding="none">
          <div className="border-b border-neutral-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-neutral-700">Registo de auditoria</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
                  <th className="px-4 py-2 font-medium">Utilizador</th>
                  <th className="px-4 py-2 font-medium">Acção</th>
                  <th className="px-4 py-2 font-medium">Entidade</th>
                  <th className="px-4 py-2 font-medium">ID</th>
                  <th className="px-4 py-2 font-medium">Quando</th>
                  <th className="px-4 py-2 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {mockAuditLog.map((entry) => (
                  <tr key={entry.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2.5 font-medium text-neutral-800">{entry.who}</td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={
                          entry.action === 'DELETE'
                            ? 'danger'
                            : entry.action === 'CREATE'
                              ? 'success'
                              : 'neutral'
                        }
                      >
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">{entry.entity}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-neutral-400">
                      {entry.entityId}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500">{formatDatetime(entry.when)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-neutral-400">
                      {entry.ip ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal convidar utilizador */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Convidar utilizador">
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-700">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cruor-500 focus:outline-none focus:ring-1 focus:ring-cruor-500 disabled:bg-neutral-50 disabled:text-neutral-500"
              placeholder="nome@empresa.pt"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-700">Papel</label>
            <select
              className="w-full rounded-control border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cruor-500 focus:outline-none focus:ring-1 focus:ring-cruor-500 disabled:bg-neutral-50 disabled:text-neutral-500"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
            >
              {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={inviting}>
              {inviting ? 'A enviar…' : 'Enviar convite'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/** Componente auxiliar para campos de formulário de organização */
function OrgField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      {children}
    </div>
  );
}
