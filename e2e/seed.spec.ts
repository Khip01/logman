import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * E2E mode seed/demo (AGENTS.md bagian 15).
 *
 * Seed mengisi hari yang bisa diisi pada bulan terpilih, lalu bulan itu lolos
 * validasi ekspor.
 */

test.describe.configure({ mode: 'serial' })

const API = 'http://127.0.0.1:5198'

async function setConfig(request: APIRequestContext, patch: Record<string, unknown>) {
  const current = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: { config: { ...current.config, ...patch } },
  })
}

async function clearLogs(request: APIRequestContext) {
  await request.put(`${API}/api/logs`, { data: { data: { version: 1, days: {} } } })
}

test.describe('mode seed', () => {
  test.beforeEach(async ({ request }) => {
    await setConfig(request, {
      magang: { mulai: '2026-09-01', selesai: '2026-09-30' },
      folderExport: '',
    })
    await clearLogs(request)
  })

  test('mengisi bulan terpilih dengan data contoh dan menyimpannya', async ({ page, request }) => {
    await page.goto('/dev/seed')
    await page.getByTestId('seed-month-2026-09').click()
    await page.getByTestId('seed-submit').click()

    await expect(page.getByTestId('seed-result')).toContainText('26 hari terisi contoh')
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    const body = (await (await request.get(`${API}/api/logs`)).json()) as {
      data: { days: Record<string, { kegiatan: string }> }
    }
    expect(Object.keys(body.data.days)).toHaveLength(26)
    expect(body.data.days['2026-09-01']?.kegiatan).not.toBe('')
  })

  test('setelah seed, bulan lolos validasi dan tombol Ekspor aktif', async ({ page }) => {
    await page.goto('/dev/seed')
    await page.getByTestId('seed-month-2026-09').click()
    await page.getByTestId('seed-submit').click()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    await page.goto('/export')
    await expect(page.getByText(/hari belum lengkap/)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Ekspor' }).first()).toBeEnabled()
  })
})
