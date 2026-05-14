/**
 * Rota /meetings — Reuniões com resumos Fathom (§10.6).
 */
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ExternalLink, Tag, User, Video } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/format';
import { mockFetch } from '@/lib/mock-api';
import { mockMeetings, type Meeting } from '@/lib/mock-data/meetings';

export const Route = createFileRoute('/meetings')({
  component: MeetingsPage,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function durationLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

function MeetingsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => mockFetch(mockMeetings),
  });

  // Selecionar a primeira reunião por omissão
  const effectiveId = selectedId ?? meetings[0]?.id ?? null;
  const selected: Meeting | undefined = meetings.find((m) => m.id === effectiveId);

  function toggleItem(key: string) {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="-mx-6 -mt-6 flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Lista esquerda */}
      <div className="flex w-[320px] shrink-0 flex-col border-r border-neutral-200 bg-surface">
        <div className="border-b border-neutral-200 px-4 py-3">
          <p className="text-sm font-semibold text-neutral-900">
            Reuniões
            {!isLoading && <span className="ml-2 text-neutral-400">({meetings.length})</span>}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-sm text-neutral-400">
              A carregar…
            </div>
          ) : (
            meetings.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`w-full border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                  m.id === effectiveId ? 'bg-cruor-50' : ''
                }`}
              >
                <p
                  className={`truncate text-sm font-medium ${
                    m.id === effectiveId ? 'text-cruor-700' : 'text-neutral-800'
                  }`}
                >
                  {m.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
                  <span>{formatDate(m.date)}</span>
                  <span>·</span>
                  <span>{durationLabel(m.durationMin)}</span>
                  {m.customerName && (
                    <>
                      <span>·</span>
                      <span className="truncate text-neutral-500">{m.customerName}</span>
                    </>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Painel de detalhe */}
      <div className="flex flex-1 flex-col overflow-hidden bg-neutral-50">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
            Selecione uma reunião
          </div>
        ) : (
          <>
            {/* Cabeçalho */}
            <div className="border-b border-neutral-200 bg-surface px-6 py-4">
              <PageHeader
                title={selected.title}
                subtitle={`${formatDate(selected.date)} · ${durationLabel(selected.durationMin)}`}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Video className="h-4 w-4" />}
                    onClick={() => {
                      console.info('[Meetings] abrir gravação (mock):', selected.recordingUrl);
                    }}
                  >
                    Abrir gravação
                  </Button>
                }
              />

              {/* Meta */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {selected.customerName && (
                  <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                    <User className="h-4 w-4 text-neutral-400" />
                    {selected.customerName}
                  </span>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map((tag) => (
                    <Badge key={tag} variant="info">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Corpo */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mx-auto max-w-3xl space-y-6">
                {/* Resumo */}
                <section>
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                    Resumo
                  </h2>
                  <p className="text-sm leading-relaxed text-neutral-700">{selected.summary}</p>
                </section>

                {/* Acção items */}
                <section>
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                    Acções pendentes
                  </h2>
                  <ul className="space-y-2">
                    {selected.actionItems.map((item, i) => {
                      const key = `${selected.id}-${i}`;
                      const checked = !!checkedItems[key];
                      return (
                        <li key={key} className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleItem(key)}
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              checked
                                ? 'border-cruor-500 bg-cruor-500'
                                : 'border-neutral-300 bg-surface hover:border-cruor-400'
                            }`}
                          >
                            {checked && (
                              <svg
                                className="h-2.5 w-2.5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </button>
                          <span
                            className={`text-sm ${
                              checked ? 'text-neutral-400 line-through' : 'text-neutral-700'
                            }`}
                          >
                            {item}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                {/* Ligações */}
                <section>
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                    Ligações
                  </h2>
                  <a
                    href={selected.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      console.info('[Meetings] abrir gravação (mock):', selected.recordingUrl);
                    }}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Gravação Fathom
                  </a>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
