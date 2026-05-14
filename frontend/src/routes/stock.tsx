import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { StockLocationForm } from '@/components/forms/StockLocationForm';
import { StockMovementForm } from '@/components/forms/StockMovementForm';
import { Button } from '@/components/ui/Button';
import { Field, inputCls } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { useFormSubmit } from '@/lib/forms/useFormSubmit';
import { createStockTransferSchema, type CreateStockTransferInput } from '@/lib/schemas/stock';

const PAGE_TABS = [
  { id: 'locations', label: 'Localizações' },
  { id: 'levels', label: 'Níveis' },
  { id: 'movements', label: 'Movimentos' },
  { id: 'transfers', label: 'Transferências' },
];

interface StockLocation {
  id: string;
  code: string;
  name: string;
  country: string;
  isDefault: boolean;
  active: boolean;
}

interface StockLocationList {
  items: StockLocation[];
  total: number;
}

interface StockLevel {
  id: string;
  variantId: string;
  locationId: string;
  available: number;
  reserved: number;
  safetyStock: number;
  variant?: { sku: string; product?: { name: string } };
  location?: { code: string };
}

interface StockLevelList {
  items: StockLevel[];
  total: number;
}

interface StockMovement {
  id: string;
  variantId: string;
  locationId: string;
  kind: string;
  qty: number;
  batch: string | null;
  reason: string | null;
  occurredAt: string;
}

interface StockMovementList {
  items: StockMovement[];
  total: number;
}

const KIND_LABELS: Record<string, string> = {
  IN: 'Entrada',
  OUT: 'Saída',
  RESERVE: 'Reserva',
  RELEASE: 'Liberação',
  ADJUST: 'Ajuste',
  RETURN: 'Devolução',
  TRANSFER_IN: 'Transf. entrada',
  TRANSFER_OUT: 'Transf. saída',
};

export const Route = createFileRoute('/stock')({
  component: StockPage,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: '/sign-in' });
  },
});

function LocationsTab() {
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['stock', 'locations'],
    queryFn: () => api.get<StockLocationList>('/api/stock/locations'),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {data ? `${data.total} localizações` : 'A carregar…'}
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          Nova localização
        </Button>
      </div>

      {isLoading && <div className="text-neutral-500">A carregar…</div>}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-card border border-neutral-200 bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">País</th>
                <th className="px-4 py-2">Padrão</th>
                <th className="px-4 py-2">Ativo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((l) => (
                <tr key={l.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-2 font-mono text-xs">{l.code}</td>
                  <td className="px-4 py-2 font-medium">{l.name}</td>
                  <td className="px-4 py-2">{l.country}</td>
                  <td className="px-4 py-2">{l.isDefault ? '✓' : '—'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        l.active ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {l.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.items.length === 0 && (
        <div className="rounded-card border border-dashed p-12 text-center text-neutral-500">
          Sem localizações. Cria a primeira.
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova localização">
        <StockLocationForm mode="create" onSuccess={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}

function LevelsTab() {
  const [belowSafety, setBelowSafety] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['stock', 'levels', belowSafety],
    queryFn: () =>
      api.get<StockLevelList>(`/api/stock/levels${belowSafety ? '?belowSafety=true' : ''}`),
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 text-cruor-600"
            checked={belowSafety}
            onChange={(e) => setBelowSafety(e.target.checked)}
          />
          Mostrar apenas abaixo do safety stock
        </label>
        <span className="text-sm text-neutral-500">{data ? `${data.total} registos` : ''}</span>
      </div>

      {isLoading && <div className="text-neutral-500">A carregar…</div>}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-card border border-neutral-200 bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2">Variante</th>
                <th className="px-4 py-2">Localização</th>
                <th className="px-4 py-2 text-right">Disponível</th>
                <th className="px-4 py-2 text-right">Reservado</th>
                <th className="px-4 py-2 text-right">Safety</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((l) => (
                <tr
                  key={l.id}
                  className={`hover:bg-neutral-50 ${
                    l.available < l.safetyStock ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-4 py-2 font-mono text-xs">
                    {l.variant?.sku ?? l.variantId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-2">{l.location?.code ?? l.locationId.slice(0, 8)}</td>
                  <td className="px-4 py-2 text-right font-medium">{l.available}</td>
                  <td className="px-4 py-2 text-right text-amber-700">{l.reserved}</td>
                  <td className="px-4 py-2 text-right text-neutral-500">{l.safetyStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.items.length === 0 && (
        <div className="rounded-card border border-dashed p-12 text-center text-neutral-500">
          Sem níveis de stock registados.
        </div>
      )}
    </div>
  );
}

function MovementsTab() {
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['stock', 'movements'],
    queryFn: () => api.get<StockMovementList>('/api/stock/movements?take=50'),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {data ? `${data.total} movimentos (últimos 50)` : 'A carregar…'}
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          Registar movimento
        </Button>
      </div>

      {isLoading && <div className="text-neutral-500">A carregar…</div>}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-card border border-neutral-200 bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Variante</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2">Lote</th>
                <th className="px-4 py-2">Razão</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-2 text-xs text-neutral-500">
                    {new Date(m.occurredAt).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                      {KIND_LABELS[m.kind] ?? m.kind}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{m.variantId.slice(0, 8)}…</td>
                  <td className="px-4 py-2 text-right font-medium">{m.qty}</td>
                  <td className="px-4 py-2 text-xs">{m.batch ?? '—'}</td>
                  <td className="px-4 py-2 text-xs text-neutral-600">{m.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.items.length === 0 && (
        <div className="rounded-card border border-dashed p-12 text-center text-neutral-500">
          Sem movimentos registados.
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Registar movimento">
        <StockMovementForm onSuccess={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}

function TransfersTab() {
  const { data: locationsData } = useQuery({
    queryKey: ['stock', 'locations'],
    queryFn: () => api.get<StockLocationList>('/api/stock/locations'),
  });

  const { data: movementsData } = useQuery({
    queryKey: ['stock', 'movements', 'transfers'],
    queryFn: () => api.get<StockMovementList>('/api/stock/movements?kind=TRANSFER_OUT&take=20'),
  });

  const form = useForm<CreateStockTransferInput>({
    resolver: zodResolver(createStockTransferSchema),
    defaultValues: { qty: 1 },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const locationOptions =
    locationsData?.items.map((l) => ({
      value: l.id,
      label: `${l.code} — ${l.name}`,
    })) ?? [];

  const { submit, isLoading, generalError } = useFormSubmit<CreateStockTransferInput, unknown>(
    form,
    (data) => api.post('/api/stock/transfers', data),
    {
      onSuccess: () => reset(),
      invalidateKeys: [
        ['stock', 'levels'],
        ['stock', 'movements'],
        ['stock', 'movements', 'transfers'],
      ],
    },
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Formulário de transferência */}
      <div className="rounded-card border border-neutral-200 bg-surface p-6 shadow-card">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Nova transferência
        </h3>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          {generalError && (
            <div className="rounded-control bg-red-50 px-4 py-3 text-sm text-red-700">
              {generalError}
            </div>
          )}

          <Field label="Origem" required error={errors.fromLocationId?.message}>
            <Select
              {...register('fromLocationId')}
              placeholder="— selecionar —"
              options={locationOptions}
            />
          </Field>

          <Field label="Destino" required error={errors.toLocationId?.message}>
            <Select
              {...register('toLocationId')}
              placeholder="— selecionar —"
              options={locationOptions}
            />
          </Field>

          <Field label="Variante (ID)" required error={errors.variantId?.message}>
            <input {...register('variantId')} className={inputCls} placeholder="ID da variante" />
          </Field>

          <Field label="Quantidade" required error={errors.qty?.message}>
            <input
              {...register('qty')}
              type="number"
              min={1}
              className={inputCls}
              placeholder="1"
            />
          </Field>

          <Field label="Razão" error={errors.reason?.message}>
            <input {...register('reason')} className={inputCls} placeholder="Redistribuição..." />
          </Field>

          <div className="flex justify-end">
            <Button type="submit" loading={isLoading}>
              Executar transferência
            </Button>
          </div>
        </form>
      </div>

      {/* Transferências recentes */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Transferências recentes
        </h3>

        {movementsData?.items.length === 0 && (
          <p className="text-sm text-neutral-500">Sem transferências registadas.</p>
        )}

        <ol className="space-y-3">
          {movementsData?.items.map((m) => (
            <li
              key={m.id}
              className="rounded-control border border-neutral-200 bg-surface p-3 text-sm shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-neutral-600">
                  {m.variantId.slice(0, 8)}…
                </span>
                <span className="font-medium">{m.qty} un.</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {new Date(m.occurredAt).toLocaleDateString('pt-PT')}
                {m.reason ? ` — ${m.reason}` : ''}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function StockPage() {
  const [activeTab, setActiveTab] = useState('locations');

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Stock</h1>
        <p className="text-sm text-neutral-500">Inventário e movimentos por armazém</p>
      </header>

      <Tabs tabs={PAGE_TABS} active={activeTab} onChange={setActiveTab}>
        {activeTab === 'locations' && <LocationsTab />}
        {activeTab === 'levels' && <LevelsTab />}
        {activeTab === 'movements' && <MovementsTab />}
        {activeTab === 'transfers' && <TransfersTab />}
      </Tabs>
    </section>
  );
}
