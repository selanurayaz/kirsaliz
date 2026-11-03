import { createRequire } from 'node:module'
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

// Projede TypeScript 7 (yerel derleyici) kullanılır; typescript-eslint ise JavaScript API'si
// olan bir TypeScript sürümüne ihtiyaç duyar. Yalnızca lint için kurulan "typescript-js"
// takma adı, typescript-eslint'in `require('typescript')` çağrısına yönlendirilir.
const nodeRequire = createRequire(import.meta.url)
const Module = nodeRequire('node:module')
const resolveFilename = Module._resolveFilename
Module._resolveFilename = function (request, ...rest) {
  return resolveFilename.call(this, request === 'typescript' ? 'typescript-js' : request, ...rest)
}
const { default: tseslint } = await import('typescript-eslint')

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'supabase'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    plugins: { 'react-refresh': reactRefresh },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
)
