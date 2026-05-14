/**
 * Rota /chatbot — Assistente RAG com suporte a tool calls e DRAFTs (§10.8).
 */
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Bot, Check, ChevronRight, Send, User, X, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { mockFetch } from '@/lib/mock-api';
import {
  mockChatConversations,
  type ChatConversation,
  type ChatMessage,
  type ToolCallStatus,
} from '@/lib/mock-data/chatbot';

export const Route = createFileRoute('/chatbot')({
  component: ChatbotPage,
});

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

interface ToolCallCardProps {
  id: string;
  name: string;
  input: Record<string, unknown>;
  outputJson: string | null;
  status: ToolCallStatus;
}

function ToolCallCard({ name, input, outputJson, status }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="my-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left font-mono text-blue-700"
      >
        <Zap className="h-3 w-3 shrink-0" />
        <span className="font-semibold">{name}</span>
        {status === 'running' && <span className="ml-auto text-blue-400">a executar…</span>}
        {status === 'done' && <span className="ml-auto text-emerald-600">concluído</span>}
        <ChevronRight
          className={`ml-1 h-3 w-3 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="mt-2 space-y-1">
          <p className="text-neutral-500">Input:</p>
          <pre className="overflow-x-auto rounded bg-white p-2 text-neutral-700">
            {JSON.stringify(input, null, 2)}
          </pre>
          {outputJson !== null && (
            <>
              <p className="text-neutral-500">Output:</p>
              <pre className="overflow-x-auto rounded bg-white p-2 text-neutral-700">
                {outputJson}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DraftCard({
  draftId,
  onConfirm,
  onDiscard,
}: {
  draftId: string;
  onConfirm: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="my-2 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        DRAFT — requer confirmação
      </p>
      <p className="mt-1 text-sm text-neutral-700">
        O orçamento <span className="font-mono font-semibold">{draftId}</span> foi preparado mas
        ainda não foi enviado. Confirme para prosseguir.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={onConfirm} icon={<Check className="h-3.5 w-3.5" />}>
          Confirmar
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard} icon={<X className="h-3.5 w-3.5" />}>
          Descartar
        </Button>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onConfirmDraft,
  onDiscardDraft,
}: {
  message: ChatMessage;
  onConfirmDraft: (id: string) => void;
  onDiscardDraft: (id: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
          isUser ? 'bg-emerald-500' : 'bg-neutral-400'
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      {/* Conteúdo */}
      <div
        className={`max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}
      >
        {/* Tool call */}
        {message.toolCall && !isUser && (
          <ToolCallCard
            id={message.toolCall.id}
            name={message.toolCall.name}
            input={message.toolCall.input}
            outputJson={
              message.toolCall.output !== undefined
                ? JSON.stringify(message.toolCall.output, null, 2)
                : null
            }
            status={message.toolCall.status}
          />
        )}

        {/* Texto */}
        {message.content && (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              isUser
                ? 'rounded-tr-sm bg-emerald-600 text-white'
                : 'rounded-tl-sm bg-white text-neutral-800 shadow-sm ring-1 ring-neutral-100'
            }`}
          >
            {message.content.split('\n').map((line, i) => {
              // Renderizar **negrito** simples
              const parts = line.split(/\*\*(.*?)\*\*/g);
              return (
                <p key={i} className={i > 0 ? 'mt-1' : ''}>
                  {parts.map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>,
                  )}
                </p>
              );
            })}
          </div>
        )}

        {/* Draft card */}
        {message.isDraft &&
          message.draftConfirmed === null &&
          Boolean(message.toolCall?.output) && (
            <DraftCard
              draftId={(message.toolCall?.output as { draftId: string }).draftId}
              onConfirm={() => onConfirmDraft(message.id)}
              onDiscard={() => onDiscardDraft(message.id)}
            />
          )}
        {message.isDraft && message.draftConfirmed === true && (
          <p className="text-xs text-emerald-600">✓ Orçamento confirmado (mock)</p>
        )}
        {message.isDraft && message.draftConfirmed === false && (
          <p className="text-xs text-neutral-400">Orçamento descartado</p>
        )}

        <p className="text-[10px] text-neutral-400">
          {new Date(message.timestamp).toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

function ChatbotPage() {
  const [selectedId, setSelectedId] = useState<string>('conv-001');
  const [draft, setDraft] = useState('');
  const [draftStates, setDraftStates] = useState<Record<string, boolean | null>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['chatbot-conversations'],
    queryFn: () => mockFetch(mockChatConversations),
  });

  const selected: ChatConversation | undefined = conversations.find((c) => c.id === selectedId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId]);

  function handleSend() {
    if (!draft.trim()) return;
    console.info('[Chatbot] enviar mensagem (mock):', {
      conversationId: selectedId,
      text: draft.trim(),
    });
    setDraft('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleConfirmDraft(messageId: string) {
    console.info('[Chatbot] confirmar DRAFT (mock):', messageId);
    setDraftStates((prev) => ({ ...prev, [messageId]: true }));
  }

  function handleDiscardDraft(messageId: string) {
    console.info('[Chatbot] descartar DRAFT (mock):', messageId);
    setDraftStates((prev) => ({ ...prev, [messageId]: false }));
  }

  return (
    <div className="-mx-6 -mt-6 flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar esquerda: conversas */}
      <div className="flex w-[280px] shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <p className="text-sm font-semibold text-neutral-900">Conversas</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => setSelectedId(conv.id)}
              className={`w-full border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                conv.id === selectedId ? 'bg-emerald-50' : ''
              }`}
            >
              <p
                className={`truncate text-sm font-medium ${
                  conv.id === selectedId ? 'text-emerald-700' : 'text-neutral-800'
                }`}
              >
                {conv.title}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {new Date(conv.startedAt).toLocaleDateString('pt-PT')} · {conv.messages.length}{' '}
                mensagens
              </p>
            </button>
          ))}
        </div>
        <div className="border-t border-neutral-200 px-4 py-3">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => console.info('[Chatbot] nova conversa (mock)')}
          >
            Nova conversa
          </Button>
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex flex-1 flex-col bg-neutral-50">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-5 py-3 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <Bot className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Assistente RAG</p>
            <p className="text-xs text-neutral-500">
              {selected?.title ?? 'Selecione uma conversa'}
            </p>
          </div>
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
            Apenas leitura por omissão · DRAFT requer confirmação
          </span>
        </div>

        {/* Mensagens */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {selected?.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={{
                ...msg,
                draftConfirmed: msg.isDraft
                  ? draftStates[msg.id] !== undefined
                    ? draftStates[msg.id]
                    : msg.draftConfirmed
                  : undefined,
              }}
              onConfirmDraft={handleConfirmDraft}
              onDiscardDraft={handleDiscardDraft}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-neutral-200 bg-white px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Faça uma pergunta… (Ctrl+Enter para enviar)"
              rows={2}
              className="flex-1 resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <Button
              icon={<Send className="h-4 w-4" />}
              onClick={handleSend}
              disabled={!draft.trim()}
            >
              Enviar
            </Button>
          </div>
          <p className="mt-1 text-right text-xs text-neutral-400">Mock — sem ligação ao backend</p>
        </div>
      </div>
    </div>
  );
}
