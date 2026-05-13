import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
});

function OrdersPage() {
  return <MockPage title="Encomendas" subtitle="Encomendas de clientes — pipeline e estados" />;
}
