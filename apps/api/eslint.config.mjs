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
      // Les plugins et handlers Fastify sont async par contrat, même sans await.
      '@typescript-eslint/require-await': 'off',
      'no-console': 'error',
    },
  },
  {
    files: ['**/*.test.ts'],
    // describe/it de node:test renvoient des promesses qu'on ne consomme pas.
    rules: { '@typescript-eslint/no-floating-promises': 'off' },
  },
  {
    files: ['src/lib/hash-password.ts'],
    rules: { 'no-console': 'off' },
  },
);
