import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/routes')({
  component: RoutesPage,
});

function RoutesPage() {
  return <MockPage title="Rotas" subtitle="Planeamento de rotas de visita por zona" />;
}
