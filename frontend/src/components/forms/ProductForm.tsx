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
import { peakSeasonMonths } from '@/lib/schemas/customer';
import {
  createProductSchema,
  updateProductSchema,
  productCategoryValues,
  materialPrimaryValues,
  productFinishValues,
  visualStyleValues,
  humiditySensitivityValues,
  productDecisionValues,
  productStatusValues,
  type CreateProductInput,
} from '@/lib/schemas/product';

const TABS = [
  { id: 'identidade', label: 'Identidade' },
  { id: 'visual', label: 'Visual' },
  { id: 'logistica', label: 'Logística' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'decisao', label: 'Decisão' },
];

interface ProductData {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: string;
  botanicalName: string | null;
  isAnchor: boolean;
  materialPrimary: string | null;
  finish: string | null;
  visualStyle: string | null;
  dominantColor: string | null;
  shelfLifeMonths: number | null;
  batchOriginDate: string | null;
  sensitivityToHumidity: string | null;
  heightCm: string | null;
  widthCm: string | null;
  weightG: string | null;
  caseSize: number;
  peakSeasons: string[];
  seasonality: string[];
  costEur: string;
  recommendedRetailEur: string | null;
  status: string;
  decision: string;
  score: string | null;
  visualScore: string | null;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  product?: ProductData;
  onSuccess?: (out: unknown) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  DRY_FLOWERS: 'Flores secas',
  PRESERVED_FLOWERS: 'Flores preservadas',
  VASES_CONTAINERS: 'Vasos e contentores',
  FLORAL_FOAM: 'Espuma floral',
  RIBBONS_PACKAGING: 'Fitas e embalagens',
  TOOLS_ACCESSORIES: 'Ferramentas e acessórios',
  ARTIFICIAL_PLANTS: 'Plantas artificiais',
  DECORATIVE_OBJECTS: 'Objetos decorativos',
};

const MATERIAL_LABELS: Record<string, string> = {
  GLASS: 'Vidro',
  CERAMIC: 'Cerâmica',
  METAL: 'Metal',
  WOOD: 'Madeira',
  NATURAL_FIBER: 'Fibra natural',
  FOAM: 'Espuma',
  RESIN: 'Resina',
  PLASTIC: 'Plástico',
  TEXTILE: 'Têxtil',
  PAPER: 'Papel',
  OTHER: 'Outro',
};

const FINISH_LABELS: Record<string, string> = {
  MATTE: 'Mate',
  GLOSSY: 'Brilhante',
  RUSTIC: 'Rústico',
  METALLIC: 'Metálico',
  TEXTURED: 'Texturado',
  TRANSPARENT: 'Transparente',
};

const STYLE_LABELS: Record<string, string> = {
  RUSTIC: 'Rústico',
  ROMANTIC: 'Romântico',
  MODERN: 'Moderno',
  MINIMALIST: 'Minimalista',
  BOHO: 'Boho',
  CLASSIC: 'Clássico',
  FUNERAL: 'Fúnebre',
};

const HUMIDITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  OUT_OF_STOCK: 'Sem stock',
  DISCONTINUED: 'Descontinuado',
  COMING_SOON: 'Em breve',
};

const DECISION_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  DISCONTINUED: 'Descontinuado',
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

export function ProductForm({ mode, product, onSuccess }: ProductFormProps) {
  const [activeTab, setActiveTab] = useState('identidade');

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(mode === 'create' ? createProductSchema : updateProductSchema),
    defaultValues:
      mode === 'edit' && product
        ? {
            sku: product.sku,
            slug: product.slug,
            name: product.name,
            category: product.category as CreateProductInput['category'],
            botanicalName: product.botanicalName ?? '',
            isAnchor: product.isAnchor,
            materialPrimary:
              (product.materialPrimary as CreateProductInput['materialPrimary']) ?? undefined,
            finish: (product.finish as CreateProductInput['finish']) ?? undefined,
            visualStyle: (product.visualStyle as CreateProductInput['visualStyle']) ?? undefined,
            dominantColor: product.dominantColor ?? '',
            shelfLifeMonths: product.shelfLifeMonths ?? undefined,
            batchOriginDate: product.batchOriginDate
              ? new Date(product.batchOriginDate).toISOString().slice(0, 10)
              : '',
            sensitivityToHumidity:
              (product.sensitivityToHumidity as CreateProductInput['sensitivityToHumidity']) ??
              undefined,
            heightCm: product.heightCm ? parseFloat(product.heightCm) : undefined,
            widthCm: product.widthCm ? parseFloat(product.widthCm) : undefined,
            weightG: product.weightG ? parseFloat(product.weightG) : undefined,
            caseSize: product.caseSize,
            peakSeasons: product.peakSeasons.length > 0 ? product.peakSeasons : product.seasonality,
            costEur: parseFloat(product.costEur),
            recommendedRetailEur: product.recommendedRetailEur
              ? parseFloat(product.recommendedRetailEur)
              : undefined,
            status: product.status as CreateProductInput['status'],
            decision: product.decision as CreateProductInput['decision'],
            score: product.score ? parseFloat(product.score) : undefined,
            visualScore: product.visualScore ? parseFloat(product.visualScore) : undefined,
          }
        : {
            category: 'DRY_FLOWERS',
            isAnchor: false,
            caseSize: 1,
            costEur: 0,
            status: 'ACTIVE',
            decision: 'PENDING',
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

  const mutationFn = async (data: CreateProductInput) => {
    if (mode === 'create') {
      return api.post('/api/products', data);
    } else {
      return api.patch(`/api/products/${product!.id}`, data);
    }
  };

  const { submit, isLoading, generalError } = useFormSubmit<CreateProductInput, unknown>(
    form,
    mutationFn,
    {
      onSuccess,
      invalidateKeys: mode === 'edit' ? [['products'], ['product', product?.id]] : [['products']],
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
            <div className="grid grid-cols-2 gap-4">
              <Field label="SKU" required error={errors.sku?.message}>
                <input {...register('sku')} className={inputCls} placeholder="FLR-001" />
              </Field>
              <Field label="Slug" required error={errors.slug?.message}>
                <input {...register('slug')} className={inputCls} placeholder="flr-001-nome" />
              </Field>
            </div>

            <Field label="Nome do produto" required error={errors.name?.message}>
              <input {...register('name')} className={inputCls} placeholder="Nome do produto" />
            </Field>

            <Field label="Categoria" required error={errors.category?.message}>
              <Select
                {...register('category')}
                options={productCategoryValues.map((v) => ({
                  value: v,
                  label: CATEGORY_LABELS[v] ?? v,
                }))}
              />
            </Field>

            <Field label="Nome botânico" error={errors.botanicalName?.message}>
              <input
                {...register('botanicalName')}
                className={inputCls}
                placeholder="Helichrysum bracteatum"
              />
            </Field>

            <Checkbox id="isAnchor" label="Peça âncora" {...register('isAnchor')} />
          </div>
        )}

        {activeTab === 'visual' && (
          <div className="flex flex-col gap-4">
            <Field label="Material principal" error={errors.materialPrimary?.message}>
              <Select
                {...register('materialPrimary')}
                placeholder="— selecionar —"
                options={materialPrimaryValues.map((v) => ({
                  value: v,
                  label: MATERIAL_LABELS[v] ?? v,
                }))}
              />
            </Field>

            <Field label="Acabamento" error={errors.finish?.message}>
              <Select
                {...register('finish')}
                placeholder="— selecionar —"
                options={productFinishValues.map((v) => ({
                  value: v,
                  label: FINISH_LABELS[v] ?? v,
                }))}
              />
            </Field>

            <Field label="Estilo visual" error={errors.visualStyle?.message}>
              <Select
                {...register('visualStyle')}
                placeholder="— selecionar —"
                options={visualStyleValues.map((v) => ({
                  value: v,
                  label: STYLE_LABELS[v] ?? v,
                }))}
              />
            </Field>

            <Field label="Cor dominante" error={errors.dominantColor?.message}>
              <input
                {...register('dominantColor')}
                className={inputCls}
                placeholder="Bege / #C8B89A"
              />
            </Field>
          </div>
        )}

        {activeTab === 'logistica' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vida útil (meses)" error={errors.shelfLifeMonths?.message}>
                <input
                  {...register('shelfLifeMonths')}
                  type="number"
                  min={0}
                  className={inputCls}
                  placeholder="24"
                />
              </Field>
              <Field label="Data de origem do lote" error={errors.batchOriginDate?.message}>
                <input {...register('batchOriginDate')} type="date" className={inputCls} />
              </Field>
            </div>

            <Field label="Sensibilidade à humidade" error={errors.sensitivityToHumidity?.message}>
              <Select
                {...register('sensitivityToHumidity')}
                placeholder="— selecionar —"
                options={humiditySensitivityValues.map((v) => ({
                  value: v,
                  label: HUMIDITY_LABELS[v] ?? v,
                }))}
              />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Altura (cm)" error={errors.heightCm?.message}>
                <input
                  {...register('heightCm')}
                  type="number"
                  step="0.1"
                  min={0}
                  className={inputCls}
                />
              </Field>
              <Field label="Largura (cm)" error={errors.widthCm?.message}>
                <input
                  {...register('widthCm')}
                  type="number"
                  step="0.1"
                  min={0}
                  className={inputCls}
                />
              </Field>
              <Field label="Peso (g)" error={errors.weightG?.message}>
                <input
                  {...register('weightG')}
                  type="number"
                  step="0.1"
                  min={0}
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Tamanho da caixa (unidades)" error={errors.caseSize?.message}>
              <input
                {...register('caseSize')}
                type="number"
                min={1}
                className={inputCls}
                placeholder="12"
              />
            </Field>
          </div>
        )}

        {activeTab === 'comercial' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Custo (€)" required error={errors.costEur?.message}>
                <input
                  {...register('costEur')}
                  type="number"
                  step="0.01"
                  min={0}
                  className={inputCls}
                  placeholder="0.00"
                />
              </Field>
              <Field label="PVP sugerido (€)" error={errors.recommendedRetailEur?.message}>
                <input
                  {...register('recommendedRetailEur')}
                  type="number"
                  step="0.01"
                  min={0}
                  className={inputCls}
                  placeholder="0.00"
                />
              </Field>
            </div>

            <Field label="Estado" error={errors.status?.message}>
              <Select
                {...register('status')}
                options={productStatusValues.map((v) => ({
                  value: v,
                  label: STATUS_LABELS[v] ?? v,
                }))}
              />
            </Field>

            <div>
              <p className="mb-3 text-sm font-medium text-neutral-700">Meses de pico</p>
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
          </div>
        )}

        {activeTab === 'decisao' && (
          <div className="flex flex-col gap-4">
            <Field label="Decisão" error={errors.decision?.message}>
              <Select
                {...register('decision')}
                options={productDecisionValues.map((v) => ({
                  value: v,
                  label: DECISION_LABELS[v] ?? v,
                }))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nota (0-10)" error={errors.score?.message}>
                <input
                  {...register('score')}
                  type="number"
                  step="0.1"
                  min={0}
                  max={10}
                  className={inputCls}
                />
              </Field>
              <Field label="Nota visual (0-10)" error={errors.visualScore?.message}>
                <input
                  {...register('visualScore')}
                  type="number"
                  step="0.1"
                  min={0}
                  max={10}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        )}
      </Tabs>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="submit" loading={isLoading}>
          {mode === 'create' ? 'Criar produto' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  );
}
