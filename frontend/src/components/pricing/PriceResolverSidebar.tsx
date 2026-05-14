/**
 * Painel de resolução de preços — simula a hierarquia do backend §10.15.
 */
import { Calculator } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, inputCls } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { mockVariants } from '@/lib/mock-data/pricing';
import {
  resolvePrice,
  PriceError,
  type ResolvedPrice,
  type PriceResolutionSource,
} from '@/lib/mock-resolve-price';

const SOURCE_LABEL: Record<PriceResolutionSource, string> = {
  OVERRIDE: 'Override manual',
  CUSTOMER_SPECIAL: 'Preço especial',
  TIER_LIST: 'Lista de preços',
};

const SOURCE_VARIANT: Record<PriceResolutionSource, 'warning' | 'info' | 'success'> = {
  OVERRIDE: 'warning',
  CUSTOMER_SPECIAL: 'info',
  TIER_LIST: 'success',
};

function fmtPrice(v: number) {
  return v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Clientes únicos extraídos dos specials (inclui alguns fixed para ter uma lista útil)
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

export function PriceResolverSidebar() {
  const [customerId, setCustomerId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState('');
  const [overrideUnit, setOverrideUnit] = useState('');

  const [result, setResult] = useState<ResolvedPrice | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState('');

  function handleResolve() {
    setResult(null);
    setErrorMsg('');
    setErrorCode('');

    if (!variantId) {
      setErrorCode('VALIDATION');
      setErrorMsg('Selecciona uma variante.');
      return;
    }
    const qtyNum = parseInt(qty, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorCode('VALIDATION');
      setErrorMsg('Quantidade tem de ser um inteiro positivo.');
      return;
    }

    try {
      const resolved = resolvePrice({
        variantId,
        qty: qtyNum,
        customerId: customerId || undefined,
        overrideUnitEur: overrideUnit ? parseFloat(overrideUnit) : undefined,
      });
      setResult(resolved);
    } catch (err) {
      if (err instanceof PriceError) {
        setErrorCode(err.code);
        setErrorMsg(err.message);
      } else {
        setErrorCode('UNKNOWN');
        setErrorMsg('Erro inesperado.');
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Formulário */}
      <Card className="flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-cruor-600" />
          <h3 className="text-sm font-semibold text-neutral-900">Parâmetros</h3>
        </div>

        <Field label="Florista (opcional)">
          <Select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="Sem florista (preço de lista)"
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

        <Button className="w-full" onClick={handleResolve}>
          Resolver
        </Button>
      </Card>

      {/* Resultado */}
      <Card className="flex-1">
        <h3 className="mb-4 text-sm font-semibold text-neutral-900">Resultado</h3>

        {!result && !errorMsg && (
          <p className="text-sm text-neutral-400">
            Preenche os parâmetros e clica em "Resolver" para calcular o preço aplicável.
          </p>
        )}

        {errorMsg && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-1">
              {errorCode}
            </p>
            <p className="text-sm text-red-800">{errorMsg}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Fonte:</span>
              <Badge variant={SOURCE_VARIANT[result.source]}>{SOURCE_LABEL[result.source]}</Badge>
            </div>

            <dl className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-neutral-50 p-3">
                <dt className="text-xs text-neutral-500">Preço unitário</dt>
                <dd className="mt-1 text-xl font-semibold text-neutral-900">
                  {fmtPrice(result.unitPriceEur)} €
                </dd>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3">
                <dt className="text-xs text-neutral-500">Desconto aplicado</dt>
                <dd className="mt-1 text-xl font-semibold text-neutral-900">
                  {(result.appliedDiscountPct * 100).toFixed(0)} %
                </dd>
              </div>
              <div className="col-span-2 rounded-lg bg-cruor-50 p-3">
                <dt className="text-xs text-cruor-700">Total da linha</dt>
                <dd className="mt-1 text-2xl font-bold text-cruor-800">
                  {fmtPrice(result.lineTotalEur)} €
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Card>
    </div>
  );
}
