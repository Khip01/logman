import { defineConfig, devices } from '@playwright/test'

/**
 * Konfigurasi Playwright (AGENTS.md bagian 14 dan 16).
 * Web dan API dijalankan otomatis sebelum test.
 */
export default defineConfig({
  testDir: './e2e',
  // Aplikasi ini single-user dengan SATU file `config.json` dan `logs.json`. Semua spec
  // e2e memakai server dan direktori data yang sama, sehingga menjalankannya paralel
  // membuat spec saling menimpa konfigurasi (misal rentang magang). Dijalankan serial
  // agar hasilnya deterministik. CI juga memakai workers 1.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5199',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // E2E memakai direktori data terpisah agar TIDAK menyentuh data nyata
    // (AGENTS.md bagian 16).
    //
    // `reuseExistingServer` SELALU false dengan sengaja: bila dev server yang sudah
    // berjalan dipakai ulang, server itu memakai LOGMAN_DATA_DIR berbeda dan test akan
    // menulis ke data nyata. Selalu mulai server baru agar direktori data terjamin.
    command: 'pnpm dev',
    env: {
      LOGMAN_DATA_DIR: 'data-e2e',
      /*
       * Mode `strict` WAJIB di sini. E2E meng-hardcode `http://127.0.0.1:5199`, jadi
       * kalau port auto-increment, test akan diam-diam mengukur server lain. Mode ini
       * membuat `pnpm dev` gagal dengan pesan jelas kalau port default sedang dipakai.
       * Lihat AGENTS.md bagian 4.1.
       */
      LOGMAN_PORT_MODE: 'strict',
    },
    url: 'http://127.0.0.1:5199',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
