import { createFileRoute } from '@tanstack/react-router';
import { Download, Eye, RefreshCw, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/format';
import { mockCatalogs, CATALOG_SEASONS, type Catalog, type CatalogStatus } from '@/lib/mock-data';

export const Route = createFileRoute('/catalogs')({
  component: CatalogsPage,
});

const STATUS_VARIANT: Record<CatalogStatus, 'success' | 'neutral' | 'warning' | 'info'> = {
  ready: 'success',
  archived: 'neutral',
  generating: 'warning',
  draft: 'info',
};

const STATUS_LABEL: Record<CatalogStatus, string> = {
  ready: 'Pronto',
  archived: 'Arquivado',
  generating: 'A gerar…',
  draft: 'Rascunho',
};

function CatalogsPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>(mockCatalogs);
  const [newCatalogOpen, setNewCatalogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', season: CATALOG_SEASONS[0] ?? '' });
  const [creating, setCreating] = useState(false);

  function handleDownload(catalog: Catalog) {
    console.info('[mock] Descarregar catálogo:', catalog.id, catalog.name);
  }

  function handlePreview(catalog: Catalog) {
    console.info('[mock] Pré-visualizar catálogo:', catalog.id);
  }

  function handleRegenerate(catalog: Catalog) {
    setCatalogs((prev) =>
      prev.map((c) => (c.id === catalog.id ? { ...c, status: 'generating' } : c)),
    );
    console.info('[mock] Regenerar catálogo:', catalog.id);
    // Simula fim de geração após 2s
    setTimeout(() => {
      setCatalogs((prev) =>
        prev.map((c) =>
          c.id === catalog.id
            ? { ...c, status: 'ready' as const, generatedAt: new Date().toISOString() }
            : c,
        ),
      );
    }, 2000);
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setTimeout(() => {
      const newCatalog: Catalog = {
        id: `cat-${Date.now()}`,
        name: form.name || `Catálogo ${form.season}`,
        season: form.season,
        status: 'draft',
        productCount: 0,
        createdAt: new Date().toISOString(),
        gradientFrom: '#6b7280',
        gradientTo: '#374151',
      };
      setCatalogs((prev) => [newCatalog, ...prev]);
      setCreating(false);
      setNewCatalogOpen(false);
      setForm({ name: '', season: CATALOG_SEASONS[0] ?? '' });
      console.info('[mock] Catálogo criado:', newCatalog);
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogos PDF"
        subtitle="Catálogos sazonais de produtos para floristas"
        action={
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setNewCatalogOpen(true)}
          >
            Gerar novo catálogo
          </Button>
        }
      />

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {catalogs.map((catalog) => (
          <CatalogCard
            key={catalog.id}
            catalog={catalog}
            onDownload={handleDownload}
            onPreview={handlePreview}
            onRegenerate={handleRegenerate}
          />
        ))}
      </div>

      {/* Modal novo catálogo */}
      <Modal
        open={newCatalogOpen}
        onClose={() => setNewCatalogOpen(false)}
        title="Gerar novo catálogo"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-700">Nome do catálogo</label>
            <input
              type="text"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cruor-500 focus:outline-none focus:ring-1 focus:ring-cruor-500"
              placeholder="ex. Catálogo Verão 2027"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-700">Época</label>
            <select
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cruor-500 focus:outline-none focus:ring-1 focus:ring-cruor-500"
              value={form.season}
              onChange={(e) => setForm({ ...form, season: e.target.value })}
            >
              {CATALOG_SEASONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            <p className="font-medium text-neutral-700">Selecção de produtos</p>
            <p className="mt-1">
              A selecção de produtos por categoria e sazonalidade estará disponível na fase de
              geração (§10.5). Por agora, todos os produtos activos são incluídos.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setNewCatalogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? 'A criar…' : 'Criar catálogo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CatalogCard({
  catalog,
  onDownload,
  onPreview,
  onRegenerate,
}: {
  catalog: Catalog;
  onDownload: (c: Catalog) => void;
  onPreview: (c: Catalog) => void;
  onRegenerate: (c: Catalog) => void;
}) {
  const isGenerating = catalog.status === 'generating';

  return (
    <Card padding="none" className="flex flex-col overflow-hidden">
      {/* Capa — placeholder com gradiente */}
      <div
        className="flex h-36 items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${catalog.gradientFrom}, ${catalog.gradientTo})`,
        }}
      >
        <div className="text-center text-white">
          <p className="text-lg font-bold">{catalog.season}</p>
          <p className="mt-1 text-xs opacity-75">Cruor Flores Preservadas</p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-neutral-800 leading-snug">{catalog.name}</h3>
          <Badge variant={STATUS_VARIANT[catalog.status]}>{STATUS_LABEL[catalog.status]}</Badge>
        </div>

        <div className="mt-2 space-y-1 text-xs text-neutral-500">
          {catalog.productCount > 0 && <p>{catalog.productCount} produtos</p>}
          <p>Criado: {formatDate(catalog.createdAt)}</p>
          {catalog.generatedAt && <p>Gerado: {formatDate(catalog.generatedAt)}</p>}
          {catalog.fileSizeKb && <p>Tamanho: {(catalog.fileSizeKb / 1024).toFixed(1)} MB</p>}
        </div>

        {/* Acções */}
        <div className="mt-4 flex flex-wrap gap-2">
          {catalog.status === 'ready' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={<Download className="h-3.5 w-3.5" />}
                onClick={() => onDownload(catalog)}
              >
                Descarregar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Eye className="h-3.5 w-3.5" />}
                onClick={() => onPreview(catalog)}
              >
                Pré-visualizar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                onClick={() => onRegenerate(catalog)}
              >
                Regenerar
              </Button>
            </>
          )}
          {catalog.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => onRegenerate(catalog)}
            >
              Gerar PDF
            </Button>
          )}
          {isGenerating && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              A gerar catálogo…
            </div>
          )}
          {catalog.status === 'archived' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={() => onDownload(catalog)}
            >
              Descarregar (arquivado)
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
