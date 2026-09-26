import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // `scripts/` ikut diuji karena pemilihan port dev punya logika yang bisa salah
    // diam-diam: kalau auto-increment tidak jalan, `pnpm dev` gagal saat port default
    // dipakai, dan kalau auto-increment terlalu agresif, E2E bisa mengukur server lain.
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts', 'scripts/**/*.test.ts'],
    css: false,
  },
})
