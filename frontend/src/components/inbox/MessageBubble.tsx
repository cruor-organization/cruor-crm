/**
 * Bolha individual de mensagem (WhatsApp ou Email).
 */
import type { MockMessage } from '@/lib/mock-data/inbox';

interface MessageBubbleProps {
  message: MockMessage;
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDay(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOut = message.direction === 'out';

  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-card px-3 py-2 text-sm ${
          isOut
            ? 'rounded-br-sm bg-cruor-50 border border-cruor-200 text-neutral-800'
            : 'rounded-bl-sm border border-neutral-200 bg-white text-neutral-800'
        }`}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
        <p
          className={`mt-1 text-right font-mono text-[10px] ${isOut ? 'text-cruor-600' : 'text-neutral-400'}`}
        >
          {formatDay(message.sentAt)} {formatTime(message.sentAt)}
        </p>
      </div>
    </div>
  );
}
