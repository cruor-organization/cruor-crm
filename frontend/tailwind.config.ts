import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // placeholders — shadcn instala as suas variáveis CSS em Fase 1
        brand: {
          50: '#fdf4f1',
          500: '#c75c2c',
          900: '#3b1607',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
