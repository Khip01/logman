import { defineConfig, devices } from '@playwright/test'

/**
 * Konfigurasi Playwright (AGENTS.md bagian 14 dan 16).
 * Web dan API dijalankan otomatis sebelum test.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
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
    },
    url: 'http://127.0.0.1:5199',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
