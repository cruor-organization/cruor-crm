import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/chatbot')({
  component: ChatbotPage,
});

function ChatbotPage() {
  return <MockPage title="Chatbot IA" subtitle="Assistente inteligente para suporte a floristas" />;
}
