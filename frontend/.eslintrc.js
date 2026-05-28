/** @type {import('eslint').Linter.Config} */
const config = {
  root: true,
  extends: ['next/core-web-vitals'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/no-unescaped-entities': 'off',
  },
};

module.exports = config;
