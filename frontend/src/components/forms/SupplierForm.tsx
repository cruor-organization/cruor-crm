import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Field, inputCls } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { api } from '@/lib/api';
import { useFormSubmit } from '@/lib/forms/useFormSubmit';
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierTypeValues,
  incotermValues,
  type CreateSupplierInput,
} from '@/lib/schemas/supplier';

interface SupplierData {
  id: string;
  name: string;
  country: string;
  type: string;
  incoterms: string | null;
  defaultLeadTimeDays: number | null;
  tags: string[];
  notes: string | null;
  contacts: { kind: string; value: string; primary: boolean }[];
  status: string;
}

interface SupplierFormProps {
  mode: 'create' | 'edit';
  supplier?: SupplierData;
  onSuccess?: () => void;
}

const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  ALIBABA_SELLER: 'Alibaba Seller',
  EU_IMPORTER: 'Importador UE',
  DIRECT_MANUFACTURER: 'Fabricante Direto',
  DOMESTIC: 'Doméstico',
};

const INCOTERM_LABELS: Record<string, string> = {
  FOB: 'FOB',
  CIF: 'CIF',
  EXW: 'EXW',
  DAP: 'DAP',
  DDP: 'DDP',
};

export function SupplierForm({ mode, supplier, onSuccess }: SupplierFormProps) {
  type FormValues = CreateSupplierInput;

  // Extrair email/telefone do array contacts para os campos auxiliares do form
  const primaryEmailContact = supplier?.contacts.find((c) => c.kind === 'email' && c.primary);
  const primaryPhoneContact = supplier?.contacts.find((c) => c.kind === 'phone');

  const form = useForm<FormValues>({
    resolver: zodResolver(mode === 'create' ? createSupplierSchema : updateSupplierSchema),
    defaultValues:
      mode === 'edit' && supplier
        ? {
            name: supplier.name,
            type: supplier.type as FormValues['type'],
            country: supplier.country,
            incoterms: (supplier.incoterms as FormValues['incoterms']) ?? undefined,
            defaultLeadTimeDays: supplier.defaultLeadTimeDays ?? undefined,
            tags: supplier.tags.join(', '),
            notes: supplier.notes ?? '',
            primaryContactEmail: primaryEmailContact?.value ?? '',
            primaryContactPhone: primaryPhoneContact?.value ?? '',
          }
        : {
            type: 'ALIBABA_SELLER',
            country: 'CN',
          },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const mutationFn = async (data: FormValues) => {
    // Transformar tags de string em array
    const tagsRaw = data.tags ?? '';
    const tagsArr =
      typeof tagsRaw === 'string'
        ? tagsRaw
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    // Construir contacts[] a partir dos campos auxiliares planos
    const contacts: { kind: 'email' | 'phone'; value: string; primary: boolean }[] = [];
    if (data.primaryContactEmail) {
      contacts.push({ kind: 'email', value: data.primaryContactEmail, primary: true });
    }
    if (data.primaryContactPhone) {
      contacts.push({
        kind: 'phone',
        value: data.primaryContactPhone,
        primary: !data.primaryContactEmail,
      });
    }

    // Remover campos auxiliares não presentes no backend e construir payload conforme schema
    const { primaryContactEmail: _email, primaryContactPhone: _phone, tags: _tags, ...rest } = data;

    const payload: Record<string, unknown> = {
      ...rest,
      contacts,
      tags: tagsArr,
    };

    // Omitir strings opcionais vazias (backend .optional() + validação min rejeitaria '')
    if (!payload.legalName) delete payload.legalName;
    if (!payload.taxId) delete payload.taxId;
    if (!payload.paymentTerms) delete payload.paymentTerms;
    if (!payload.notes) delete payload.notes;
    if (payload.defaultLeadTimeDays == null) delete payload.defaultLeadTimeDays;

    if (mode === 'create') {
      return api.post('/api/suppliers', payload);
    } else {
      return api.patch(`/api/suppliers/${supplier!.id}`, payload);
    }
  };

  const { submit, isLoading, generalError } = useFormSubmit<FormValues, unknown>(form, mutationFn, {
    onSuccess,
    invalidateKeys: [['suppliers']],
  });

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {generalError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{generalError}</div>
      )}

      <Field label="Nome" required error={errors.name?.message}>
        <input {...register('name')} className={inputCls} placeholder="Nome do fornecedor" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo" required error={errors.type?.message}>
          <Select
            {...register('type')}
            options={supplierTypeValues.map((v) => ({
              value: v,
              label: SUPPLIER_TYPE_LABELS[v] ?? v,
            }))}
          />
        </Field>

        <Field label="País (ISO 2)" required error={errors.country?.message}>
          <input {...register('country')} className={inputCls} placeholder="CN" maxLength={2} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Incoterm" error={errors.incoterms?.message}>
          <Select
            {...register('incoterms')}
            placeholder="— selecionar —"
            options={incotermValues.map((v) => ({
              value: v,
              label: INCOTERM_LABELS[v] ?? v,
            }))}
          />
        </Field>

        <Field label="Lead time (dias)" error={errors.defaultLeadTimeDays?.message}>
          <input
            {...register('defaultLeadTimeDays')}
            type="number"
            min={0}
            className={inputCls}
            placeholder="30"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Email do contacto" error={errors.primaryContactEmail?.message}>
          <input
            {...register('primaryContactEmail')}
            type="email"
            className={inputCls}
            placeholder="email@exemplo.com"
          />
        </Field>

        <Field label="Telefone do contacto" error={errors.primaryContactPhone?.message}>
          <input {...register('primaryContactPhone')} className={inputCls} placeholder="+86..." />
        </Field>
      </div>

      <Field label="Tags (separadas por vírgula)" error={errors.tags?.message}>
        <input
          {...register('tags')}
          className={inputCls}
          placeholder="flores, preservadas, premium"
        />
      </Field>

      <Field label="Notas" error={errors.notes?.message}>
        <Textarea {...register('notes')} placeholder="Observações internas…" />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={isLoading}>
          {mode === 'create' ? 'Criar fornecedor' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  );
}
