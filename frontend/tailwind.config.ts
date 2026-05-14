import type { Config } from 'tailwindcss';

/**
 * Cruor design tokens — fonte única de verdade do tema.
 *
 * Estratégia: `cruor` é a escala de marca (acento azul SaaS). As escalas
 * `neutral`, `green`, `amber`, `blue`, `red` são OVERRIDDEN — mantêm o nome
 * Tailwind mas ganham valores Cruor-coesos, por isso o código existente que
 * usa `neutral-*`/`green-*`/etc. actualiza sem sweep. `ink` = navy escuro
 * para superfícies/botões "dark".
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
        // Override: success — verde fresco para deltas positivos.
        green: {
          50: '#E9F7EF',
          100: '#CDEDDC',
          200: '#A3DCC0',
          300: '#6FC79E',
          400: '#45B07E',
          500: '#2E9C68',
          600: '#1F9D5B',
          700: '#187E49',
          800: '#16633B',
          900: '#135032',
        },
        // Override: warning — âmbar.
        amber: {
          50: '#FDF3E3',
          100: '#FAE3BC',
          200: '#F3CB83',
          300: '#EAB152',
          400: '#E09E37',
          500: '#D38E26',
          600: '#B0721C',
          700: '#8C5A18',
          800: '#714918',
          900: '#5D3C16',
        },
        // Override: info — azul alinhado à marca.
        blue: {
          50: '#EFF4FE',
          100: '#DCE7FD',
          200: '#BFD2FB',
          300: '#95B4F7',
          400: '#688EF1',
          500: '#476FE8',
          600: '#3568E0',
          700: '#2A4FC0',
          800: '#27429B',
          900: '#253C7B',
        },
        // Override: danger — coral suave para deltas negativos / destrutivo.
        red: {
          50: '#FDECEC',
          100: '#FAD6D7',
          200: '#F4B2B4',
          300: '#EC8587',
          400: '#E25D60',
          500: '#D6444A',
          600: '#C0333A',
          700: '#9F2A31',
          800: '#83262C',
          900: '#6D2429',
          950: '#3D1013',
        },
        // Navy escuro — botões "dark" (estilo "Exports") e o chip do logótipo.
        ink: {
          600: '#3A4458',
          700: '#2C3445',
          800: '#1F2632',
          900: '#161B24',
          950: '#0F131A',
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
        // Sombras suaves e frias — painéis brancos sobre canvas cinza-claro.
        card: '0 1px 2px rgb(20 24 31 / 0.04), 0 1px 3px rgb(20 24 31 / 0.03)',
        pop: '0 4px 12px rgb(20 24 31 / 0.08), 0 12px 32px rgb(20 24 31 / 0.10)',
        'card-hover': '0 1px 3px rgb(20 24 31 / 0.05), 0 6px 20px -6px rgb(20 24 31 / 0.10)',
        // Topbar — fio de elevação subtil sobre o canvas.
        topbar: '0 1px 2px rgb(20 24 31 / 0.04), 0 4px 16px -8px rgb(20 24 31 / 0.10)',
        // Halo azul — foco em CTA primário / elementos de marca.
        glow: '0 0 0 1px rgb(var(--cruor-600) / 0.14), 0 8px 24px -8px rgb(var(--cruor-600) / 0.30)',
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
