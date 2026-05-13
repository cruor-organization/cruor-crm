/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yaml,yml,css}': ['prettier --write'],
};
