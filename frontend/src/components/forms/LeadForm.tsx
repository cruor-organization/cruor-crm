import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Field, inputCls } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { api } from '@/lib/api';
import { useFormSubmit } from '@/lib/forms/useFormSubmit';
import { customerBusinessTypeValues } from '@/lib/schemas/customer';
import {
  createLeadSchema,
  updateLeadSchema,
  leadStatusValues,
  leadSourceValues,
  type CreateLeadInput,
} from '@/lib/schemas/lead';

interface LeadData {
  id: string;
  tradingName: string;
  legalName: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  email: string | null;
  source: string;
  businessType: string | null;
  geoZone: string | null;
  notes: string | null;
  status: string;
}

interface LeadFormProps {
  mode: 'create' | 'edit';
  lead?: LeadData;
  onSuccess?: () => void;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  PHYSICAL_SHOP: 'Loja física',
  EVENT_ATELIER: 'Atelier de eventos',
  DECORATOR: 'Decorador',
  HOTEL_RESTAURANT: 'Hotel / Restaurante',
  ONLINE_ONLY: 'Só online',
  MIXED: 'Misto',
};

const SOURCE_LABELS: Record<string, string> = {
  REFERRAL: 'Referência',
  WEBSITE: 'Website',
  INSTAGRAM: 'Instagram',
  COLD_OUTREACH: 'Prospeção',
  EVENT_FAIR: 'Feira',
  GOOGLE_PLACES: 'Google Places',
  OTHER: 'Outro',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Qualificado',
  NEGOTIATING: 'Em negociação',
  WON: 'Ganho',
  LOST: 'Perdido',
};

export function LeadForm({ mode, lead, onSuccess }: LeadFormProps) {
  type FormValues = CreateLeadInput;

  const form = useForm<FormValues>({
    resolver: zodResolver(mode === 'create' ? createLeadSchema : updateLeadSchema),
    defaultValues:
      mode === 'edit' && lead
        ? {
            tradingName: lead.tradingName,
            legalName: lead.legalName ?? '',
            phone: lead.phone ?? '',
            whatsappNumber: lead.whatsappNumber ?? '',
            email: lead.email ?? '',
            // city vazio; geoZone colocado em zoneCode para edição
            city: '',
            zoneCode: lead.geoZone ?? '',
            businessType: (lead.businessType as FormValues['businessType']) ?? undefined,
            source: lead.source as FormValues['source'],
            notes: lead.notes ?? '',
            status: lead.status as FormValues['status'],
          }
        : {
            source: 'OTHER',
            status: 'NEW',
          },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const mutationFn = async (data: FormValues) => {
    // Construir geoZone a partir dos campos UI auxiliares city + zoneCode
    const cityPart = data.city?.trim() ?? '';
    const zonePart = data.zoneCode?.trim() ?? '';
    const geoZone = [cityPart, zonePart].filter(Boolean).join(' — ') || undefined;

    // Remover campos UI-only que o backend não conhece e construir payload conforme schema
    const {
      contactName: _contactName, // backend não tem campo de nome de contacto em lead
      city: _city,
      zoneCode: _zoneCode,
      ...rest
    } = data;

    const payload: Record<string, unknown> = { ...rest };

    if (geoZone) payload.geoZone = geoZone;

    // Omitir strings opcionais vazias
    if (!payload.legalName) delete payload.legalName;
    if (!payload.phone) delete payload.phone;
    if (!payload.whatsappNumber) delete payload.whatsappNumber;
    if (!payload.email) delete payload.email;
    if (!payload.notes) delete payload.notes;
    if (payload.businessType == null) delete payload.businessType;

    if (mode === 'create') {
      return api.post('/api/leads', payload);
    } else {
      return api.patch(`/api/leads/${lead!.id}`, payload);
    }
  };

  const { submit, isLoading, generalError } = useFormSubmit<FormValues, unknown>(form, mutationFn, {
    onSuccess,
    invalidateKeys: [['leads']],
  });

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {generalError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{generalError}</div>
      )}

      <Field label="Nome comercial" required error={errors.tradingName?.message}>
        <input {...register('tradingName')} className={inputCls} placeholder="Flores da Baixa" />
      </Field>

      <Field label="Razão social" error={errors.legalName?.message}>
        <input {...register('legalName')} className={inputCls} placeholder="Flores da Baixa Lda." />
      </Field>

      <Field label="Contacto" error={errors.contactName?.message}>
        <input
          {...register('contactName')}
          className={inputCls}
          placeholder="Nome do responsável"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Telefone" error={errors.phone?.message}>
          <input {...register('phone')} className={inputCls} placeholder="+351..." />
        </Field>
        <Field label="WhatsApp" error={errors.whatsappNumber?.message}>
          <input {...register('whatsappNumber')} className={inputCls} placeholder="+351..." />
        </Field>
      </div>

      <Field label="Email" error={errors.email?.message}>
        <input
          {...register('email')}
          type="email"
          className={inputCls}
          placeholder="email@exemplo.com"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cidade" error={errors.city?.message}>
          <input {...register('city')} className={inputCls} placeholder="Lisboa" />
        </Field>
        <Field label="Zona / Código" error={errors.zoneCode?.message}>
          <input {...register('zoneCode')} className={inputCls} placeholder="LX-CENTRO" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo de negócio" error={errors.businessType?.message}>
          <Select
            {...register('businessType')}
            placeholder="— selecionar —"
            options={customerBusinessTypeValues.map((v) => ({
              value: v,
              label: BUSINESS_TYPE_LABELS[v] ?? v,
            }))}
          />
        </Field>

        <Field label="Origem" error={errors.source?.message}>
          <Select
            {...register('source')}
            options={leadSourceValues.map((v) => ({
              value: v,
              label: SOURCE_LABELS[v] ?? v,
            }))}
          />
        </Field>
      </div>

      {mode === 'edit' && (
        <Field label="Estado" error={errors.status?.message}>
          <Select
            {...register('status')}
            options={leadStatusValues.map((v) => ({
              value: v,
              label: STATUS_LABELS[v] ?? v,
            }))}
          />
        </Field>
      )}

      <Field label="Notas" error={errors.notes?.message}>
        <Textarea {...register('notes')} placeholder="Observações…" />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={isLoading}>
          {mode === 'create' ? 'Criar potencial' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  );
}
