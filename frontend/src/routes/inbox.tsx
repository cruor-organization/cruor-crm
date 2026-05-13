import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/inbox')({
  component: InboxPage,
});

function InboxPage() {
  return <MockPage title="Inbox" subtitle="Mensagens e notificações dos floristas" />;
}
