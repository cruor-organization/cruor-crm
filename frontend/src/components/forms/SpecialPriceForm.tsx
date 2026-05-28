import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Field, inputCls } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { api } from '@/lib/api';
import { useFormSubmit } from '@/lib/forms/useFormSubmit';
import {
  createSpecialPriceSchema,
  updateSpecialPriceSchema,
  type CreateSpecialPriceInput,
} from '@/lib/schemas/pricing';

interface CustomerOption {
  id: string;
  label: string;
}
interface VariantOption {
  id: string;
  label: string;
}

interface SpecialPriceData {
  id: string;
  customerId: string;
  variantId: string;
  unitPriceEur: string | number;
  validFrom: string;
  validUntil: string | null;
  reason: string | null;
}

interface SpecialPriceFormProps {
  mode: 'create' | 'edit';
  special?: SpecialPriceData;
  customers: CustomerOption[];
  variants: VariantOption[];
  onSuccess?: () => void;
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function SpecialPriceForm({
  mode,
  special,
  customers,
  variants,
  onSuccess,
}: SpecialPriceFormProps) {
  type FormValues = CreateSpecialPriceInput;

  const form = useForm<FormValues>({
    resolver: zodResolver(mode === 'create' ? createSpecialPriceSchema : updateSpecialPriceSchema),
    defaultValues:
      mode === 'edit' && special
        ? {
            customerId: special.customerId,
            variantId: special.variantId,
            unitPriceEur: Number(special.unitPriceEur),
            validFrom: toDateInput(special.validFrom),
            validUntil: toDateInput(special.validUntil),
            reason: special.reason ?? '',
          }
        : {
            customerId: '',
            variantId: '',
            validFrom: new Date().toISOString().slice(0, 10),
          },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const mutationFn = async (data: FormValues) => {
    const payload: Record<string, unknown> = {
      unitPriceEur: data.unitPriceEur,
      validFrom: data.validFrom,
    };
    if (data.validUntil) payload.validUntil = data.validUntil;
    if (data.reason?.trim()) payload.reason = data.reason.trim();

    if (mode === 'create') {
      payload.customerId = data.customerId;
      payload.variantId = data.variantId;
      return api.post('/api/pricing/specials', payload);
    }
    return api.patch(`/api/pricing/specials/${special!.id}`, payload);
  };

  const { submit, isLoading, generalError } = useFormSubmit<FormValues, unknown>(form, mutationFn, {
    onSuccess,
    invalidateKeys: [['customerSpecials']],
  });

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {generalError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{generalError}</div>
      )}

      <Field label="Florista" required error={errors.customerId?.message}>
        <Select
          {...register('customerId')}
          disabled={mode === 'edit'}
          placeholder="— selecionar —"
          options={customers.map((c) => ({ value: c.id, label: c.label }))}
        />
      </Field>

      <Field label="Variante" required error={errors.variantId?.message}>
        <Select
          {...register('variantId')}
          disabled={mode === 'edit'}
          placeholder="— selecionar —"
          options={variants.map((v) => ({ value: v.id, label: v.label }))}
        />
      </Field>

      <Field label="Preço unitário (€)" required error={errors.unitPriceEur?.message}>
        <input
          {...register('unitPriceEur')}
          type="number"
          step="0.01"
          min="0"
          className={inputCls}
          placeholder="0,00"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Válido de" required error={errors.validFrom?.message}>
          <input {...register('validFrom')} type="date" className={inputCls} />
        </Field>
        <Field label="Válido até" error={errors.validUntil?.message}>
          <input {...register('validUntil')} type="date" className={inputCls} />
        </Field>
      </div>

      <Field label="Motivo" error={errors.reason?.message}>
        <Textarea
          {...register('reason')}
          rows={2}
          placeholder="ex.: Acordo anual — volume garantido"
        />
      </Field>

      <div className="flex justify-end gap-2 border-t pt-3">
        <Button type="submit" loading={isLoading}>
          {mode === 'create' ? 'Criar special' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
