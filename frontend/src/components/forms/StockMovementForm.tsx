import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Field, inputCls } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { api } from '@/lib/api';
import { useFormSubmit } from '@/lib/forms/useFormSubmit';
import {
  createStockMovementSchema,
  movementCreateKindValues,
  type CreateStockMovementInput,
} from '@/lib/schemas/stock';

interface StockLocation {
  id: string;
  code: string;
  name: string;
}

interface StockLocationList {
  items: StockLocation[];
  total: number;
}

interface StockMovementFormProps {
  onSuccess?: () => void;
}

/** Só os kinds aceites em POST /stock/movements (RESERVE/RELEASE/TRANSFER_* têm endpoints próprios) */
const KIND_LABELS: Record<string, string> = {
  IN: 'Entrada',
  OUT: 'Saída',
  ADJUST: 'Ajuste',
  RETURN: 'Devolução',
};

const DIRECTION_LABELS: Record<string, string> = {
  UP: 'Aumentar (UP)',
  DOWN: 'Diminuir (DOWN)',
};

export function StockMovementForm({ onSuccess }: StockMovementFormProps) {
  const { data: locationsData } = useQuery({
    queryKey: ['stock', 'locations'],
    queryFn: () => api.get<StockLocationList>('/api/stock/locations'),
  });

  const form = useForm<CreateStockMovementInput>({
    resolver: zodResolver(createStockMovementSchema),
    defaultValues: {
      kind: 'IN',
      qty: 1,
      refType: 'NONE',
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  const kind = watch('kind');

  const mutationFn = async (data: CreateStockMovementInput) => {
    const payload: Record<string, unknown> = { ...data };

    // direction só é relevante (e obrigatório) para ADJUST; omitir nos restantes
    if (data.kind !== 'ADJUST') {
      delete payload.direction;
    }

    // Omitir campos opcionais vazios
    if (!payload.refId) delete payload.refId;
    if (!payload.batch) delete payload.batch;
    if (!payload.reason) delete payload.reason;

    return api.post('/api/stock/movements', payload);
  };

  const { submit, isLoading, generalError } = useFormSubmit<CreateStockMovementInput, unknown>(
    form,
    mutationFn,
    {
      onSuccess,
      invalidateKeys: [
        ['stock', 'movements'],
        ['stock', 'levels'],
      ],
    },
  );

  const locationOptions =
    locationsData?.items.map((l) => ({
      value: l.id,
      label: `${l.code} — ${l.name}`,
    })) ?? [];

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {generalError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{generalError}</div>
      )}

      <Field label="Variante (ID)" required error={errors.variantId?.message}>
        <input {...register('variantId')} className={inputCls} placeholder="ID da variante" />
      </Field>

      <Field label="Localização" required error={errors.locationId?.message}>
        <Select
          {...register('locationId')}
          placeholder="— selecionar —"
          options={locationOptions}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo de movimento" required error={errors.kind?.message}>
          <Select
            {...register('kind')}
            options={movementCreateKindValues.map((v) => ({
              value: v,
              label: KIND_LABELS[v] ?? v,
            }))}
          />
        </Field>

        <Field label="Quantidade" required error={errors.qty?.message}>
          <input {...register('qty')} type="number" min={1} className={inputCls} placeholder="1" />
        </Field>
      </div>

      {kind === 'ADJUST' && (
        <Field label="Direção do ajuste" required error={errors.direction?.message}>
          <Select
            {...register('direction')}
            placeholder="— selecionar —"
            options={Object.entries(DIRECTION_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Field>
      )}

      <Field label="Lote" error={errors.batch?.message}>
        <input {...register('batch')} className={inputCls} placeholder="LOT-2025-001" />
      </Field>

      <Field label="Razão / Referência" error={errors.reason?.message}>
        <input {...register('reason')} className={inputCls} placeholder="Entrada de encomenda..." />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={isLoading}>
          Registar movimento
        </Button>
      </div>
    </form>
  );
}
