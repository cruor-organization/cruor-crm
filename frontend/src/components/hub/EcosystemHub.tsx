// frontend/src/components/hub/EcosystemHub.tsx
//
// Hub do ecossistema — ponto de entrada pós-login. Cartão "CRM" é o único
// navegável; os restantes são contexto ambiente com dados mock. Superfície
// escura, propositadamente distinta das apps (que são claras), para sinalizar
// "estás entre apps, não dentro de uma".
import { useNavigate } from '@tanstack/react-router';
import { animate, motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowUpRight, LogOut, Receipt, Users, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';

import { signOut, useSession } from '@/lib/auth-client';
import { crmSpaces, ecosystemApps, hubStats } from '@/lib/mock-data';

// Acento da marca-mãe (Cruor = sangue). Distinto dos 4 acentos dos CRMs, que
// vivem dentro do cartão herói com identidade própria.
const ACCENT = '#E23D51';

const EASE = [0.16, 1, 0.3, 1] as const;

const gridContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};

const cell: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

// ---- Conta-crescente para o número de receita ---------------------------
function useCountUp(target: number, duration = 1.4): number {
  const [value, setValue] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    const controls = animate(0, target, {
      duration,
      ease: EASE,
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [target, duration, reduced]);

  return value;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 20) return 'Boa tarde';
  return 'Boa noite';
}

// ---- Hub ----------------------------------------------------------------
export function EcosystemHub() {
  const { data: session } = useSession();
  const navigate = useNavigate();

  const fullName = session?.user.name ?? session?.user.email?.split('@')[0] ?? '';
  const firstName = fullName.split(/[\s@]+/)[0] ?? '';
  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const dateLabel = now.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/sign-in';
  };

  const billingApp = ecosystemApps.find((a) => a.id === 'billing');
  const flowsApp = ecosystemApps.find((a) => a.id === 'flows');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0C] text-white">
      {/* Atmosfera — halo do acento + grelha pontilhada + grão */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.22] blur-[120px]"
        style={{ background: ACCENT }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-[1180px] flex-col px-6 py-8 md:px-10 md:py-12">
        {/* ---- Cabeçalho ---- */}
        <motion.header
          className="flex items-start justify-between gap-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="flex flex-col gap-4">
            {/* O PNG do logo tem fundo escuro (#090909) e padding interno
                grandes. Recortamos para a caixa exacta do wordmark (medida:
                13,4–86,6% x, 40,1–58,6% y) para encostar à esquerda, alinhado
                com o texto abaixo; mix-blend lighten dissolve o fundo escuro. */}
            <div className="h-[30px] w-[237px] max-w-full shrink-0 self-start overflow-hidden">
              <img
                src="/cruor_logo_dark.png"
                alt="Cruor"
                className="h-[162px] w-[324px] max-w-none -translate-x-[43px] -translate-y-[65px]"
                style={{ mixBlendMode: 'lighten' }}
              />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                {dateLabel}
              </p>
              <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-white md:text-[34px]">
                {greeting}
                {firstName && (
                  <>
                    , <span style={{ color: ACCENT }}>{firstName}</span>
                  </>
                )}
              </h1>
              <p className="mt-1 text-sm text-white/45">
                O teu ecossistema num só sítio. Escolhe por onde começar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/55 transition-colors hover:border-white/20 hover:text-white"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </motion.header>

        {/* ---- Bento ---- */}
        <motion.div
          className="mt-10 grid flex-1 grid-cols-1 gap-3.5 md:auto-rows-[172px] md:grid-cols-6 md:gap-4"
          variants={gridContainer}
          initial="hidden"
          animate="show"
        >
          <CrmHeroCard onEnter={() => void navigate({ to: '/dashboard' })} />
          <RevenueCard />
          <TeamCard />
          <SoonCard
            icon={<Receipt size={20} />}
            name={billingApp?.name ?? 'Faturação'}
            tagline={billingApp?.tagline ?? ''}
          />
          <SoonCard
            icon={<Workflow size={20} />}
            name={flowsApp?.name ?? 'Automações'}
            tagline={flowsApp?.tagline ?? ''}
            spin
          />
          <SystemCard />
        </motion.div>

        {/* ---- Rodapé ---- */}
        <motion.footer
          className="mt-8 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-white/25"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <span>Cruor · Ecossistema</span>
          <span>v0.1 · interno</span>
        </motion.footer>
      </div>
    </div>
  );
}

// ---- Cartão herói: CRM (único navegável) --------------------------------
function CrmHeroCard({ onEnter }: { onEnter: () => void }) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onEnter}
      variants={cell}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="group relative col-span-1 flex min-h-[280px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416] p-7 text-left transition-colors hover:border-white/20 md:col-span-3 md:row-span-2 md:min-h-0"
    >
      {/* Halo do acento — intensifica no hover */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-[90px] transition-opacity duration-500 group-hover:opacity-50"
        style={{ background: ACCENT }}
      />

      <div className="relative flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Aplicação principal
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/55">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Ativo
        </span>
      </div>

      {/* Os 4 espaços do CRM — chips a flutuar */}
      <div className="relative flex items-center justify-center gap-3 py-2 md:gap-4">
        {crmSpaces.map((space, i) => (
          <motion.div
            key={space.chip}
            className="flex flex-col items-center gap-2"
            animate={reduced ? undefined : { y: [0, -9, 0] }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.35,
            }}
          >
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl text-base font-bold text-white shadow-lg md:h-16 md:w-16"
              style={{ backgroundColor: space.swatch }}
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-60 blur-md"
                style={{ background: space.swatch }}
              />
              <span className="relative">{space.chip}</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/45">
              {space.name}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="relative flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-[26px]">
            Cruor CRM
          </h2>
          <p className="mt-1 text-sm text-white/45">
            4 espaços comerciais — Flora, Forge, Pulse e Studio.
          </p>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-transform duration-300 group-hover:translate-x-0.5"
          style={{ backgroundColor: ACCENT }}
        >
          Entrar
          <ArrowUpRight
            size={15}
            className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </motion.button>
  );
}

// ---- Cartão de receita (ambiente) ---------------------------------------
function RevenueCard() {
  const reduced = useReducedMotion();
  const value = useCountUp(hubStats.revenueEur);
  // pt-PT agrupa com espaço estreito; o resto da app usa ponto — alinhar.
  const formatted = `€ ${Math.round(value).toLocaleString('pt-PT').replace(/\s/g, '.')}`;

  // Alturas das barras do equalizador — estáticas mas com fase animada.
  const bars = [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.45, 0.75, 0.55];

  return (
    <AmbientCard className="md:col-span-3">
      <div className="flex items-start justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Receita · 30 dias
        </span>
        <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
          {hubStats.revenueDelta}
        </span>
      </div>

      <div className="flex items-end justify-between gap-4">
        <p className="text-3xl font-bold tracking-tight tabular-nums text-white md:text-[32px]">
          {formatted}
        </p>
        <div className="flex h-12 items-end gap-1">
          {bars.map((h, i) => (
            <motion.span
              key={i}
              className="w-1.5 rounded-full bg-white/25"
              style={{ height: `${h * 100}%` }}
              animate={reduced ? undefined : { scaleY: [1, 0.55, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.12,
              }}
            />
          ))}
        </div>
      </div>
    </AmbientCard>
  );
}

// ---- Cartão da equipa (ambiente) ----------------------------------------
function TeamCard() {
  const reduced = useReducedMotion();
  const { team } = hubStats;
  const onlineMembers = team.filter((m) => m.online);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (reduced || onlineMembers.length === 0) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % onlineMembers.length);
    }, 1600);
    return () => clearInterval(id);
  }, [reduced, onlineMembers.length]);

  const activeMember = onlineMembers[activeIdx];

  return (
    <AmbientCard className="md:col-span-3">
      <div className="flex items-start justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Equipa
        </span>
        <Users size={14} className="text-white/30" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex -space-x-2.5">
          {team.map((m) => {
            const isActive = m.online && m.initials === activeMember?.initials;
            return (
              <motion.div
                key={m.initials}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#141416] bg-white/[0.07] text-[12px] font-semibold text-white/70"
                animate={
                  isActive && !reduced
                    ? { scale: [1, 1.12, 1], borderColor: ['#141416', ACCENT, '#141416'] }
                    : undefined
                }
                transition={{ duration: 1.4, ease: 'easeInOut' }}
                style={{ opacity: m.online ? 1 : 0.4 }}
              >
                {m.initials}
                {m.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#141416] bg-emerald-400" />
                )}
              </motion.div>
            );
          })}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-white">
            {onlineMembers.length}
            <span className="text-base font-medium text-white/35"> / {team.length}</span>
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
            online agora
          </p>
        </div>
      </div>
    </AmbientCard>
  );
}

// ---- Cartão "Em breve" (ambiente) ---------------------------------------
function SoonCard({
  icon,
  name,
  tagline,
  spin = false,
}: {
  icon: React.ReactNode;
  name: string;
  tagline: string;
  spin?: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <AmbientCard className="md:col-span-2">
      <div className="flex items-start justify-between">
        <div className="relative flex h-12 w-12 items-center justify-center">
          {/* Anel tracejado a rodar lentamente */}
          <motion.span
            className="absolute inset-0 rounded-full border border-dashed border-white/15"
            animate={reduced ? undefined : { rotate: spin ? -360 : 360 }}
            transition={{ duration: spin ? 18 : 24, repeat: Infinity, ease: 'linear' }}
          />
          <motion.span
            className="text-white/50"
            animate={reduced ? undefined : { y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {icon}
          </motion.span>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
          Em breve
        </span>
      </div>

      <div>
        <h3 className="text-base font-semibold tracking-tight text-white/85">{name}</h3>
        <p className="mt-0.5 text-[13px] text-white/40">{tagline}</p>
      </div>
    </AmbientCard>
  );
}

// ---- Cartão de estado do sistema (ambiente) -----------------------------
function SystemCard() {
  const reduced = useReducedMotion();
  const pulses = [0, 1, 2];

  return (
    <AmbientCard className="md:col-span-2">
      <div className="flex items-start justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Sistema
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400">
          {hubStats.uptimePct}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center">
          {pulses.map((p) => (
            <motion.span
              key={p}
              className="absolute inset-0 rounded-full border border-emerald-400/40"
              initial={{ scale: 0.4, opacity: 0.8 }}
              animate={reduced ? { scale: 1, opacity: 0.3 } : { scale: 2.2, opacity: 0 }}
              transition={{ duration: 2.8, repeat: Infinity, delay: p * 0.9, ease: 'easeOut' }}
            />
          ))}
          <span className="relative h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
        </div>
        <div>
          <p className="text-base font-semibold tracking-tight text-white/85">Operacional</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
            todos os serviços
          </p>
        </div>
      </div>
    </AmbientCard>
  );
}

// ---- Base partilhada dos cartões ambiente (não-navegáveis) --------------
function AmbientCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={cell}
      className={`flex min-h-[160px] cursor-default flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#141416] p-6 md:min-h-0 ${className}`}
    >
      {children}
    </motion.div>
  );
}
