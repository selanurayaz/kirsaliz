import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Sayfa bölmesine ek olarak büyük üçüncü taraf paketleri ayrı, önbelleklenebilir parçalara ayrılır.
        codeSplitting: {
          groups: [
            { name: 'vendor-supabase', test: new RegExp('node_modules/@supabase/'), priority: 30 },
            { name: 'vendor-router', test: new RegExp('node_modules/(react-router|@remix-run)/'), priority: 20 },
            { name: 'vendor-react', test: new RegExp('node_modules/(react|react-dom|scheduler)/'), priority: 10 },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Yalnızca sahte, genel değerler: testler hiçbir zaman gerçek Supabase'e bağlanmaz.
    env: {
      VITE_SUPABASE_URL: 'https://test-project.supabase.test',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key-not-real',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.test.{ts,tsx}', 'src/types/**', 'src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
})
