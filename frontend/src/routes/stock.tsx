import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/stock')({
  component: StockPage,
});

function StockPage() {
  return <MockPage title="Stock" subtitle="Inventário e movimentos de stock por armazém" />;
}
