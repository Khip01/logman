import { existsSync, readFileSync } from 'node:fs'
import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * E2E ekspor PDF (AGENTS.md bagian 11.3 dan 12).
 *
 * Ekspor memakai Playwright di sisi server, jadi test menunggu lebih lagi dari biasanya.
 * Ekspor DITOLAK selama masih ada hari yang belum lengkap, baik lewat UI maupun API.
 */

test.describe.configure({ mode: 'serial' })

const API = 'http://127.0.0.1:5198'

/**
 * Hari Senin sampai Sabtu pada 2026-09-01 sampai 2026-09-30 (rentang test).
 * 31 Agustus dan 1-3 Oktober berada di luar rentang sehingga tidak dapat diisi.
 */
const SEPTEMBER_EDITABLE = [
  '2026-09-01',
  '2026-09-02',
  '2026-09-03',
  '2026-09-04',
  '2026-09-05',
  '2026-09-07',
  '2026-09-08',
  '2026-09-09',
  '2026-09-10',
  '2026-09-11',
  '2026-09-12',
  '2026-09-14',
  '2026-09-15',
  '2026-09-16',
  '2026-09-17',
  '2026-09-18',
  '2026-09-19',
  '2026-09-21',
  '2026-09-22',
  '2026-09-23',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-09-28',
  '2026-09-29',
  '2026-09-30',
]

async function setConfig(request: APIRequestContext, patch: Record<string, unknown>) {
  const current = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: { config: { ...current.config, ...patch } },
  })
}

/** Kosongkan seluruh data log agar test tidak bergantung test sebelumnya. */
async function clearLogs(request: APIRequestContext) {
  await request.put(`${API}/api/logs`, { data: { data: { version: 1, days: {} } } })
}

/** Isi seluruh hari yang bisa diisi pada September 2026 agar lolos validasi. */
async function fillSeptember(request: APIRequestContext) {
  const patch: Record<string, unknown> = {}
  for (const [index, date] of SEPTEMBER_EDITABLE.entries()) {
    patch[date] = {
      kegiatan: `Kegiatan magang hari ke-${index + 1}`,
      alasan: null,
      status: 'terisi',
      masuk: null,
      pulang: null,
    }
  }
  await request.patch(`${API}/api/logs`, { data: { patch } })
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

  test('POST /api/export menolak bila ada hari yang belum lengkap', async ({ request }) => {
    await clearLogs(request)
    const response = await request.post(`${API}/api/export`, {
      data: { monthKey: '2026-09' },
    })
    expect(response.status()).toBe(422)
    const body = (await response.json()) as { error: string; incomplete: string[] }
    expect(body.error).toContain('belum')
    expect(Array.isArray(body.incomplete)).toBe(true)
    expect(body.incomplete.length).toBeGreaterThan(0)
  })

  test('POST /api/export membuat file PDF dengan pola nama yang benar', async ({ request }) => {
    await fillSeptember(request)
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
    await fillSeptember(request)
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

  test('tombol Ekspor nonaktif selama hari belum lengkap', async ({ page, request }) => {
    await clearLogs(request)
    await page.goto('/export')
    await expect(page.getByText(/hari belum lengkap/).first()).toBeVisible()
    await expect(page.getByRole('main').getByRole('button', { name: 'Ekspor' })).toBeDisabled()
  })

  test('tombol Ekspor di UI mengunduh PDF setelah bulan lengkap', async ({ page, request }) => {
    await fillSeptember(request)
    await page.goto('/export')
    await expect(page.getByRole('main').getByRole('button', { name: 'Ekspor' })).toBeEnabled()
    const downloadPromise = page.waitForEvent('download', { timeout: 60_000 })
    await page.getByRole('main').getByRole('button', { name: 'Ekspor' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^LogBook_.+\.pdf$/)
  })
})
