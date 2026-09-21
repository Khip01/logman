import { existsSync, readFileSync } from 'node:fs'
import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * E2E ekspor PDF (AGENTS.md bagian 12).
 *
 * Ekspor memakai Playwright di sisi server, jadi test menunggu lebih lagi dari biasanya.
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

test.describe('ekspor PDF', () => {
  test.beforeEach(async ({ request }) => {
    await setConfig(request, {
      magang: { mulai: '2026-09-01', selesai: '2026-09-30' },
      folderExport: '',
    })
  })

  test('halaman ekspor menampilkan daftar bulan dari rentang', async ({ page }) => {
    await page.goto('/export')
    await expect(page.getByRole('heading', { name: 'Ekspor PDF' })).toBeVisible()
    await expect(page.getByText('September 2026')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ekspor' }).first()).toBeVisible()
  })

  test('POST /api/export membuat file PDF dengan pola nama yang benar', async ({ request }) => {
    const response = await request.post(`${API}/api/export`, {
      data: { monthKey: '2026-09' },
    })
    expect(response.ok()).toBeTruthy()
    const body = (await response.json()) as {
      ok: boolean
      fileName: string
      path: string
    }
    expect(body.ok).toBe(true)
    expect(body.fileName).toMatch(/^LogBook_.+_September-2026\.pdf$/)
    expect(existsSync(body.path)).toBe(true)

    const head = readFileSync(body.path).subarray(0, 5).toString('utf8')
    expect(head).toBe('%PDF-')
  })

  test('POST /api/export menolak bulan di luar rentang', async ({ request }) => {
    const response = await request.post(`${API}/api/export`, {
      data: { monthKey: '2026-12' },
    })
    expect(response.status()).toBe(404)
    const body = (await response.json()) as { error: string }
    expect(body.error).toContain('tidak ditemukan')
  })

  test('POST /api/export menolak body tanpa monthKey', async ({ request }) => {
    const response = await request.post(`${API}/api/export`, { data: {} })
    expect(response.status()).toBe(400)
  })

  test('download menyajikan PDF dan menolak nama file berbahaya', async ({ request }) => {
    const exportRes = await request.post(`${API}/api/export`, {
      data: { monthKey: '2026-09' },
    })
    const { fileName } = (await exportRes.json()) as { fileName: string }

    const download = await request.get(`${API}/api/export/download?file=${fileName}`)
    expect(download.ok()).toBeTruthy()
    expect(download.headers()['content-type']).toContain('application/pdf')

    for (const bad of ['../config.json', 'config.json', 'a/b.pdf', 'x.txt', '']) {
      const res = await request.get(`${API}/api/export/download?file=${encodeURIComponent(bad)}`)
      expect(res.ok()).toBeFalsy()
    }
  })

  test('tombol Ekspor di UI mengunduh PDF', async ({ page }) => {
    await page.goto('/export')
    const downloadPromise = page.waitForEvent('download', { timeout: 60_000 })
    await page.getByRole('button', { name: 'Ekspor' }).first().click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^LogBook_.+\.pdf$/)
  })
})
