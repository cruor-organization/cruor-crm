/**
 * Rota /pricing — Módulo de preços.
 * Três tabs: Listas, Specials, Resolver.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { SpecialPriceForm } from '@/components/forms/SpecialPriceForm';
import { PriceListsTable, type PriceListRow } from '@/components/pricing/PriceListsTable';
import { PriceResolverSidebar } from '@/components/pricing/PriceResolverSidebar';
import { SpecialPricesTable, type SpecialPriceRow } from '@/components/pricing/SpecialPricesTable';
import { Button } from '@/components/ui/Button';
import { Field, inputCls } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { api, type ApiError } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import {
  createPriceListSchema,
  pricingTierValues,
  type CreatePriceListInput,
  type PricingTier,
} from '@/lib/schemas/pricing';

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: '/sign-in' });
  },
});

const TABS = [
  { id: 'listas', label: 'Listas de preços' },
  { id: 'specials', label: 'Preços especiais' },
  { id: 'resolver', label: 'Resolver preço' },
];

const TIER_LABELS: Record<PricingTier, string> = {
  STANDARD: 'Standard',
  PROFESSIONAL: 'Profissional',
  KEY_ACCOUNT: 'Key Account',
  DISTRIBUTOR: 'Distribuidor',
};

// ---------- Tipos de respostas do backend ----------

interface PriceListApi {
  id: string;
  name: string;
  tier: PricingTier;
  currency: 'EUR';
  validFrom: string;
  validUntil: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  _count: { lines: number };
}

interface SpecialPriceApi {
  id: string;
  customerId: string;
  variantId: string;
  unitPriceEur: string;
  validFrom: string;
  validUntil: string | null;
  reason: string | null;
  customer: { id: string; legalName: string; tradingName: string | null };
  variant: { id: string; sku: string; label: string; product: { name: string } };
}

interface CustomerListApi {
  items: { id: string; legalName: string; tradingName: string | null }[];
}

interface VariantListApi {
  items: {
    id: string;
    sku: string;
    label: string;
    productId: string;
    productName: string;
    costEur: string | null;
  }[];
}

function mapPriceList(p: PriceListApi): PriceListRow {
  return {
    id: p.id,
    name: p.name,
    tier: p.tier,
    currency: p.currency,
    validFrom: p.validFrom,
    validUntil: p.validUntil,
    status: p.status,
    lineCount: p._count.lines,
  };
}

function mapSpecial(s: SpecialPriceApi): SpecialPriceRow {
  return {
    id: s.id,
    customerId: s.customerId,
    customerName: s.customer.tradingName ?? s.customer.legalName,
    variantId: s.variantId,
    variantName: `${s.variant.product.name} — ${s.variant.label}`,
    unitPriceEur: Number(s.unitPriceEur),
    validFrom: s.validFrom,
    validUntil: s.validUntil,
    reason: s.reason,
  };
}

// ---------- Modal: Nova lista de preços ----------

function NewPriceListModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const form = useForm<CreatePriceListInput>({
    resolver: zodResolver(createPriceListSchema),
    defaultValues: { tier: 'STANDARD', currency: 'EUR' },
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const mutation = useMutation({
    mutationFn: (data: CreatePriceListInput) => api.post('/api/pricing/lists', data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['priceLists'] });
      reset({ tier: 'STANDARD', currency: 'EUR' });
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Nova lista de preços" size="md">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        {mutation.error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {(mutation.error as ApiError).message ?? 'Erro a criar lista.'}
          </div>
        )}
        <Field label="Nome" required error={errors.name?.message}>
          <input {...register('name')} className={inputCls} placeholder="ex.: B2B Florista 2026" />
        </Field>
        <Field label="Escalão" required error={errors.tier?.message}>
          <Select
            {...register('tier')}
            options={pricingTierValues.map((v) => ({ value: v, label: TIER_LABELS[v] }))}
          />
        </Field>
        <Field label="Moeda">
          <input className={inputCls} value="EUR" disabled />
        </Field>
        <Field label="Válida de" required error={errors.validFrom?.message}>
          <input {...register('validFrom')} type="date" className={inputCls} />
        </Field>
        <Field label="Válida até" error={errors.validUntil?.message}>
          <input {...register('validUntil')} type="date" className={inputCls} />
        </Field>
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Criar lista
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Página ----------

function PricingPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('listas');
  const [newListOpen, setNewListOpen] = useState(false);
  const [newSpecialOpen, setNewSpecialOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SpecialPriceRow | null>(null);

  const listsQuery = useQuery({
    queryKey: ['priceLists'],
    queryFn: () => api.get<{ items: PriceListApi[]; total: number }>('/api/pricing/lists'),
  });

  const specialsQuery = useQuery({
    queryKey: ['customerSpecials'],
    queryFn: () => api.get<{ items: SpecialPriceApi[]; total: number }>('/api/pricing/specials'),
  });

  const customersQuery = useQuery({
    queryKey: ['pricing', 'customers'],
    queryFn: () => api.get<CustomerListApi>('/api/customers?take=100'),
    enabled: newSpecialOpen || editTarget !== null,
  });

  const variantsQuery = useQuery({
    queryKey: ['pricing', 'variants'],
    queryFn: () => api.get<VariantListApi>('/api/products/variants?take=200'),
    enabled: newSpecialOpen || editTarget !== null,
  });

  const removeSpecial = useMutation({
    mutationFn: (id: string) => api.delete(`/api/pricing/specials/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customerSpecials'] }),
  });

  const lists = (listsQuery.data?.items ?? []).map(mapPriceList);
  const specials = (specialsQuery.data?.items ?? []).map(mapSpecial);

  const customerOpts = (customersQuery.data?.items ?? []).map((c) => ({
    id: c.id,
    label: c.tradingName ?? c.legalName,
  }));
  const variantOpts = (variantsQuery.data?.items ?? []).map((v) => ({
    id: v.id,
    label: `${v.sku} — ${v.productName} (${v.label})`,
  }));

  const actionNode = (
    <div>
      {activeTab === 'listas' && (
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setNewListOpen(true)}>
          Nova lista
        </Button>
      )}
      {activeTab === 'specials' && (
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setNewSpecialOpen(true)}>
          Novo special
        </Button>
      )}
    </div>
  );

  return (
    <section className="space-y-6">
      <PageHeader
        title="Preços"
        subtitle="Listas de preços, descontos por escalão e preços especiais por florista"
        action={actionNode}
      />

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'listas' && (
        <div>
          {listsQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-neutral-500">A carregar…</div>
          ) : listsQuery.error ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {(listsQuery.error as ApiError).message}
            </div>
          ) : (
            <PriceListsTable lists={lists} />
          )}
        </div>
      )}

      {activeTab === 'specials' && (
        <div>
          {specialsQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-neutral-500">A carregar…</div>
          ) : specialsQuery.error ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {(specialsQuery.error as ApiError).message}
            </div>
          ) : (
            <SpecialPricesTable
              specials={specials}
              onEdit={(s) => setEditTarget(s)}
              onRemove={(id) => removeSpecial.mutate(id)}
            />
          )}
        </div>
      )}

      {activeTab === 'resolver' && (
        <div className="space-y-4">
          <div className="rounded-control border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm text-blue-800">
              <strong>Resolver preço</strong> — calcula o preço aplicável para uma combinação de
              variante, quantidade e florista, respeitando a hierarquia: override manual → preço
              especial → lista de preços por escalão.
            </p>
          </div>
          <PriceResolverSidebar />
        </div>
      )}

      <NewPriceListModal open={newListOpen} onClose={() => setNewListOpen(false)} />

      <Modal
        open={newSpecialOpen}
        onClose={() => setNewSpecialOpen(false)}
        title="Novo preço especial"
        size="md"
      >
        <SpecialPriceForm
          mode="create"
          customers={customerOpts}
          variants={variantOpts}
          onSuccess={() => setNewSpecialOpen(false)}
        />
      </Modal>

      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Editar preço especial"
        size="md"
      >
        {editTarget && (
          <SpecialPriceForm
            mode="edit"
            special={{
              id: editTarget.id,
              customerId: editTarget.customerId,
              variantId: editTarget.variantId,
              unitPriceEur: editTarget.unitPriceEur,
              validFrom: editTarget.validFrom,
              validUntil: editTarget.validUntil,
              reason: editTarget.reason,
            }}
            customers={customerOpts}
            variants={variantOpts}
            onSuccess={() => setEditTarget(null)}
          />
        )}
      </Modal>
    </section>
  );
}
