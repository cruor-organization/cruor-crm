import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';

import { CustomerForm } from '@/components/forms/CustomerForm';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/customers/new')({
  component: CustomerNewPage,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: '/sign-in' });
  },
});

function CustomerNewPage() {
  const navigate = useNavigate();

  const handleSuccess = (out: unknown) => {
    const created = out as { id?: string } | null;
    if (created?.id) {
      void navigate({ to: '/customers/$id', params: { id: created.id } });
    } else {
      void navigate({ to: '/customers' });
    }
  };

  return (
    <section className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Novo florista-cliente</h1>
        <p className="text-sm text-neutral-500">Preenche os dados do novo florista.</p>
      </header>

      <div className="rounded-card border border-neutral-200 bg-surface p-6 shadow-card">
        <CustomerForm mode="create" onSuccess={handleSuccess} />
      </div>
    </section>
  );
}
