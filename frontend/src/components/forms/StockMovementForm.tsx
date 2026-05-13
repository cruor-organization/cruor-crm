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
  stockMovementKindValues,
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

const KIND_LABELS: Record<string, string> = {
  IN: 'Entrada',
  OUT: 'Saída',
  RESERVE: 'Reserva',
  RELEASE: 'Liberação',
  ADJUST: 'Ajuste',
  RETURN: 'Devolução',
  TRANSFER_IN: 'Transferência entrada',
  TRANSFER_OUT: 'Transferência saída',
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
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const mutationFn = async (data: CreateStockMovementInput) => {
    return api.post('/api/stock/movements', data);
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
            options={stockMovementKindValues.map((v) => ({
              value: v,
              label: KIND_LABELS[v] ?? v,
            }))}
          />
        </Field>

        <Field label="Quantidade" required error={errors.qty?.message}>
          <input {...register('qty')} type="number" min={1} className={inputCls} placeholder="1" />
        </Field>
      </div>

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
