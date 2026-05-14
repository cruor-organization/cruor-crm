/**
 * Editor inline de linhas de uma lista de preços.
 * Todas as mutações são simuladas (console.info + toast via alert).
 */
import { Trash2, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Field, inputCls } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { mockVariants, type MockPriceListLine, type DiscountBreak } from '@/lib/mock-data/pricing';

interface PriceListLinesEditorProps {
  priceListId: string;
  lines: MockPriceListLine[];
}

function fmtPrice(v: number) {
  return v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function variantLabel(variantId: string): string {
  const v = mockVariants.find((x) => x.id === variantId);
  return v ? `${v.productName} — ${v.name}` : variantId;
}

function variantSku(variantId: string): string {
  const v = mockVariants.find((x) => x.id === variantId);
  return v ? v.sku : variantId;
}

// Modal para editar discount breaks de uma linha
function BreaksModal({
  open,
  onClose,
  breaks,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  breaks: DiscountBreak[];
  onSave: (breaks: DiscountBreak[]) => void;
}) {
  const [local, setLocal] = useState<DiscountBreak[]>(breaks);

  function addBreak() {
    setLocal((prev) => [...prev, { minQty: 0, discountPct: 0 }]);
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

        <div className="flex justify-end gap-2 border-t pt-3 mt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave(local);
              onClose();
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Linha da tabela — editável
function LineRow({
  line,
  onDelete,
  onSave,
}: {
  line: MockPriceListLine;
  onDelete: () => void;
  onSave: (updated: MockPriceListLine) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(line.unitPriceEur));
  const [minQty, setMinQty] = useState(String(line.minQty));
  const [breaksOpen, setBreaksOpen] = useState(false);
  const [breaks, setBreaks] = useState<DiscountBreak[]>(line.discountBreaks);

  function handleSave() {
    const updated: MockPriceListLine = {
      ...line,
      unitPriceEur: parseFloat(price),
      minQty: parseInt(minQty, 10),
      discountBreaks: breaks,
    };
    console.info('[PriceListLine] guardar linha', updated);
    onSave(updated);
    setEditing(false);
    alert('Linha guardada (simulação).');
  }

  function handleDelete() {
    if (!confirm('Remover esta linha?')) return;
    console.info('[PriceListLine] remover linha', line.id);
    onDelete();
  }

  return (
    <>
      <tr className="divide-x divide-neutral-100 hover:bg-neutral-50">
        <td className="px-3 py-2 font-mono text-xs text-neutral-500">
          {variantSku(line.variantId)}
        </td>
        <td className="px-3 py-2 text-sm text-neutral-800">{variantLabel(line.variantId)}</td>
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
            <span className="text-sm">{fmtPrice(line.unitPriceEur)} €</span>
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
          <Button variant="ghost" size="sm" onClick={() => setBreaksOpen(true)}>
            {breaks.length === 0
              ? 'Sem quebras'
              : `${breaks.length} quebra${breaks.length > 1 ? 's' : ''}`}
          </Button>
        </td>
        <td className="px-3 py-2">
          <div className="flex justify-end gap-1">
            {editing ? (
              <>
                <Button variant="primary" size="sm" onClick={handleSave}>
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
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      <BreaksModal
        open={breaksOpen}
        onClose={() => setBreaksOpen(false)}
        breaks={breaks}
        onSave={(newBreaks) => {
          setBreaks(newBreaks);
          console.info('[PriceListLine] breaks actualizados', newBreaks);
        }}
      />
    </>
  );
}

// Formulário de nova linha
function AddLineRow({
  priceListId,
  onAdd,
}: {
  priceListId: string;
  onAdd: (line: MockPriceListLine) => void;
}) {
  const [variantId, setVariantId] = useState('');
  const [price, setPrice] = useState('');
  const [minQty, setMinQty] = useState('1');
  const [error, setError] = useState('');

  const variantOptions = mockVariants.map((v) => ({
    value: v.id,
    label: `${v.sku} — ${v.productName} (${v.name})`,
  }));

  function handleAdd() {
    if (!variantId || !price) {
      setError('Variante e preço são obrigatórios.');
      return;
    }
    const unitPrice = parseFloat(price);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      setError('Preço inválido.');
      return;
    }
    const newLine: MockPriceListLine = {
      id: `pll-new-${Date.now()}`,
      organizationId: 'org-demo-01',
      priceListId,
      variantId,
      unitPriceEur: unitPrice,
      minQty: parseInt(minQty, 10) || 1,
      discountBreaks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.info('[PriceListLine] adicionar linha', newLine);
    onAdd(newLine);
    setVariantId('');
    setPrice('');
    setMinQty('1');
    setError('');
    alert('Linha adicionada (simulação).');
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
        <Button variant="primary" size="sm" onClick={handleAdd}>
          Adicionar
        </Button>
      </td>
    </tr>
  );
}

export function PriceListLinesEditor({
  priceListId,
  lines: initialLines,
}: PriceListLinesEditorProps) {
  const [lines, setLines] = useState<MockPriceListLine[]>(initialLines);
  const [showAddRow, setShowAddRow] = useState(false);

  function handleDelete(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function handleSave(updated: MockPriceListLine) {
    setLines((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  function handleAdd(newLine: MockPriceListLine) {
    setLines((prev) => [...prev, newLine]);
    setShowAddRow(false);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
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
              <LineRow
                key={line.id}
                line={line}
                onDelete={() => handleDelete(line.id)}
                onSave={handleSave}
              />
            ))}
            {showAddRow && <AddLineRow priceListId={priceListId} onAdd={handleAdd} />}
            {lines.length === 0 && !showAddRow && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">
                  Sem linhas de preço. Clica em "Adicionar linha".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!showAddRow && (
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
