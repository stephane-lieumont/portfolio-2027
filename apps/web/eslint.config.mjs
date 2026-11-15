// @ts-check
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import eslint from '@eslint/js';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

// The app's layering (ADR-0018). Each layer may import the ones listed under
// it, never the ones above: features → layouts → common → shared / core.
const FEATURES = readdirSync(join(import.meta.dirname, 'src/app/features'), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

// A relative path that climbs could reach any layer and slip past the rules
// below, so leaving a folder goes through an alias.
const CLIMB = {
  regex: '^\\.\\./',
  message: 'Leave a folder through a layer alias (@core, @shared, @common, @features, @layouts).',
};

/** `no-restricted-imports` for a layer: the climb rule plus the aliases it must not use. */
function layer(forbidden, why) {
  return ['error', { patterns: [CLIMB, { regex: forbidden, message: why }] }];
}

export default tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-imports': ['error', { patterns: [CLIMB] }],
    },
  },
  {
    files: ['src/app/core/**/*.ts'],
    rules: {
      'no-restricted-imports': layer(
        '^@(shared|common|features|layouts)/',
        'core/ holds app-wide singletons and data: it imports no UI layer.',
      ),
    },
  },
  {
    files: ['src/app/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': layer(
        '^@(core|common|features|layouts)/',
        'shared/ is generic UI that knows nothing of the domain: it imports no other layer.',
      ),
    },
  },
  {
    files: ['src/app/common/**/*.ts'],
    rules: {
      'no-restricted-imports': layer(
        '^@(features|layouts)/',
        'common/ is shared by features and the layout: it cannot depend on them.',
      ),
    },
  },
  {
    files: ['src/app/layouts/**/*.ts'],
    rules: {
      'no-restricted-imports': layer(
        '^@features/',
        'The layout frames the routed features; it does not import them.',
      ),
    },
  },
  ...FEATURES.map((feature) => ({
    files: [`src/app/features/${feature}/**/*.ts`],
    rules: {
      'no-restricted-imports': layer(
        `^@(layouts/|features/(?!${feature}/))`,
        'A feature imports neither the layout nor another feature: move what they share to common/ or core/.',
      ),
    },
  })),
  {
    // Kit components sit on a native element to keep its semantics (a link
    // stays an <a>), so their selector is an attribute.
    files: ['src/app/shared/components/kit-ui/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
);
