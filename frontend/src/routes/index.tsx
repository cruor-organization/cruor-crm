import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';

import { authClient, signOut, useSession } from '@/lib/auth-client';

export const Route = createFileRoute('/')({
  component: Home,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) {
      throw redirect({ to: '/sign-in' });
    }
  },
});

function Home() {
  const { data } = useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: '/sign-in' });
  };

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">CRM Florista B2B</h1>
      <p className="mt-2 text-neutral-700">
        Sessão ativa: <strong>{data?.user.email ?? '...'}</strong>
      </p>
      <p className="mt-1 text-sm text-neutral-500">
        Fase 0 (Bootstrap). Dashboard real chega em Fase 1.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Sair
        </button>
        <Link
          to="/sign-up"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          /sign-up (deve falhar)
        </Link>
      </div>
    </main>
  );
}
