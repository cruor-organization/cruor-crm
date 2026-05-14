/**
 * Rota /pricing — Módulo de preços.
 * Três tabs: Listas, Specials, Resolver.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { PriceListsTable } from '@/components/pricing/PriceListsTable';
import { PriceResolverSidebar } from '@/components/pricing/PriceResolverSidebar';
import { SpecialPricesTable } from '@/components/pricing/SpecialPricesTable';
import { Button } from '@/components/ui/Button';
import { Field, inputCls } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { mockFetch } from '@/lib/mock-api';
import {
  mockPriceLists,
  mockCustomerSpecials,
  type MockCustomerSpecialPrice,
  type PricingTier,
} from '@/lib/mock-data/pricing';
import { mockVariants } from '@/lib/mock-data/pricing';

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
});

const TABS = [
  { id: 'listas', label: 'Listas de preços' },
  { id: 'specials', label: 'Preços especiais' },
  { id: 'resolver', label: 'Resolver preço' },
];

const TIER_OPTIONS: { value: PricingTier; label: string }[] = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PROFESSIONAL', label: 'Profissional' },
  { value: 'KEY_ACCOUNT', label: 'Key Account' },
  { value: 'DISTRIBUTOR', label: 'Distribuidor' },
];

const MOCK_CUSTOMERS = [
  { value: 'cust-ramos-flores', label: 'Ramos & Flores' },
  { value: 'cust-orquidea-dourada', label: 'Orquídea Dourada' },
  { value: 'cust-sol-e-flor', label: 'Sol e Flor' },
  { value: 'cust-jardim-encantado', label: 'Jardim Encantado' },
  { value: 'cust-rosa-perfeita', label: 'Rosa Perfeita' },
  { value: 'cust-flores-do-vale', label: 'Flores do Vale' },
];

const variantOptions = mockVariants.map((v) => ({
  value: v.id,
  label: `${v.sku} — ${v.productName} (${v.name})`,
}));

// ---------------------------------------------------------------------------
// Modal: Nova lista de preços
// ---------------------------------------------------------------------------
function NewPriceListModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [tier, setTier] = useState<PricingTier>('STANDARD');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [saving, setSaving] = useState(false);

  function handleSubmit() {
    if (!name || !validFrom) {
      alert('Nome e data de início são obrigatórios.');
      return;
    }
    setSaving(true);
    const payload = { name, tier, currency: 'EUR', validFrom, validUntil: validUntil || null };
    console.info('[PriceList] criar lista', payload);
    setTimeout(() => {
      setSaving(false);
      void qc.invalidateQueries({ queryKey: ['priceLists'] });
      onClose();
      alert('Lista criada (simulação).');
    }, 500);
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova lista de preços" size="md">
      <div className="space-y-4">
        <Field label="Nome" required>
          <input
            className={inputCls}
            placeholder="ex.: B2B Florista 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Escalão" required>
          <Select
            value={tier}
            onChange={(e) => setTier(e.target.value as PricingTier)}
            options={TIER_OPTIONS}
          />
        </Field>
        <Field label="Moeda">
          <input className={inputCls} value="EUR" disabled />
        </Field>
        <Field label="Válida de" required>
          <input
            type="date"
            className={inputCls}
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
          />
        </Field>
        <Field label="Válida até">
          <input
            type="date"
            className={inputCls}
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={saving} onClick={handleSubmit}>
            Criar lista
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Modal: Novo preço especial
// ---------------------------------------------------------------------------
function NewSpecialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [saving, setSaving] = useState(false);

  function handleSubmit() {
    if (!customerId || !variantId || !unitPrice || !validFrom) {
      alert('Florista, variante, preço e data de início são obrigatórios.');
      return;
    }
    setSaving(true);
    const payload = {
      customerId,
      variantId,
      unitPriceEur: parseFloat(unitPrice),
      validFrom,
      validUntil: validUntil || null,
    };
    console.info('[SpecialPrice] criar special', payload);
    setTimeout(() => {
      setSaving(false);
      void qc.invalidateQueries({ queryKey: ['customerSpecials'] });
      onClose();
      alert('Preço especial criado (simulação).');
    }, 500);
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo preço especial" size="md">
      <div className="space-y-4">
        <Field label="Florista" required>
          <Select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="Selecciona florista…"
            options={MOCK_CUSTOMERS}
          />
        </Field>
        <Field label="Variante" required>
          <Select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            placeholder="Selecciona variante…"
            options={variantOptions}
          />
        </Field>
        <Field label="Preço unitário (€)" required>
          <input
            type="number"
            className={inputCls}
            placeholder="0,00"
            value={unitPrice}
            step={0.01}
            min={0}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </Field>
        <Field label="Válido de" required>
          <input
            type="date"
            className={inputCls}
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
          />
        </Field>
        <Field label="Válido até">
          <input
            type="date"
            className={inputCls}
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={saving} onClick={handleSubmit}>
            Criar special
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
function PricingPage() {
  const [activeTab, setActiveTab] = useState('listas');
  const [newListOpen, setNewListOpen] = useState(false);
  const [newSpecialOpen, setNewSpecialOpen] = useState(false);
  const [specials, setSpecials] = useState<MockCustomerSpecialPrice[]>(mockCustomerSpecials);

  const { data: priceLists, isLoading: loadingLists } = useQuery({
    queryKey: ['priceLists'],
    queryFn: () => mockFetch(mockPriceLists),
  });

  const { data: specialsData, isLoading: loadingSpecials } = useQuery({
    queryKey: ['customerSpecials'],
    queryFn: () => mockFetch(mockCustomerSpecials),
  });

  function handleRemoveSpecial(id: string) {
    setSpecials((prev) => prev.filter((s) => s.id !== id));
  }

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
          {loadingLists ? (
            <div className="py-8 text-center text-sm text-neutral-500">A carregar…</div>
          ) : (
            <PriceListsTable lists={priceLists ?? []} />
          )}
        </div>
      )}

      {activeTab === 'specials' && (
        <div>
          {loadingSpecials ? (
            <div className="py-8 text-center text-sm text-neutral-500">A carregar…</div>
          ) : (
            <SpecialPricesTable
              specials={specialsData ?? specials}
              onEdit={(s) => {
                console.info('[SpecialPrice] editar (modal não implementado)', s);
                alert(
                  `Editar preço especial de "${s.customerName}" — funcionalidade de edição em desenvolvimento.`,
                );
              }}
              onRemove={handleRemoveSpecial}
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
      <NewSpecialModal open={newSpecialOpen} onClose={() => setNewSpecialOpen(false)} />
    </section>
  );
}
