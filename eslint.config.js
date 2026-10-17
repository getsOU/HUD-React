import js from '@eslint/js';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['node_modules/**', 'dist/**', 'artifacts/**', '.cache/**', 'public/sdk/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest', sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z]' }],
    },
  },
];
