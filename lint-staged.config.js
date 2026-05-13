/** @type {import('lint-staged').Configuration} */
// eslint não está instalado na raiz — cada workspace corre `pnpm lint` individualmente.
// lint-staged só corre prettier para formatação global.
export default {
  '*.{ts,tsx,js,jsx,json,md,yaml,yml,css}': ['prettier --write'],
};
