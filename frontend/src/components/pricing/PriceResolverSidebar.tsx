/**
 * Painel de resolução de preços — chama POST /api/pricing/resolve.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { Calculator } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, inputCls } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { api, type ApiError } from '@/lib/api';

type Source = 'CUSTOMER_SPECIAL' | 'TIER_LIST' | 'OVERRIDE';

interface ResolvedPrice {
  unitPriceEur: number;
  appliedDiscountPct: number;
  lineTotalEur: number;
  source: Source;
}

interface CustomerOpt {
  id: string;
  legalName: string;
  tradingName: string | null;
}
interface VariantOpt {
  id: string;
  sku: string;
  label: string;
  productName: string;
}

const SOURCE_LABEL: Record<Source, string> = {
  OVERRIDE: 'Override manual',
  CUSTOMER_SPECIAL: 'Preço especial',
  TIER_LIST: 'Lista de preços',
};

const SOURCE_VARIANT: Record<Source, 'warning' | 'info' | 'success'> = {
  OVERRIDE: 'warning',
  CUSTOMER_SPECIAL: 'info',
  TIER_LIST: 'success',
};

function fmtPrice(v: number) {
  return v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PriceResolverSidebar() {
  const [customerId, setCustomerId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState('');
  const [overrideUnit, setOverrideUnit] = useState('');
  const [validation, setValidation] = useState('');

  const customersQuery = useQuery({
    queryKey: ['pricing', 'customers'],
    queryFn: () => api.get<{ items: CustomerOpt[] }>('/api/customers?take=100'),
  });
  const variantsQuery = useQuery({
    queryKey: ['pricing', 'variants'],
    queryFn: () => api.get<{ items: VariantOpt[] }>('/api/products/variants?take=200'),
  });

  const resolve = useMutation({
    mutationFn: (body: {
      variantId: string;
      qty: number;
      customerId?: string;
      override?: number;
    }) => api.post<ResolvedPrice>('/api/pricing/resolve', body),
  });

  function handleResolve() {
    setValidation('');
    if (!variantId) {
      setValidation('Selecciona uma variante.');
      return;
    }
    const qtyNum = parseInt(qty, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setValidation('Quantidade tem de ser um inteiro positivo.');
      return;
    }
    if (!customerId) {
      setValidation('Selecciona um florista (para inferir o escalão).');
      return;
    }
    const body: { variantId: string; qty: number; customerId?: string; override?: number } = {
      variantId,
      qty: qtyNum,
      customerId,
    };
    if (overrideUnit) {
      const o = parseFloat(overrideUnit);
      if (!isNaN(o) && o > 0) body.override = o;
    }
    resolve.mutate(body);
  }

  const apiError = resolve.error as ApiError | null;
  const customerOptions = (customersQuery.data?.items ?? []).map((c) => ({
    value: c.id,
    label: c.tradingName ?? c.legalName,
  }));
  const variantOptions = (variantsQuery.data?.items ?? []).map((v) => ({
    value: v.id,
    label: `${v.sku} — ${v.productName} (${v.label})`,
  }));

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <Card className="flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-cruor-600" />
          <h3 className="text-sm font-semibold text-neutral-900">Parâmetros</h3>
        </div>

        <Field label="Florista" required>
          <Select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="Selecciona florista…"
            options={customerOptions}
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

        <Field label="Quantidade" required>
          <input
            type="number"
            className={inputCls}
            placeholder="ex.: 10"
            value={qty}
            min={1}
            step={1}
            onChange={(e) => setQty(e.target.value)}
          />
        </Field>

        <Field label="Override de preço unitário (€)">
          <input
            type="number"
            className={inputCls}
            placeholder="Opcional — sobrepõe lista e special"
            value={overrideUnit}
            min={0}
            step={0.01}
            onChange={(e) => setOverrideUnit(e.target.value)}
          />
          <p className="mt-1 text-xs text-neutral-400">
            Deve ser ≥ custo × 1,10. Se definido, ignora specials e listas.
          </p>
        </Field>

        <Button className="w-full" loading={resolve.isPending} onClick={handleResolve}>
          Resolver
        </Button>
      </Card>

      <Card className="flex-1">
        <h3 className="mb-4 text-sm font-semibold text-neutral-900">Resultado</h3>

        {!resolve.data && !apiError && !validation && (
          <p className="text-sm text-neutral-400">
            Preenche os parâmetros e clica em "Resolver" para calcular o preço aplicável.
          </p>
        )}

        {validation && (
          <div className="rounded-control border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">{validation}</p>
          </div>
        )}

        {apiError && (
          <div className="rounded-control border border-red-200 bg-red-50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-700">
              {apiError.code}
            </p>
            <p className="text-sm text-red-800">{apiError.message}</p>
          </div>
        )}

        {resolve.data && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Fonte:</span>
              <Badge variant={SOURCE_VARIANT[resolve.data.source]}>
                {SOURCE_LABEL[resolve.data.source]}
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-4">
              <div className="rounded-control bg-neutral-50 p-3">
                <dt className="text-xs text-neutral-500">Preço unitário</dt>
                <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-neutral-900">
                  {fmtPrice(resolve.data.unitPriceEur)} €
                </dd>
              </div>
              <div className="rounded-control bg-neutral-50 p-3">
                <dt className="text-xs text-neutral-500">Desconto aplicado</dt>
                <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-neutral-900">
                  {(resolve.data.appliedDiscountPct * 100).toFixed(0)} %
                </dd>
              </div>
              <div className="col-span-2 rounded-control bg-cruor-50 p-3">
                <dt className="text-xs text-cruor-700">Total da linha</dt>
                <dd className="mt-1 font-mono text-2xl font-bold tabular-nums text-cruor-800">
                  {fmtPrice(resolve.data.lineTotalEur)} €
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Card>
    </div>
  );
}
