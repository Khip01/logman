import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readDevPorts } from './scripts/dev-ports.mjs'

/*
 * Port dev dibaca dari berkas hasil pemilihan port, bukan ditulis langsung di sini.
 * Berkas itu ditulis oleh `scripts/dev-ports.mjs` sebelum `concurrently` berjalan, jadi
 * Vite dan server API selalu sepakat port mana yang dipakai (AGENTS.md bagian 4.1).
 *
 * Env tetap menang, jadi caller bisa memaksa port tertentu tanpa mengubah berkas.
 */
const devPorts = readDevPorts()
const WEB_PORT = Number(process.env.LOGMAN_WEB_PORT ?? devPorts.webPort)
const API_PORT = Number(process.env.LOGMAN_API_PORT ?? devPorts.apiPort)

/** Versi aplikasi dibaca dari package.json agar status bar tidak pernah basi. */
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'),
) as { version?: string }

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version ?? '0.0.0'),
  },
  plugins: [
    react({
      // React Compiler: auto-memoization, menghilangkan kebutuhan useMemo/useCallback
      // manual. Lihat AGENTS.md bagian 3 dan 13.
      compiler: true,
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: WEB_PORT,
    /*
     * `strictPort` tetap true di kedua mode.-auto-increment dilakukan oleh
     * `scripts/dev-ports.mjs`, bukan oleh Vite, supaya port yang benar-benar dipakai
     * sama dengan URL yang dicetak ke pengguna dan sama dengan target proxy di bawah.
     * Kalau Vite yang menaikkan portnya sendiri, proxy masih menembak port API yang
     * benar, tapi pengguna akan mendapat URL yang salah.
     */
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
