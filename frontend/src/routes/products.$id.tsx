import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { ProductForm } from '@/components/forms/ProductForm';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

interface ProductDetail {
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

export const Route = createFileRoute('/products/$id')({
  component: ProductDetailPage,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: '/sign-in' });
  },
});

function ProductDetailPage() {
  const { id } = Route.useParams();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<ProductDetail>(`/api/products/${id}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton height="h-8" width="w-64" />
        <Skeleton height="h-64" width="w-full" />
      </div>
    );
  }

  if (!product) {
    return <div className="py-12 text-center text-neutral-500">Produto não encontrado.</div>;
  }

  return (
    <section className="mx-auto max-w-2xl">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-600">
            {product.sku}
          </span>
          {product.isAnchor && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              peça âncora
            </span>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>
      </header>

      <div className="rounded-card border border-neutral-200 bg-surface p-6 shadow-card">
        <ProductForm mode="edit" product={product} />
      </div>
    </section>
  );
}
