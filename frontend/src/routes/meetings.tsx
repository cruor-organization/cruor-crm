import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/meetings')({
  component: MeetingsPage,
});

function MeetingsPage() {
  return <MockPage title="Reuniões" subtitle="Transcrição e resumo automático de reuniões" />;
}
