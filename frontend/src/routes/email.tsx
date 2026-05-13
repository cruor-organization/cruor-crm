import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/email')({
  component: EmailPage,
});

function EmailPage() {
  return (
    <MockPage title="Email marketing" subtitle="Envio de newsletters e comunicações por email" />
  );
}
