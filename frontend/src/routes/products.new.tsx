import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';

import { ProductForm } from '@/components/forms/ProductForm';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/products/new')({
  component: ProductNewPage,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: '/sign-in' });
  },
});

function ProductNewPage() {
  const navigate = useNavigate();

  const handleSuccess = (out: unknown) => {
    const created = out as { id?: string } | null;
    if (created?.id) {
      void navigate({ to: '/products/$id', params: { id: created.id } });
    } else {
      void navigate({ to: '/products' });
    }
  };

  return (
    <section className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Novo produto</h1>
        <p className="text-sm text-neutral-500">Introduz os dados do novo produto.</p>
      </header>

      <div className="rounded-card border border-neutral-200 bg-white p-6 shadow-card">
        <ProductForm mode="create" onSuccess={handleSuccess} />
      </div>
    </section>
  );
}
