import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field, inputCls } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { api } from '@/lib/api';
import { useFormSubmit } from '@/lib/forms/useFormSubmit';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerBusinessTypeValues,
  pricingTierValues,
  customerStatusValues,
  preferredChannelValues,
  dayOfWeekValues,
  peakSeasonMonths,
  type CreateCustomerInput,
} from '@/lib/schemas/customer';

const TABS = [
  { id: 'identidade', label: 'Identidade' },
  { id: 'contactos', label: 'Contactos' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'sazonalidade', label: 'Sazonalidade' },
];

interface CustomerData {
  id: string;
  businessType: string;
  legalName: string;
  tradingName: string | null;
  taxId: string | null;
  taxCountry: string | null;
  status: string;
  phonePrimary: string | null;
  whatsappNumber: string | null;
  email: string | null;
  website: string | null;
  instagramHandle: string | null;
  preferredChannel: string | null;
  pricingTier: string;
  salesRepId: string | null;
  creditLimitEur: string;
  paymentTermDays: number;
  preferredDeliveryDay: string | null;
  shopSizeSqm: number | null;
  estimatedMonthlyVolumeEur: string | null;
  peakSeasons: string[];
}

interface CustomerFormProps {
  mode: 'create' | 'edit';
  customer?: CustomerData;
  onSuccess?: (out: unknown) => void;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  PHYSICAL_SHOP: 'Loja física',
  EVENT_ATELIER: 'Atelier de eventos',
  DECORATOR: 'Decorador',
  HOTEL_RESTAURANT: 'Hotel / Restaurante',
  ONLINE_ONLY: 'Só online',
  MIXED: 'Misto',
};

const PRICING_TIER_LABELS: Record<string, string> = {
  STANDARD: 'Standard',
  PROFESSIONAL: 'Profissional',
  KEY_ACCOUNT: 'Key Account',
  DISTRIBUTOR: 'Distribuidor',
};

const STATUS_LABELS: Record<string, string> = {
  PROSPECT: 'Prospeto',
  ACTIVE: 'Ativo',
  AT_RISK: 'Em risco',
  CHURNED: 'Perdido',
  BLOCKED: 'Bloqueado',
};

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  PHONE: 'Telefone',
  IN_PERSON: 'Presencial',
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Segunda',
  TUESDAY: 'Terça',
  WEDNESDAY: 'Quarta',
  THURSDAY: 'Quinta',
  FRIDAY: 'Sexta',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

const MONTH_LABELS: Record<string, string> = {
  JAN: 'Jan',
  FEV: 'Fev',
  MAR: 'Mar',
  ABR: 'Abr',
  MAI: 'Mai',
  JUN: 'Jun',
  JUL: 'Jul',
  AGO: 'Ago',
  SET: 'Set',
  OUT: 'Out',
  NOV: 'Nov',
  DEZ: 'Dez',
};

export function CustomerForm({ mode, customer, onSuccess }: CustomerFormProps) {
  const [activeTab, setActiveTab] = useState('identidade');

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(mode === 'create' ? createCustomerSchema : updateCustomerSchema),
    defaultValues:
      mode === 'edit' && customer
        ? {
            businessType: customer.businessType as CreateCustomerInput['businessType'],
            legalName: customer.legalName,
            tradingName: customer.tradingName ?? '',
            taxId: customer.taxId ?? '',
            taxCountry: customer.taxCountry ?? '',
            status: customer.status as CreateCustomerInput['status'],
            phonePrimary: customer.phonePrimary ?? '',
            whatsappNumber: customer.whatsappNumber ?? '',
            email: customer.email ?? '',
            website: customer.website ?? '',
            instagramHandle: customer.instagramHandle ?? '',
            preferredChannel:
              (customer.preferredChannel as CreateCustomerInput['preferredChannel']) ?? undefined,
            pricingTier: customer.pricingTier as CreateCustomerInput['pricingTier'],
            salesRepId: customer.salesRepId ?? '',
            creditLimitEur: parseFloat(customer.creditLimitEur),
            paymentTermDays: customer.paymentTermDays,
            preferredDeliveryDay:
              (customer.preferredDeliveryDay as CreateCustomerInput['preferredDeliveryDay']) ??
              undefined,
            shopSizeSqm: customer.shopSizeSqm ?? undefined,
            estimatedMonthlyVolumeEur: customer.estimatedMonthlyVolumeEur
              ? parseFloat(customer.estimatedMonthlyVolumeEur)
              : undefined,
            peakSeasons: customer.peakSeasons,
          }
        : {
            businessType: 'PHYSICAL_SHOP',
            pricingTier: 'STANDARD',
            status: 'ACTIVE',
            creditLimitEur: 0,
            paymentTermDays: 0,
            peakSeasons: [],
          },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const peakSeasons = watch('peakSeasons') ?? [];

  const mutationFn = async (data: CreateCustomerInput) => {
    if (mode === 'create') {
      return api.post('/api/customers', data);
    } else {
      return api.patch(`/api/customers/${customer!.id}`, data);
    }
  };

  const { submit, isLoading, generalError } = useFormSubmit<CreateCustomerInput, unknown>(
    form,
    mutationFn,
    {
      onSuccess,
      invalidateKeys:
        mode === 'edit' ? [['customers'], ['customer', customer?.id]] : [['customers']],
    },
  );

  const toggleSeason = (month: string) => {
    const current = peakSeasons;
    if (current.includes(month)) {
      setValue(
        'peakSeasons',
        current.filter((m) => m !== month),
      );
    } else {
      setValue('peakSeasons', [...current, month]);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6">
      {generalError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{generalError}</div>
      )}

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab}>
        {activeTab === 'identidade' && (
          <div className="flex flex-col gap-4">
            <Field label="Tipo de negócio" required error={errors.businessType?.message}>
              <Select
                {...register('businessType')}
                options={customerBusinessTypeValues.map((v) => ({
                  value: v,
                  label: BUSINESS_TYPE_LABELS[v] ?? v,
                }))}
              />
            </Field>

            <Field label="Razão social" required error={errors.legalName?.message}>
              <input
                {...register('legalName')}
                className={inputCls}
                placeholder="Flores da Baixa Lda."
              />
            </Field>

            <Field label="Nome comercial" error={errors.tradingName?.message}>
              <input
                {...register('tradingName')}
                className={inputCls}
                placeholder="Flores da Baixa"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="NIF / CIF" error={errors.taxId?.message}>
                <input {...register('taxId')} className={inputCls} placeholder="123456789" />
              </Field>
              <Field label="País fiscal (ISO 2)" error={errors.taxCountry?.message}>
                <input
                  {...register('taxCountry')}
                  className={inputCls}
                  placeholder="PT"
                  maxLength={2}
                />
              </Field>
            </div>

            <Field label="Estado" error={errors.status?.message}>
              <Select
                {...register('status')}
                options={customerStatusValues.map((v) => ({
                  value: v,
                  label: STATUS_LABELS[v] ?? v,
                }))}
              />
            </Field>
          </div>
        )}

        {activeTab === 'contactos' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Telefone principal" error={errors.phonePrimary?.message}>
                <input {...register('phonePrimary')} className={inputCls} placeholder="+351..." />
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
                placeholder="florista@exemplo.com"
              />
            </Field>

            <Field label="Website" error={errors.website?.message}>
              <input
                {...register('website')}
                className={inputCls}
                placeholder="https://exemplo.com"
              />
            </Field>

            <Field label="Instagram" error={errors.instagramHandle?.message}>
              <input
                {...register('instagramHandle')}
                className={inputCls}
                placeholder="@floresdabaixa"
              />
            </Field>

            <Field label="Canal preferencial" error={errors.preferredChannel?.message}>
              <Select
                {...register('preferredChannel')}
                placeholder="— selecionar —"
                options={preferredChannelValues.map((v) => ({
                  value: v,
                  label: CHANNEL_LABELS[v] ?? v,
                }))}
              />
            </Field>
          </div>
        )}

        {activeTab === 'comercial' && (
          <div className="flex flex-col gap-4">
            <Field label="Escalão de preço" error={errors.pricingTier?.message}>
              <Select
                {...register('pricingTier')}
                options={pricingTierValues.map((v) => ({
                  value: v,
                  label: PRICING_TIER_LABELS[v] ?? v,
                }))}
              />
            </Field>

            <Field label="Comercial responsável (ID)" error={errors.salesRepId?.message}>
              <input
                {...register('salesRepId')}
                className={inputCls}
                placeholder="ID do utilizador"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Limite de crédito (€)" error={errors.creditLimitEur?.message}>
                <input
                  {...register('creditLimitEur')}
                  type="number"
                  step="0.01"
                  min={0}
                  className={inputCls}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Prazo de pagamento (dias)" error={errors.paymentTermDays?.message}>
                <input
                  {...register('paymentTermDays')}
                  type="number"
                  min={0}
                  className={inputCls}
                  placeholder="30"
                />
              </Field>
            </div>

            <Field label="Dia de entrega preferencial" error={errors.preferredDeliveryDay?.message}>
              <Select
                {...register('preferredDeliveryDay')}
                placeholder="— selecionar —"
                options={dayOfWeekValues.map((v) => ({
                  value: v,
                  label: DAY_LABELS[v] ?? v,
                }))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Área da loja (m²)" error={errors.shopSizeSqm?.message}>
                <input
                  {...register('shopSizeSqm')}
                  type="number"
                  min={0}
                  className={inputCls}
                  placeholder="50"
                />
              </Field>
              <Field
                label="Volume mensal est. (€)"
                error={errors.estimatedMonthlyVolumeEur?.message}
              >
                <input
                  {...register('estimatedMonthlyVolumeEur')}
                  type="number"
                  step="0.01"
                  min={0}
                  className={inputCls}
                  placeholder="500.00"
                />
              </Field>
            </div>
          </div>
        )}

        {activeTab === 'sazonalidade' && (
          <div>
            <p className="mb-3 text-sm text-neutral-600">
              Meses de pico de compra para este florista.
            </p>
            <div className="grid grid-cols-4 gap-3">
              {peakSeasonMonths.map((month) => (
                <Checkbox
                  key={month}
                  label={MONTH_LABELS[month] ?? month}
                  checked={peakSeasons.includes(month)}
                  onChange={() => toggleSeason(month)}
                />
              ))}
            </div>
          </div>
        )}
      </Tabs>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="submit" loading={isLoading}>
          {mode === 'create' ? 'Criar florista' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  );
}
