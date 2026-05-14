import type { Config } from 'tailwindcss';

/**
 * Cruor design tokens — fonte única de verdade do tema.
 *
 * Estratégia: todas as escalas (`cruor`, `neutral`, `green`, `amber`, `blue`,
 * `red`, `ink`) e as sombras apontam para CSS vars. Os valores vivem em
 * `globals.css` (`:root` claro / `:root[data-theme="dark"]` escuro) e, no caso
 * de `cruor`/`neutral`, são reescritos inline por `applyCrmTheme()`. Mudar de
 * tema ou de CRM é só trocar vars — zero sweep de classes.
 *
 * `surface` = superfície elevada (branco em claro, cinzento elevado em escuro).
 * `ink` = navy escuro para botões "dark"/tooltips (invertido em modo escuro).
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Marca — acento do CRM ativo. Valores em CSS vars (ver globals.css +
        // lib/crm/theme.ts); trocam em runtime ao mudar de CRM.
        cruor: {
          50: 'rgb(var(--cruor-50) / <alpha-value>)',
          100: 'rgb(var(--cruor-100) / <alpha-value>)',
          200: 'rgb(var(--cruor-200) / <alpha-value>)',
          300: 'rgb(var(--cruor-300) / <alpha-value>)',
          400: 'rgb(var(--cruor-400) / <alpha-value>)',
          500: 'rgb(var(--cruor-500) / <alpha-value>)',
          600: 'rgb(var(--cruor-600) / <alpha-value>)',
          700: 'rgb(var(--cruor-700) / <alpha-value>)',
          800: 'rgb(var(--cruor-800) / <alpha-value>)',
          900: 'rgb(var(--cruor-900) / <alpha-value>)',
          950: 'rgb(var(--cruor-950) / <alpha-value>)',
        },
        // Estrutura — neutros do CRM ativo (temperatura varia por CRM). CSS vars.
        neutral: {
          50: 'rgb(var(--neutral-50) / <alpha-value>)',
          100: 'rgb(var(--neutral-100) / <alpha-value>)',
          200: 'rgb(var(--neutral-200) / <alpha-value>)',
          300: 'rgb(var(--neutral-300) / <alpha-value>)',
          400: 'rgb(var(--neutral-400) / <alpha-value>)',
          500: 'rgb(var(--neutral-500) / <alpha-value>)',
          600: 'rgb(var(--neutral-600) / <alpha-value>)',
          700: 'rgb(var(--neutral-700) / <alpha-value>)',
          800: 'rgb(var(--neutral-800) / <alpha-value>)',
          900: 'rgb(var(--neutral-900) / <alpha-value>)',
          950: 'rgb(var(--neutral-950) / <alpha-value>)',
        },
        // Superfície elevada — branco em claro, cinzento elevado em escuro.
        surface: 'rgb(var(--surface) / <alpha-value>)',
        // Override: success — verde fresco para deltas positivos.
        green: {
          50: 'rgb(var(--green-50) / <alpha-value>)',
          100: 'rgb(var(--green-100) / <alpha-value>)',
          200: 'rgb(var(--green-200) / <alpha-value>)',
          300: 'rgb(var(--green-300) / <alpha-value>)',
          400: 'rgb(var(--green-400) / <alpha-value>)',
          500: 'rgb(var(--green-500) / <alpha-value>)',
          600: 'rgb(var(--green-600) / <alpha-value>)',
          700: 'rgb(var(--green-700) / <alpha-value>)',
          800: 'rgb(var(--green-800) / <alpha-value>)',
          900: 'rgb(var(--green-900) / <alpha-value>)',
        },
        // Override: warning — âmbar.
        amber: {
          50: 'rgb(var(--amber-50) / <alpha-value>)',
          100: 'rgb(var(--amber-100) / <alpha-value>)',
          200: 'rgb(var(--amber-200) / <alpha-value>)',
          300: 'rgb(var(--amber-300) / <alpha-value>)',
          400: 'rgb(var(--amber-400) / <alpha-value>)',
          500: 'rgb(var(--amber-500) / <alpha-value>)',
          600: 'rgb(var(--amber-600) / <alpha-value>)',
          700: 'rgb(var(--amber-700) / <alpha-value>)',
          800: 'rgb(var(--amber-800) / <alpha-value>)',
          900: 'rgb(var(--amber-900) / <alpha-value>)',
        },
        // Override: info — azul alinhado à marca.
        blue: {
          50: 'rgb(var(--blue-50) / <alpha-value>)',
          100: 'rgb(var(--blue-100) / <alpha-value>)',
          200: 'rgb(var(--blue-200) / <alpha-value>)',
          300: 'rgb(var(--blue-300) / <alpha-value>)',
          400: 'rgb(var(--blue-400) / <alpha-value>)',
          500: 'rgb(var(--blue-500) / <alpha-value>)',
          600: 'rgb(var(--blue-600) / <alpha-value>)',
          700: 'rgb(var(--blue-700) / <alpha-value>)',
          800: 'rgb(var(--blue-800) / <alpha-value>)',
          900: 'rgb(var(--blue-900) / <alpha-value>)',
        },
        // Override: danger — coral suave para deltas negativos / destrutivo.
        red: {
          50: 'rgb(var(--red-50) / <alpha-value>)',
          100: 'rgb(var(--red-100) / <alpha-value>)',
          200: 'rgb(var(--red-200) / <alpha-value>)',
          300: 'rgb(var(--red-300) / <alpha-value>)',
          400: 'rgb(var(--red-400) / <alpha-value>)',
          500: 'rgb(var(--red-500) / <alpha-value>)',
          600: 'rgb(var(--red-600) / <alpha-value>)',
          700: 'rgb(var(--red-700) / <alpha-value>)',
          800: 'rgb(var(--red-800) / <alpha-value>)',
          900: 'rgb(var(--red-900) / <alpha-value>)',
          950: 'rgb(var(--red-950) / <alpha-value>)',
        },
        // Navy escuro — botões "dark" e tooltips. Invertido em modo escuro.
        ink: {
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          950: 'rgb(var(--ink-950) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"Hanken Grotesk Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        control: '10px',
      },
      boxShadow: {
        // Sombras via CSS vars — claras/frias em modo claro, pretas/densas em
        // modo escuro (ver globals.css).
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
        'card-hover': 'var(--shadow-card-hover)',
        topbar: 'var(--shadow-topbar)',
        // Halo do acento — foco em CTA primário / elementos de marca.
        glow: 'var(--shadow-glow)',
      },
      keyframes: {
        'fade-rise': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-rise': 'fade-rise 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
