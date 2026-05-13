import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/reports/margins')({
  component: MarginsPage,
});

function MarginsPage() {
  return <MockPage title="Margens" subtitle="Análise de margens por produto, florista e período" />;
}
