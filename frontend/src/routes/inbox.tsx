/**
 * Rota /inbox — Inbox unificado WhatsApp + Email.
 */
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Mail, MessageCircle, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { MessageBubble } from '@/components/inbox/MessageBubble';
import { ThreadList } from '@/components/inbox/ThreadList';
import { Button } from '@/components/ui/Button';
import { mockFetch } from '@/lib/mock-api';
import { mockThreads, type MockThread } from '@/lib/mock-data/inbox';

export const Route = createFileRoute('/inbox')({
  component: InboxPage,
});

type Filter = 'all' | 'unread' | 'whatsapp' | 'email';

function InboxPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['inbox-threads'],
    queryFn: () => mockFetch(mockThreads),
  });

  // Selecionar primeiro thread com mensagens não lidas (ou o primeiro disponível)
  useEffect(() => {
    if (threads.length === 0 || selectedId) return;
    const firstUnread = threads.find((t) => t.unreadCount > 0);
    setSelectedId(firstUnread?.id ?? threads[0]?.id ?? null);
  }, [threads, selectedId]);

  // Auto-scroll para o fundo quando muda o thread selecionado
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId]);

  const selected: MockThread | undefined = threads.find((t) => t.id === selectedId);

  function handleSend() {
    if (!draft.trim()) return;
    console.info('[Inbox] enviar mensagem (mock):', { threadId: selectedId, body: draft.trim() });
    setDraft('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="-mx-6 -mt-6 flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Coluna esquerda: lista de threads */}
      <div className="w-[340px] shrink-0">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            A carregar…
          </div>
        ) : (
          <ThreadList
            threads={threads}
            selectedId={selectedId}
            onSelect={setSelectedId}
            filter={filter}
            onFilterChange={setFilter}
            search={search}
            onSearchChange={setSearch}
          />
        )}
      </div>

      {/* Coluna direita: conversa */}
      <div className="flex flex-1 flex-col bg-neutral-50">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
            Selecione uma conversa
          </div>
        ) : (
          <>
            {/* Cabeçalho da conversa */}
            <div className="flex items-center gap-3 border-b border-neutral-200 bg-surface px-5 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cruor-100 text-xs font-semibold text-cruor-700">
                {selected.customerName
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-neutral-900">{selected.customerName}</p>
                <div className="flex items-center gap-1 text-xs text-neutral-500">
                  {selected.channel === 'whatsapp' ? (
                    <>
                      <MessageCircle className="h-3 w-3 text-cruor-500" />
                      <span>WhatsApp</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-3 w-3 text-blue-400" />
                      <span>Email</span>
                    </>
                  )}
                  <span className="ml-2 text-neutral-300">·</span>
                  <span>{selected.messages.length} mensagens</span>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {selected.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Footer: texto + enviar */}
            <div className="border-t border-neutral-200 bg-surface px-4 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selected.channel === 'whatsapp'
                      ? 'Escrever mensagem WhatsApp… (Ctrl+Enter para enviar)'
                      : 'Escrever email… (Ctrl+Enter para enviar)'
                  }
                  rows={2}
                  className="flex-1 resize-none rounded-control border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-cruor-500 focus:ring-1 focus:ring-cruor-500"
                />
                <Button
                  icon={<Send className="h-4 w-4" />}
                  onClick={handleSend}
                  disabled={!draft.trim()}
                >
                  Enviar
                </Button>
              </div>
              <p className="mt-1 text-right text-xs text-neutral-400">
                Mock — nenhuma mensagem será enviada
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
