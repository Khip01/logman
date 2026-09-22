import { type APIRequestContext, expect, type Page, test } from '@playwright/test'

/**
 * Snapshot visual (AGENTS.md bagian 14.3). Ini GATE CI: screenshot dibandingkan
 * dengan baseline di `e2e/visual.spec.ts-snapshots/`.
 *
 * Stabilitas baseline:
 * - Rentang magang dikunci satu minggu (21-26 Sep 2026) supaya bulan dan minggu
 *   aktif tidak bergantung pada tanggal hari ini.
 * - Tema dikunci putih-bersih, tier animasi mati, lalu animasi/transisi dibekukan
 *   lewat CSS uji dan reducedMotion.
 * - Data hari diisi deterministik lewat API.
 *
 * Bila perubahan UI memang disengaja, perbarui baseline dengan:
 * pnpm playwright test e2e/visual.spec.ts --update-snapshots
 */

test.describe.configure({ mode: 'serial' })

const API = 'http://127.0.0.1:5198'

const WEEK_DAYS = [
  '2026-09-21',
  '2026-09-22',
  '2026-09-23',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
]

async function setConfig(request: APIRequestContext, patch: Record<string, unknown>) {
  const current = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: { config: { ...current.config, ...patch } },
  })
}

async function seedWeek(request: APIRequestContext) {
  const patch: Record<string, unknown> = {}
  for (const [index, date] of WEEK_DAYS.entries()) {
    patch[date] = {
      kegiatan: `Kegiatan contoh hari ke-${index + 1}`,
      alasan: null,
      status: 'terisi',
      masuk: null,
      pulang: null,
    }
  }
  await request.put(`${API}/api/logs`, { data: { data: { version: 1, days: {} } } })
  await request.patch(`${API}/api/logs`, { data: { patch } })
}

/** Bekukan animasi, sembunyikan karet, dan tunggu sampai font siap. */
async function stabilize(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation: none !important;
      transition: none !important;
      caret-color: transparent !important;
    }`,
  })
  await page.evaluate(() => document.fonts.ready)
}

test.describe('snapshot visual', () => {
  test.beforeEach(async ({ request }) => {
    await setConfig(request, {
      magang: { mulai: '2026-09-21', selesai: '2026-09-26' },
      tema: 'putih-bersih',
      tierAnimasi: 'mati',
      folderExport: '',
    })
    await seedWeek(request)
  })

  test('halaman Log Book', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Log Book' })).toBeVisible()
    await expect(page.getByTestId('editor-row-2026-09-21')).toBeVisible()
    await stabilize(page)
    await expect(page).toHaveScreenshot('logbook.png', { maxDiffPixelRatio: 0.02 })
  })

  test('halaman Pengaturan', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Pengaturan' })).toBeVisible()
    await stabilize(page)
    await expect(page).toHaveScreenshot('settings.png', { maxDiffPixelRatio: 0.02 })
  })

  test('halaman Ekspor', async ({ page }) => {
    await page.goto('/export')
    await expect(page.getByRole('heading', { name: 'Ekspor PDF' })).toBeVisible()
    await stabilize(page)
    await expect(page).toHaveScreenshot('export.png', { maxDiffPixelRatio: 0.02 })
  })
})
