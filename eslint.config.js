import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'examples/vite-demo/public/**',
      'package-lock.json',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'never'],
    },
  },
  {
    files: ['examples/vite-demo/src/**/*.ts'],
    languageOptions: {
      globals: {
        document: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLElement: 'readonly',
        ResizeObserver: 'readonly',
        requestAnimationFrame: 'readonly',
        window: 'readonly',
      },
    },
  },
)
