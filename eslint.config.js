import { defineConfig, globalIgnores } from 'eslint/config';
import coax from '@coaxsoft/eslint-config-fe-react';
import vitest from '@vitest/eslint-plugin';

export default defineConfig([
  globalIgnores([
    // IDE
    '.vscode',
    '.idea',

    // testing
    'coverage',
    '.scannerwork/',
    'eslint-report.json',

    // Dependencies
    'node_modules',

    // misc
    '.DS_Store',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    'yarn.lock',
    '.env.*',

    // production
    'dist',
    'build',
  ]),
  ...coax,
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    rules: {
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      'no-useless-escape': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // the base rule reports parameter names in function types, the typescript-eslint version replaces it
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules, // you can also use vitest.configs.all.rules to enable all rules
      'vitest/max-nested-describe': ['error', { max: 3 }], // you can also modify rules' behavior using option like this
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },
]);
