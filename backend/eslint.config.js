// CRM Backend — ESLint flat config.
// Princípios §2 do prompt.md: type-safety first, no $queryRawUnsafe.
import eslint from '@eslint/js';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/eslint.config.js',
      '**/vitest.config.ts',
      '**/prisma/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        projectService: {
          allowDefaultProject: ['*.js', '*.config.js', '*.config.ts'],
        },
      },
    },
    plugins: {
      'import-x': importX,
    },
    rules: {
      // §2.1 — type-safety first
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      // Controllers exportam objetos com métodos passados a Express routers como callbacks.
      // Os métodos não usam `this`; o aviso é ruído. Em §10 few-shots o padrão é este.
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { arguments: false, attributes: false } },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // §9 — segurança: banir Prisma raw unsafe
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[property.name='$queryRawUnsafe']",
          message: 'Proibido por §9: usa Prisma typed queries ou template literal.',
        },
        {
          selector: "MemberExpression[property.name='$executeRawUnsafe']",
          message: 'Proibido por §9: usa Prisma typed queries ou template literal.',
        },
      ],

      // §2.6 — fail fast, fail loud
      'no-empty': ['error', { allowEmptyCatch: false }],

      // §2.9 — document the why
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      'import-x/no-default-export': 'off',
      'import-x/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
];
