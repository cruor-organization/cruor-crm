import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { api } from '@/lib/api';
import { useFormSubmit } from '@/lib/forms/useFormSubmit';
import {
  createStockLocationSchema,
  updateStockLocationSchema,
  type CreateStockLocationInput,
} from '@/lib/schemas/stock';
import { Button } from '@/components/ui/Button';
import { Field, inputCls } from '@/components/ui/Field';
import { Checkbox } from '@/components/ui/Checkbox';

interface LocationData {
  id: string;
  code: string;
  name: string;
  country: string;
  isDefault: boolean;
  active: boolean;
}

interface StockLocationFormProps {
  mode: 'create' | 'edit';
  location?: LocationData;
  onSuccess?: () => void;
}

export function StockLocationForm({ mode, location, onSuccess }: StockLocationFormProps) {
  const form = useForm<CreateStockLocationInput>({
    resolver: zodResolver(
      mode === 'create' ? createStockLocationSchema : updateStockLocationSchema,
    ),
    defaultValues:
      mode === 'edit' && location
        ? {
            code: location.code,
            name: location.name,
            country: location.country,
            isDefault: location.isDefault,
            active: location.active,
          }
        : {
            country: 'PT',
            isDefault: false,
            active: true,
          },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const mutationFn = async (data: CreateStockLocationInput) => {
    if (mode === 'create') {
      return api.post('/api/stock/locations', data);
    } else {
      return api.patch(`/api/stock/locations/${location!.id}`, data);
    }
  };

  const { submit, isLoading, generalError } = useFormSubmit<CreateStockLocationInput, unknown>(
    form,
    mutationFn,
    {
      onSuccess,
      invalidateKeys: [['stock', 'locations']],
    },
  );

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {generalError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{generalError}</div>
      )}

      <Field label="Código" required error={errors.code?.message}>
        <input {...register('code')} className={inputCls} placeholder="PT_PORTO" />
        <p className="mt-0.5 text-xs text-neutral-500">Formato: XX_NOME (ex.: PT_PORTO, ES_BCN)</p>
      </Field>

      <Field label="Nome" required error={errors.name?.message}>
        <input {...register('name')} className={inputCls} placeholder="Armazém Porto" />
      </Field>

      <Field label="País (ISO 2)" required error={errors.country?.message}>
        <input {...register('country')} className={inputCls} placeholder="PT" maxLength={2} />
      </Field>

      <div className="flex gap-6">
        <Checkbox id="isDefault" label="Localização padrão" {...register('isDefault')} />
        <Checkbox id="active" label="Ativo" {...register('active')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={isLoading}>
          {mode === 'create' ? 'Criar localização' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  );
}
