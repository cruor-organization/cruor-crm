import { createFileRoute, redirect } from '@tanstack/react-router';

import { EcosystemHub } from '@/components/hub/EcosystemHub';
import { authClient } from '@/lib/auth-client';

// Rota raiz — hub do ecossistema. Renderizada fora do AppShell (ver __root.tsx):
// é o ponto de entrada acima de qualquer app, sem a chrome do CRM.
export const Route = createFileRoute('/')({
  component: EcosystemHub,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) {
      throw redirect({ to: '/sign-in' });
    }
  },
});
