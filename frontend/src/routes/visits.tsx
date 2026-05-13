import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/visits')({
  component: VisitsPage,
});

function VisitsPage() {
  return <MockPage title="Visitas" subtitle="Gestão de visitas comerciais aos floristas" />;
}
