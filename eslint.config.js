import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import pluginReact from 'eslint-plugin-react'
import pluginJsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'
import pluginSecurity from 'eslint-plugin-security'
import pluginNoUnsanitized from 'eslint-plugin-no-unsanitized'
import pluginSonarjs from 'eslint-plugin-sonarjs'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      pluginReact.configs.flat.recommended,
      pluginJsxA11y.flatConfigs.recommended,
      pluginSecurity.configs.recommended,
      pluginNoUnsanitized.configs.recommended,
      pluginSonarjs.configs.recommended,
      prettierConfig,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript handles prop validation — prop-types not needed
      'react/prop-types': 'off',
      // React 17+ JSX transform — no need to import React in scope
      'react/react-in-jsx-scope': 'off',
    },
  },
  // Compiler internals: high cognitive complexity is inherent in a hand-written
  // lexer/parser/validator — raise the limit rather than splitting arbitrarily.
  // Also suppress no-incomplete-assertions: the parser has its own `expect()`
  // helper for token consumption which sonarjs misidentifies as a test assertion.
  {
    files: ['src/features/compiler/**/*.ts'],
    rules: {
      'sonarjs/cognitive-complexity': ['error', 65],
      'sonarjs/no-incomplete-assertions': 'off',
    },
  },
  // Test files: slow-regex and no-incomplete-assertions are not security
  // concerns in test code and produce many false positives.
  {
    files: ['**/*.test.{ts,tsx}', 'e2e/**/*.ts'],
    rules: {
      'sonarjs/slow-regex': 'off',
      'sonarjs/no-incomplete-assertions': 'off',
    },
  },
  // Build/codegen scripts: fs paths are constructed from import.meta.dirname,
  // not from user input — detect-non-literal-fs-filename is a false positive.
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
])
