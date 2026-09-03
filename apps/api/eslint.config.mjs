// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['src/db/migrations/**'] },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylistic,
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // Fastify plugins and handlers are async by contract, await or not.
      '@typescript-eslint/require-await': 'off',
      'no-console': 'error',
    },
  },
  {
    files: ['**/*.test.ts'],
    // node:test's describe/it return promises nobody is expected to consume.
    rules: { '@typescript-eslint/no-floating-promises': 'off' },
  },
  {
    // Command-line entry points. Their output *is* the interface — a seeding
    // script that reports nothing cannot be told apart from one that did
    // nothing. Everything else in the API logs through Fastify.
    files: ['src/lib/hash-password.ts', 'src/scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
);
