// frontend/src/components/auth/auth-layout.tsx
//
// Moldura partilhada dos ecrãs de autenticação (sign-in / sign-up). Superfície
// atmosférica alinhada com o hub do ecossistema ('/'): canvas neutro (claro ou
// escuro, conforme o tema global), acento da marca-mãe Cruor, tipografia mono
// nas etiquetas e as três camadas de ambiente (halo + grelha pontilhada +
// grão). O conteúdo específico de cada ecrã (o cartão de formulário) entra como
// children. O toggle de tema fica num canto.
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/lib/theme/ThemeProvider';

// Acento da marca-mãe — partilhado com o hub do ecossistema. Constante: não é
// um acento de CRM e funciona sobre canvas claro ou escuro.
export const ACCENT = '#E23D51';
export const EASE = [0.16, 1, 0.3, 1] as const;

// Input — superfície inset sobre o cartão. Foco assinala com o acento.
export const inputCls =
  'h-12 w-full rounded-xl border border-neutral-200 bg-neutral-100 px-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 focus:border-[color:var(--accent)] focus:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/25';

const panelStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const panelItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

// Logótipo Cruor — os dois PNGs (claro/escuro) têm as MESMAS dimensões
// (1774×887) e fundo opaco. Recorta-se para a caixa exacta do wordmark; o
// mix-blend dissolve o fundo do PNG contra o canvas: 'lighten' para o PNG
// escuro sobre canvas escuro, 'darken' para o PNG claro sobre canvas claro.
export function CruorWordmark({ className = '' }: { className?: string }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return (
    <div className={`h-[30px] w-[237px] max-w-full shrink-0 overflow-hidden ${className}`}>
      <img
        src={dark ? '/cruor_logo_dark.png' : '/cruor_logo_light.png'}
        alt="Cruor"
        className="h-[162px] w-[324px] max-w-none -translate-x-[43px] -translate-y-[65px]"
        style={{ mixBlendMode: dark ? 'lighten' : 'darken' }}
      />
    </div>
  );
}

// ---- Painel de marca (esconde em mobile) --------------------------------
// Centrado verticalmente para alinhar com o cartão de login (a coluna do
// formulário também centra). O rodapé sai do fluxo (absolute) para ficar
// colado ao fundo sem ser arrastado pela centragem.
function BrandPanel() {
  return (
    <motion.div
      className="relative hidden flex-col justify-center py-2 lg:flex"
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
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            CRM · Ecossistema
          </p>
          <h2 className="mt-3 max-w-[18ch] text-[34px] font-semibold leading-[1.1] tracking-tight text-neutral-900">
            Quatro espaços. Um <span style={{ color: ACCENT }}>ecossistema</span>.
          </h2>
          <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-neutral-600">
            Gere floristas, stock, preços e encomendas a partir de um único acesso — em tempo real.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Flora', 'Forge', 'Pulse', 'Studio'].map((space) => (
              <span
                key={space}
                className="rounded-full border border-neutral-200 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-600"
              >
                {space}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={panelItem}
        className="absolute inset-x-0 bottom-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400"
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
      className="relative min-h-screen overflow-hidden bg-neutral-100 text-neutral-900"
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
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgb(var(--neutral-950) / 0.9) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Toggle de tema — canto superior direito, sobre a atmosfera */}
      <div className="absolute right-5 top-5 z-10 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

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
