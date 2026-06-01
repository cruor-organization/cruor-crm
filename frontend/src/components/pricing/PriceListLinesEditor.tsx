/**
 * Editor inline de linhas de uma lista de preços.
 * Mutações via /api/pricing/lists/:id/lines e /api/pricing/lines/:lineId.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Field, inputCls } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { api, type ApiError } from '@/lib/api';

export interface PriceListLineApi {
  id: string;
  variantId: string;
  unitPriceEur: string;
  minQty: number;
  discountBreaks: { minQty: number; discountPct: number }[];
  variant: { id: string; sku: string; label: string; product: { name: string } };
}

interface VariantApi {
  id: string;
  sku: string;
  label: string;
  productId: string;
  productName: string;
  costEur: string | null;
}

interface PriceListLinesEditorProps {
  priceListId: string;
  lines: PriceListLineApi[];
  readOnly?: boolean;
}

interface DiscountBreak {
  minQty: number;
  discountPct: number;
}

function fmtPrice(v: number) {
  return v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function apiErrorMessage(err: unknown): string {
  const e = err as ApiError | undefined;
  return e?.message ?? 'Erro inesperado.';
}

// ---------- Modal de quebras ----------

function BreaksModal({
  open,
  onClose,
  breaks,
  onSave,
  saving,
  error,
}: {
  open: boolean;
  onClose: () => void;
  breaks: DiscountBreak[];
  onSave: (breaks: DiscountBreak[]) => void;
  saving: boolean;
  error: string | null;
}) {
  const [local, setLocal] = useState<DiscountBreak[]>(breaks);

  function addBreak() {
    setLocal((prev) => [...prev, { minQty: 1, discountPct: 0 }]);
  }
  function removeBreak(idx: number) {
    setLocal((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateBreak(idx: number, field: keyof DiscountBreak, value: string) {
    setLocal((prev) =>
      prev.map((b, i) =>
        i === idx
          ? { ...b, [field]: field === 'discountPct' ? parseFloat(value) : parseInt(value, 10) }
          : b,
      ),
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Quebras de desconto" size="md">
      <div className="space-y-3">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}
        {local.length === 0 && <p className="text-sm text-neutral-500">Sem quebras definidas.</p>}
        {local.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <Field label="Qtd. mín.">
                <input
                  type="number"
                  className={inputCls}
                  value={b.minQty}
                  min={1}
                  onChange={(e) => updateBreak(i, 'minQty', e.target.value)}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Desconto (0–0.30)">
                <input
                  type="number"
                  className={inputCls}
                  value={b.discountPct}
                  step={0.01}
                  min={0}
                  max={0.3}
                  onChange={(e) => updateBreak(i, 'discountPct', e.target.value)}
                />
              </Field>
            </div>
            <button
              type="button"
              className="mt-5 rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
              onClick={() => removeBreak(i)}
              title="Remover quebra"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <Button
          variant="secondary"
          size="sm"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={addBreak}
        >
          Adicionar quebra
        </Button>

        <div className="mt-3 flex justify-end gap-2 border-t pt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={saving} onClick={() => onSave(local)}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- LineRow ----------

function LineRow({
  line,
  priceListId,
  readOnly,
}: {
  line: PriceListLineApi;
  priceListId: string;
  readOnly: boolean;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(line.unitPriceEur));
  const [minQty, setMinQty] = useState(String(line.minQty));
  const [breaksOpen, setBreaksOpen] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['priceListLines', priceListId] });

  const updateLine = useMutation({
    mutationFn: (data: {
      unitPriceEur?: number;
      minQty?: number;
      discountBreaks?: DiscountBreak[];
    }) => api.patch(`/api/pricing/lines/${line.id}`, data),
    onSuccess: invalidate,
  });

  const deleteLine = useMutation({
    mutationFn: () => api.delete(`/api/pricing/lines/${line.id}`),
    onSuccess: invalidate,
  });

  function handleSave() {
    updateLine.mutate(
      {
        unitPriceEur: parseFloat(price),
        minQty: parseInt(minQty, 10),
      },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handleDelete() {
    if (!confirm('Remover esta linha?')) return;
    deleteLine.mutate();
  }

  return (
    <>
      <tr className="divide-x divide-neutral-100 hover:bg-neutral-50">
        <td className="px-3 py-2 font-mono text-xs text-neutral-500">{line.variant.sku}</td>
        <td className="px-3 py-2 text-sm text-neutral-800">
          {line.variant.product.name} — {line.variant.label}
        </td>
        <td className="px-3 py-2 text-right">
          {editing ? (
            <input
              type="number"
              className="w-24 rounded border border-neutral-300 px-2 py-1 text-right text-sm"
              value={price}
              step={0.01}
              min={0}
              onChange={(e) => setPrice(e.target.value)}
            />
          ) : (
            <span className="text-sm">{fmtPrice(Number(line.unitPriceEur))} €</span>
          )}
        </td>
        <td className="px-3 py-2 text-right">
          {editing ? (
            <input
              type="number"
              className="w-16 rounded border border-neutral-300 px-2 py-1 text-right text-sm"
              value={minQty}
              min={1}
              onChange={(e) => setMinQty(e.target.value)}
            />
          ) : (
            <span className="text-sm">{line.minQty}</span>
          )}
        </td>
        <td className="px-3 py-2 text-center">
          <Button variant="ghost" size="sm" disabled={readOnly} onClick={() => setBreaksOpen(true)}>
            {line.discountBreaks.length === 0
              ? 'Sem quebras'
              : `${line.discountBreaks.length} quebra${line.discountBreaks.length > 1 ? 's' : ''}`}
          </Button>
        </td>
        <td className="px-3 py-2">
          <div className="flex justify-end gap-1">
            {readOnly ? (
              <span className="text-xs italic text-neutral-400">lista arquivada</span>
            ) : editing ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  loading={updateLine.isPending}
                  onClick={handleSave}
                >
                  Guardar
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  Editar
                </Button>
                <button
                  type="button"
                  className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  onClick={handleDelete}
                  title="Remover linha"
                  disabled={deleteLine.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
          {(updateLine.error || deleteLine.error) && (
            <p className="mt-1 text-right text-xs text-red-600">
              {apiErrorMessage(updateLine.error ?? deleteLine.error)}
            </p>
          )}
        </td>
      </tr>

      <BreaksModal
        open={breaksOpen}
        onClose={() => setBreaksOpen(false)}
        breaks={line.discountBreaks}
        saving={updateLine.isPending}
        error={updateLine.error ? apiErrorMessage(updateLine.error) : null}
        onSave={(newBreaks) =>
          updateLine.mutate(
            { discountBreaks: newBreaks },
            { onSuccess: () => setBreaksOpen(false) },
          )
        }
      />
    </>
  );
}

// ---------- AddLineRow ----------

function AddLineRow({
  priceListId,
  variants,
  onDone,
}: {
  priceListId: string;
  variants: VariantApi[];
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [variantId, setVariantId] = useState('');
  const [price, setPrice] = useState('');
  const [minQty, setMinQty] = useState('1');
  const [error, setError] = useState('');

  const variantOptions = variants.map((v) => ({
    value: v.id,
    label: `${v.sku} — ${v.productName} (${v.label})`,
  }));

  const createLine = useMutation({
    mutationFn: (data: { variantId: string; unitPriceEur: number; minQty: number }) =>
      api.post(`/api/pricing/lists/${priceListId}/lines`, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['priceListLines', priceListId] });
      onDone();
    },
    onError: (err: unknown) => setError(apiErrorMessage(err)),
  });

  function handleAdd() {
    setError('');
    if (!variantId || !price) {
      setError('Variante e preço são obrigatórios.');
      return;
    }
    const unitPrice = parseFloat(price);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      setError('Preço inválido.');
      return;
    }
    createLine.mutate({
      variantId,
      unitPriceEur: unitPrice,
      minQty: parseInt(minQty, 10) || 1,
    });
  }

  return (
    <tr className="bg-cruor-50">
      <td colSpan={4} className="px-3 py-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              placeholder="Selecciona variante…"
              options={variantOptions}
            />
          </div>
          <input
            type="number"
            className="w-28 rounded border border-neutral-300 px-2 py-2 text-sm"
            placeholder="Preço €"
            value={price}
            step={0.01}
            min={0}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input
            type="number"
            className="w-20 rounded border border-neutral-300 px-2 py-2 text-sm"
            placeholder="Min. qtd"
            value={minQty}
            min={1}
            onChange={(e) => setMinQty(e.target.value)}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
      <td className="px-3 py-2" />
      <td className="px-3 py-2">
        <Button variant="primary" size="sm" loading={createLine.isPending} onClick={handleAdd}>
          Adicionar
        </Button>
      </td>
    </tr>
  );
}

// ---------- Editor principal ----------

export function PriceListLinesEditor({
  priceListId,
  lines,
  readOnly = false,
}: PriceListLinesEditorProps) {
  const [showAddRow, setShowAddRow] = useState(false);

  const variantsQuery = useQuery({
    queryKey: ['pricing', 'variants'],
    queryFn: () => api.get<{ items: VariantApi[] }>('/api/products/variants?take=200'),
    enabled: showAddRow,
  });

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-card border border-neutral-200 bg-surface shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Variante</th>
              <th className="px-3 py-2 text-right">Preço unit. (€)</th>
              <th className="px-3 py-2 text-right">Min. qtd</th>
              <th className="px-3 py-2 text-center">Quebras</th>
              <th className="px-3 py-2 text-right">Acções</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {lines.map((line) => (
              <LineRow key={line.id} line={line} priceListId={priceListId} readOnly={readOnly} />
            ))}
            {showAddRow && !readOnly && (
              <AddLineRow
                priceListId={priceListId}
                variants={variantsQuery.data?.items ?? []}
                onDone={() => setShowAddRow(false)}
              />
            )}
            {lines.length === 0 && !showAddRow && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">
                  Sem linhas de preço.{' '}
                  {readOnly ? 'Lista arquivada.' : 'Clica em "Adicionar linha".'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!showAddRow && !readOnly && (
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setShowAddRow(true)}
        >
          Adicionar linha
        </Button>
      )}
    </div>
  );
}
