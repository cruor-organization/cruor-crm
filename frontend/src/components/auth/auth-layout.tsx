// frontend/src/components/auth/auth-layout.tsx
//
// Moldura partilhada dos ecrãs de autenticação (sign-in / sign-up). Superfície
// escura e atmosférica alinhada com o hub do ecossistema ('/'): preto
// #0A0A0C, acento Cruor, tipografia mono nas etiquetas e as três camadas de
// ambiente (halo + grelha pontilhada + grão). O conteúdo específico de cada
// ecrã (o cartão de formulário) entra como children.
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { ReactNode } from 'react';

// Acento da marca-mãe — partilhado com o hub do ecossistema.
export const ACCENT = '#E23D51';
export const EASE = [0.16, 1, 0.3, 1] as const;

// Input escuro — eco dos cartões do hub. Foco assinala com o acento.
export const inputCls =
  'h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/25 transition-colors duration-150 focus:border-[color:var(--accent)] focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/25';

const panelStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const panelItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

// Logótipo Cruor — o PNG tem fundo escuro e padding interno; recorta-se para a
// caixa exacta do wordmark (mesma técnica do hub) e mix-blend dissolve o fundo.
export function CruorWordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`h-[30px] w-[237px] max-w-full shrink-0 overflow-hidden ${className}`}>
      <img
        src="/cruor_logo_dark.png"
        alt="Cruor"
        className="h-[162px] w-[324px] max-w-none -translate-x-[43px] -translate-y-[65px]"
        style={{ mixBlendMode: 'lighten' }}
      />
    </div>
  );
}

// ---- Painel de marca (esconde em mobile) --------------------------------
function BrandPanel() {
  return (
    <motion.div
      className="hidden flex-col justify-between py-2 lg:flex"
      variants={panelStagger}
      initial="hidden"
      animate="show"
    >
      {/* Logótipo + texto agrupados — o logótipo encosta ao bloco de texto */}
      <div>
        <motion.div variants={panelItem}>
          <CruorWordmark />
        </motion.div>

        <motion.div variants={panelItem} className="mt-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
            CRM · Ecossistema
          </p>
          <h2 className="mt-3 max-w-[18ch] text-[34px] font-semibold leading-[1.1] tracking-tight text-white">
            Quatro espaços. Um <span style={{ color: ACCENT }}>ecossistema</span>.
          </h2>
          <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-white/45">
            Gere floristas, stock, preços e encomendas a partir de um único acesso — em tempo real.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Flora', 'Forge', 'Pulse', 'Studio'].map((space) => (
              <span
                key={space}
                className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45"
              >
                {space}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={panelItem}
        className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-white/25"
      >
        <span>Cruor · Ecossistema</span>
        <span>v0.1 · interno</span>
      </motion.div>
    </motion.div>
  );
}

// ---- Moldura ------------------------------------------------------------
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#0A0A0C] text-white"
      style={{ ['--accent' as string]: ACCENT }}
    >
      {/* Atmosfera — halos do acento + grelha pontilhada + grão (igual ao hub) */}
      <div
        className="pointer-events-none absolute -left-48 -top-48 h-[560px] w-[560px] rounded-full opacity-[0.2] blur-[130px]"
        style={{ background: ACCENT }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full opacity-[0.12] blur-[120px]"
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

      <div className="relative mx-auto grid min-h-screen max-w-[1180px] grid-cols-1 px-6 py-10 md:px-10 lg:grid-cols-2 lg:gap-16">
        <BrandPanel />

        <div className="flex items-center justify-center py-8 lg:py-2">
          <motion.div
            className="w-full max-w-[400px]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
          >
            {/* Logótipo — só em mobile, onde o painel de marca está escondido */}
            <CruorWordmark className="mb-10 lg:hidden" />
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
