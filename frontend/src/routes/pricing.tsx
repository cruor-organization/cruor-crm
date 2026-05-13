import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
});

function PricingPage() {
  return <MockPage title="Preços" subtitle="Listas de preços e descontos por florista" />;
}
