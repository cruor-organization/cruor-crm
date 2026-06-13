/**
 * Rota /chatbot — Assistente RAG read-only (§10.8), ligado ao backend real.
 * Lista/cria conversas, carrega mensagens e faz stream SSE da resposta do agente
 * (token/tool_call/tool_result/product_card/done/error). Tools de escrita (DRAFT)
 * ficam para um slice posterior.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Bot, ChevronRight, Send, User, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export const Route = createFileRoute('/chatbot')({
  component: ChatbotPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ---------------------------------------------------------------------------
// Tipos (alinhados com o backend §10.8)
// ---------------------------------------------------------------------------

type ToolCallStatus = 'running' | 'done';

interface UiToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: ToolCallStatus;
}

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: UiToolCall[];
}

interface ConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConversationDetail extends ConversationSummary {
  messages: {
    id: string;
    role: string;
    content: string;
    toolCalls: unknown;
    createdAt: string;
  }[];
}

// ---------------------------------------------------------------------------
// Subcomponentes de apresentação
// ---------------------------------------------------------------------------

function ToolCallCard({ name, input, output, status }: UiToolCall) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="my-1 rounded-control border border-blue-200 bg-blue-50 px-3 py-2 text-xs">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left font-mono text-blue-700"
      >
        <Zap className="h-3 w-3 shrink-0" />
        <span className="font-semibold">{name}</span>
        {status === 'running' && <span className="ml-auto text-blue-400">a executar…</span>}
        {status === 'done' && <span className="ml-auto text-green-600">concluído</span>}
        <ChevronRight
          className={`ml-1 h-3 w-3 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="mt-2 space-y-1">
          <p className="text-neutral-500">Input:</p>
          <pre className="overflow-x-auto rounded bg-surface p-2 text-neutral-700">
            {JSON.stringify(input, null, 2)}
          </pre>
          {output !== undefined && (
            <>
              <p className="text-neutral-500">Output:</p>
              <pre className="overflow-x-auto rounded bg-surface p-2 text-neutral-700">
                {JSON.stringify(output, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
          isUser ? 'bg-cruor-500' : 'bg-neutral-400'
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={`flex max-w-[75%] flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser &&
          message.toolCalls?.map((tc) => (
            <ToolCallCard key={tc.id} {...tc} />
          ))}
        {message.content && (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              isUser
                ? 'rounded-tr-sm bg-cruor-600 text-white'
                : 'rounded-tl-sm border border-neutral-200 bg-surface text-neutral-800'
            }`}
          >
            {message.content.split('\n').map((line, i) => {
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
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SSE: consome o stream de /conversations/:id/messages
// ---------------------------------------------------------------------------

interface SseEvent {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  output?: unknown;
}

async function streamMessage(
  conversationId: string,
  content: string,
  onEvent: (e: SseEvent) => void,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chatbot/conversations/${conversationId}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok || !res.body) {
    onEvent({ type: 'error', text: `Erro ${res.status}` });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const line = block.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      try {
        onEvent(JSON.parse(json) as SseEvent);
      } catch {
        /* ignora frames malformados */
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

function toUiToolCalls(raw: unknown): UiToolCall[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((t) => {
    const tc = t as { id?: string; name?: string; input?: Record<string, unknown>; output?: unknown };
    return {
      id: String(tc.id ?? ''),
      name: String(tc.name ?? ''),
      input: tc.input ?? {},
      output: tc.output,
      status: 'done' as const,
    };
  });
}

function ChatbotPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['chatbot-conversations'],
    queryFn: () => api.get<ConversationSummary[]>('/api/chatbot/conversations'),
  });

  // Seleciona a primeira conversa por omissão.
  useEffect(() => {
    if (selectedId === null && conversations.length > 0) {
      setSelectedId(conversations[0]?.id ?? null);
    }
  }, [conversations, selectedId]);

  // Carrega mensagens da conversa selecionada.
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    void api.get<ConversationDetail>(`/api/chatbot/conversations/${selectedId}`).then((conv) => {
      if (cancelled) return;
      setMessages(
        conv.messages.map((m) => ({
          id: m.id,
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
          toolCalls: toUiToolCalls(m.toolCalls),
        })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createConversation = useMutation({
    mutationFn: () => api.post<ConversationSummary>('/api/chatbot/conversations', {}),
    onSuccess: async (conv) => {
      await queryClient.invalidateQueries({ queryKey: ['chatbot-conversations'] });
      setSelectedId(conv.id);
      setMessages([]);
    },
  });

  async function handleSend() {
    const text = draft.trim();
    if (!text || !selectedId || streaming) return;
    setDraft('');
    setStreaming(true);

    const userMsg: UiMessage = { id: `local-u-${Date.now()}`, role: 'user', content: text };
    const assistantId = `local-a-${Date.now()}`;
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);

    const updateAssistant = (fn: (m: UiMessage) => UiMessage): void => {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)));
    };

    try {
      await streamMessage(selectedId, text, (e) => {
        if (e.type === 'token' && e.text) {
          updateAssistant((m) => ({ ...m, content: m.content + e.text }));
        } else if (e.type === 'tool_call') {
          updateAssistant((m) => ({
            ...m,
            toolCalls: [
              ...(m.toolCalls ?? []),
              { id: String(e.id), name: String(e.name), input: e.input ?? {}, status: 'running' },
            ],
          }));
        } else if (e.type === 'tool_result') {
          updateAssistant((m) => ({
            ...m,
            toolCalls: m.toolCalls?.map((tc) =>
              tc.id === String(e.id) ? { ...tc, output: e.output, status: 'done' } : tc,
            ),
          }));
        } else if (e.type === 'error' && e.text) {
          updateAssistant((m) => ({ ...m, content: m.content + `\n_[erro: ${e.text}]_` }));
        }
      });
    } finally {
      setStreaming(false);
      void queryClient.invalidateQueries({ queryKey: ['chatbot-conversations'] });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void handleSend();
    }
  }

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="-mx-6 -mt-6 flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar esquerda: conversas */}
      <div className="flex w-[280px] shrink-0 flex-col border-r border-neutral-200 bg-surface">
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
                conv.id === selectedId ? 'bg-cruor-50' : ''
              }`}
            >
              <p
                className={`truncate text-sm font-medium ${
                  conv.id === selectedId ? 'text-cruor-700' : 'text-neutral-800'
                }`}
              >
                {conv.title ?? 'Nova conversa'}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {new Date(conv.updatedAt).toLocaleDateString('pt-PT')}
              </p>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-neutral-400">Sem conversas ainda.</p>
          )}
        </div>
        <div className="border-t border-neutral-200 px-4 py-3">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => createConversation.mutate()}
            disabled={createConversation.isPending}
          >
            Nova conversa
          </Button>
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex flex-1 flex-col bg-neutral-50">
        <div className="flex items-center gap-3 border-b border-neutral-200 bg-surface px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cruor-100">
            <Bot className="h-4 w-4 text-cruor-700" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Assistente RAG</p>
            <p className="text-xs text-neutral-500">{selected?.title ?? 'Selecione uma conversa'}</p>
          </div>
          <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
            Apenas leitura
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {!selectedId && (
            <p className="mt-10 text-center text-sm text-neutral-400">
              Cria ou seleciona uma conversa para começar.
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-neutral-200 bg-surface px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Faça uma pergunta… (Ctrl+Enter para enviar)"
              rows={2}
              disabled={!selectedId || streaming}
              className="flex-1 resize-none rounded-control border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-cruor-500 focus:ring-1 focus:ring-cruor-500 disabled:bg-neutral-50"
            />
            <Button
              icon={<Send className="h-4 w-4" />}
              onClick={() => void handleSend()}
              disabled={!draft.trim() || !selectedId || streaming}
            >
              {streaming ? '…' : 'Enviar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
