import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/returns')({
  component: ReturnsPage,
});

function ReturnsPage() {
  return <MockPage title="Devoluções" subtitle="Gestão de devoluções e notas de crédito" />;
}
