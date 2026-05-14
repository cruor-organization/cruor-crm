/**
 * Rota /social — Calendário editorial de redes sociais via n8n (§10.10).
 * Calendário CSS grid manual — sem biblioteca de calendário.
 */
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { mockFetch } from '@/lib/mock-api';
import {
  mockSocialPosts,
  type SocialPost,
  type SocialPlatform,
  type PostStatus,
} from '@/lib/mock-data/social';

export const Route = createFileRoute('/social')({
  component: SocialPage,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const STATUS_VARIANT: Record<PostStatus, BadgeVariant> = {
  draft: 'neutral',
  scheduled: 'info',
  published: 'success',
};

const STATUS_LABEL: Record<PostStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  published: 'Publicado',
};

function PlatformIcon({ platform, size = 14 }: { platform: SocialPlatform; size?: number }) {
  if (platform === 'instagram') {
    // Instagram: câmara estilizada
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-pink-500"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </svg>
    );
  }
  // Facebook: "f" estilizado
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-blue-600"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/** Devolve "YYYY-MM-DD" para um post agendado ou publicado. */
function postDay(post: SocialPost): string | null {
  const dateStr = post.publishedAt ?? post.scheduledFor;
  if (!dateStr) return null;
  return dateStr.slice(0, 10);
}

/** Cria array de dias do mês, com offset de dia-da-semana. */
function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // Seg=0 … Dom=6
  const grid: (number | null)[] = Array<number | null>(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  // Completar para múltiplo de 7
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

// ---------------------------------------------------------------------------
// Post pill no calendário
// ---------------------------------------------------------------------------

function PostPill({ post }: { post: SocialPost }) {
  const colorClass =
    post.platform === 'instagram' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700';

  return (
    <div
      className={`flex items-center gap-0.5 truncate rounded px-1 py-0.5 text-[10px] font-medium ${colorClass}`}
    >
      <PlatformIcon platform={post.platform} size={10} />
      <span className="truncate">{post.caption.slice(0, 20)}…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Painel de posts de um dia
// ---------------------------------------------------------------------------

function DayPostsPanel({ day, posts }: { day: number | null; posts: SocialPost[] }) {
  if (day === null) return null;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-neutral-700">Posts — dia {day}</p>
      {posts.length === 0 ? (
        <p className="text-sm text-neutral-400">Sem posts neste dia.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-start gap-3 rounded-lg border border-neutral-100 p-3"
            >
              <PlatformIcon platform={post.platform} size={16} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[post.status]}>{STATUS_LABEL[post.status]}</Badge>
                  <span className="text-xs text-neutral-400 capitalize">{post.platform}</span>
                </div>
                <p className="mt-1 text-sm text-neutral-700">{post.caption}</p>
                <p className="mt-1 text-xs text-neutral-400 italic">{post.mediaPlaceholder}</p>
                {post.engagement && (
                  <p className="mt-1 text-xs text-neutral-500">
                    {post.engagement.likes} gostos · {post.engagement.comments} comentários
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

function SocialPage() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => mockFetch(mockSocialPosts),
  });

  const grid = buildCalendarGrid(viewYear, viewMonth);

  // Indexar posts por dia (YYYY-MM-DD)
  const postsByDay: Record<string, SocialPost[]> = {};
  for (const post of posts) {
    const day = postDay(post);
    if (!day) continue;
    postsByDay[day] ??= [];
    postsByDay[day].push(post);
  }

  function dayKey(d: number): string {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
    setSelectedDay(null);
  }

  const selectedPosts = selectedDay ? (postsByDay[dayKey(selectedDay)] ?? []) : [];

  // Próximos posts agendados (futuro, ordenados)
  const upcoming = posts
    .filter((p) => p.status === 'scheduled' && p.scheduledFor)
    .sort((a, b) => (a.scheduledFor ?? '').localeCompare(b.scheduledFor ?? ''))
    .slice(0, 8);

  const todayDay =
    now.getMonth() === viewMonth && now.getFullYear() === viewYear ? now.getDate() : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Redes sociais"
        subtitle="Calendário editorial Instagram + Facebook via n8n"
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowNewModal(true)}>
            Novo post
          </Button>
        }
      />

      {/* Calendário */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        {/* Cabeçalho do mês */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg p-1.5 hover:bg-neutral-100"
          >
            <ChevronLeft className="h-4 w-4 text-neutral-600" />
          </button>
          <p className="font-semibold text-neutral-900">
            {MONTHS_PT[viewMonth]} {viewYear}
          </p>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg p-1.5 hover:bg-neutral-100"
          >
            <ChevronRight className="h-4 w-4 text-neutral-600" />
          </button>
        </div>

        {/* Dias da semana */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="py-1 text-center text-xs font-medium text-neutral-400">
              {d}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-1">
          {grid.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="h-[80px]" />;
            }
            const key = dayKey(day);
            const dayPosts = postsByDay[key] ?? [];
            const isToday = day === todayDay;
            const isSelected = day === selectedDay;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`flex h-[80px] flex-col rounded-lg border p-1.5 text-left transition-colors ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-50'
                    : isToday
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-transparent hover:border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isToday ? 'text-emerald-600' : 'text-neutral-600'
                  }`}
                >
                  {day}
                </span>
                <div className="mt-0.5 flex flex-col gap-0.5 overflow-hidden">
                  {dayPosts.slice(0, 2).map((post) => (
                    <PostPill key={post.id} post={post} />
                  ))}
                  {dayPosts.length > 2 && (
                    <span className="text-[10px] text-neutral-400">
                      +{dayPosts.length - 2} mais
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel do dia seleccionado */}
      {selectedDay !== null && <DayPostsPanel day={selectedDay} posts={selectedPosts} />}

      {/* Próximos posts agendados */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Próximos posts agendados
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-neutral-400">Sem posts agendados.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"
              >
                <PlatformIcon platform={post.platform} size={16} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-neutral-500">
                      {post.scheduledFor
                        ? new Date(post.scheduledFor).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                    <Badge variant="info">Agendado</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-neutral-700">{post.caption}</p>
                  <p className="text-xs text-neutral-400 italic">{post.mediaPlaceholder}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => console.info('[Social] editar post agendado (mock):', post.id)}
                >
                  Editar
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal novo post */}
      <Modal open={showNewModal} title="Novo post" onClose={() => setShowNewModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Plataforma</label>
            <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Legenda</label>
            <textarea
              rows={3}
              placeholder="Escreva a legenda do post…"
              className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Media (placeholder)
            </label>
            <input
              type="text"
              placeholder="Ex: Foto flat-lay flores secas"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Data de publicação
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <p className="text-xs text-neutral-400">Mock — nenhum post será publicado via n8n.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                console.info('[Social] criar post (mock)');
                setShowNewModal(false);
              }}
            >
              Agendar post
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
