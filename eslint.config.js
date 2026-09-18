import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'error',
      'vue/valid-v-memo': 'off',
      'vue/no-useless-template-attributes': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-control-regex': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'harness/scripts/**/*.mjs', 'vite.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['tests/**/*.ts', 'scripts/**/*.ts'],
    rules: {
      'prefer-const': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: [
              '**/blueprint-editor/store/**',
              '**/blueprint-editor/components/**',
              '**/blueprint-editor/composables/**',
              '**/blueprint-editor/assets/**',
              '**/blueprint-editor/blueprintStore',
              '**/blueprint-editor/syncedPayload',
              '@/composables/**',
              'vue',
              'vue/*',
            ],
            message: 'src/engine must stay framework- and UI-independent - import only the pure domain kernel (blueprint-editor/domain).',
          },
        ],
      }],
    },
  },
  {
    files: ['src/blueprint-editor/domain/schema/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: [
              '**/blueprint-editor/store/**',
              '**/blueprint-editor/components/**',
              '**/blueprint-editor/composables/**',
              '**/blueprint-editor/assets/**',
              '**/blueprint-editor/blueprintStore',
              '**/blueprint-editor/syncedPayload',
              '@/composables/**',
              '@/components/**',
              'vue',
              'vue/*',
            ],
            message: 'the domain schema kernel must stay pure (normalize/resolve only) - no store, UI, or Vue imports.',
          },
        ],
      }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '_archive/**', '.zed/**', 'harness/**/*.md', 'eslint.config.js'],
  },
  prettier,
)
