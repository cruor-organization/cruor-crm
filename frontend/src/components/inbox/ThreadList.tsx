/**
 * Lista de conversas do Inbox com filtros e pesquisa.
 */
import { MessageCircle, Mail, Search } from 'lucide-react';

import type { MockThread } from '@/lib/mock-data/inbox';

type Filter = 'all' | 'unread' | 'whatsapp' | 'email';

interface ThreadListProps {
  threads: MockThread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filter: Filter;
  onFilterChange: (f: Filter) => void;
  search: string;
  onSearchChange: (s: string) => void;
}

const FILTER_PILLS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'unread', label: 'Não lidas' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'email', label: 'Email' },
];

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function lastPreview(thread: MockThread): string {
  const last = thread.messages[thread.messages.length - 1];
  if (!last) return '';
  const prefix = last.direction === 'out' ? 'Tu: ' : '';
  const text = `${prefix}${last.body}`;
  return text.length > 55 ? `${text.slice(0, 55)}…` : text;
}

export function ThreadList({
  threads,
  selectedId,
  onSelect,
  filter,
  onFilterChange,
  search,
  onSearchChange,
}: ThreadListProps) {
  const visible = threads.filter((t) => {
    if (filter === 'unread' && t.unreadCount === 0) return false;
    if (filter === 'whatsapp' && t.channel !== 'whatsapp') return false;
    if (filter === 'email' && t.channel !== 'email') return false;
    if (search && !t.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col border-r border-neutral-200 bg-white">
      {/* Cabeçalho + pesquisa */}
      <div className="space-y-2 border-b border-neutral-200 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Pesquisar florista…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-md border border-neutral-200 py-1.5 pl-8 pr-3 text-sm outline-none placeholder:text-neutral-400 focus:border-cruor-500 focus:ring-1 focus:ring-cruor-500"
          />
        </div>
        {/* Filtros */}
        <div className="flex flex-wrap gap-1">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => onFilterChange(pill.key)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border ${
                filter === pill.key
                  ? 'bg-cruor-600 border-cruor-600 text-white'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-400">
            Nenhuma conversa encontrada.
          </p>
        ) : (
          visible.map((thread) => {
            const selected = thread.id === selectedId;
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelect(thread.id)}
                className={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-neutral-50 ${
                  selected ? 'bg-cruor-50 border-r-2 border-cruor-500' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    selected ? 'bg-cruor-600 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {initials(thread.customerName)}
                </div>

                {/* Conteúdo */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`truncate text-sm ${thread.unreadCount > 0 ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}
                    >
                      {thread.customerName}
                    </span>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {relativeTime(thread.lastMessageAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {thread.channel === 'whatsapp' ? (
                      <MessageCircle className="h-3 w-3 shrink-0 text-cruor-500" />
                    ) : (
                      <Mail className="h-3 w-3 shrink-0 text-blue-400" />
                    )}
                    <span
                      className={`truncate text-xs ${thread.unreadCount > 0 ? 'text-neutral-700' : 'text-neutral-400'}`}
                    >
                      {lastPreview(thread)}
                    </span>
                    {thread.unreadCount > 0 && (
                      <span className="ml-auto shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-cruor-600 text-[10px] font-bold text-white">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
