import type { Config } from 'tailwindcss';

/**
 * Cruor design tokens — fonte única de verdade do tema.
 *
 * Estratégia: `cruor` é a escala de marca (acento carmim). As escalas
 * `neutral`, `green`, `amber`, `blue`, `red` são OVERRIDDEN — mantêm o nome
 * Tailwind mas ganham valores Cruor-coesos, por isso o código existente que
 * usa `neutral-*`/`green-*`/etc. actualiza sem sweep.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Marca — oxblood/carmim (o anel planetário do logo). 600 = primary.
        cruor: {
          50: '#FBF1F2',
          100: '#F6DEE0',
          200: '#ECBEC2',
          300: '#DD9097',
          400: '#C95863',
          500: '#B23A45',
          600: '#97232E',
          700: '#7C1F28',
          800: '#671E25',
          900: '#581D23',
          950: '#310C10',
        },
        // Override: carvão levemente quente (ecoa o metal escovado do wordmark).
        neutral: {
          50: '#F7F6F4',
          100: '#EEEDEA',
          200: '#E2E0DC',
          300: '#CBC8C2',
          400: '#A6A39C',
          500: '#807D76',
          600: '#5F5C56',
          700: '#45423D',
          800: '#2A2825',
          900: '#1B1A17',
          950: '#0F0E0C',
        },
        // Override: success — verde-sálvia muted.
        green: {
          50: '#EEF6F1',
          100: '#D6EBDF',
          200: '#AFD7C0',
          300: '#82BE9C',
          400: '#5EA77F',
          500: '#4A9D6E',
          600: '#3B7F58',
          700: '#2F6647',
          800: '#27513A',
          900: '#214330',
        },
        // Override: warning — âmbar muted.
        amber: {
          50: '#FBF3E4',
          100: '#F5E3BE',
          200: '#EBCB85',
          300: '#DEB052',
          400: '#D29E3C',
          500: '#C8912E',
          600: '#A9761F',
          700: '#8A5F1A',
          800: '#6F4D18',
          900: '#5C4016',
        },
        // Override: info — azul calmo.
        blue: {
          50: '#EDF2FB',
          100: '#D5E1F4',
          200: '#AFC6E9',
          300: '#82A5DA',
          400: '#5E89CD',
          500: '#4A78C4',
          600: '#3A60A3',
          700: '#2F4E85',
          800: '#29406C',
          900: '#24375A',
        },
        // Override: danger — alinhado ao carmim de marca (destrutivo = vermelho Cruor).
        red: {
          50: '#FBF1F2',
          100: '#F6DEE0',
          200: '#ECBEC2',
          300: '#DD9097',
          400: '#C95863',
          500: '#B23A45',
          600: '#97232E',
          700: '#7C1F28',
          800: '#671E25',
          900: '#581D23',
          950: '#310C10',
        },
      },
      fontFamily: {
        sans: ['"Hanken Grotesk Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        control: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 14 12 / 0.04), 0 2px 8px rgb(15 14 12 / 0.03)',
        pop: '0 4px 12px rgb(15 14 12 / 0.08), 0 12px 32px rgb(15 14 12 / 0.10)',
        'card-hover': '0 1px 2px rgb(15 14 12 / 0.05), 0 4px 16px rgb(15 14 12 / 0.06)',
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
    },
  },
  plugins: [],
} satisfies Config;
