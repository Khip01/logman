import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * E2E Settings fase 4 (AGENTS.md bagian 18): jam default, alasan, ukuran kertas,
 * dan folder ekspor. Semua menulis lewat autosave yang sama seperti fase sebelumnya.
 */

test.describe.configure({ mode: 'serial' })

async function resolveDataDir(request: APIRequestContext): Promise<string> {
  const response = await request.get('http://127.0.0.1:5198/api/health')
  const body = (await response.json()) as { dataDir: string }
  return isAbsolute(body.dataDir) ? body.dataDir : join(process.cwd(), body.dataDir)
}

test.describe('settings lanjutan', () => {
  test('jam default menolak format salah dan menormalkan titik dua', async ({ page }) => {
    await page.goto('/settings')

    const seninMasuk = page.getByLabel('Jam masuk Senin')
    // Format menit satu digit ditolak (ambigu antara 08.05 dan 08.50).
    await seninMasuk.fill('9.5')
    await seninMasuk.blur()
    await expect(page.getByText('Format jam HH.MM', { exact: false })).toBeVisible()
    await expect(seninMasuk).toHaveValue('9.5')

    // Bentuk dengan titik dua dinormalkan ke titik.
    await seninMasuk.fill('07:15')
    await seninMasuk.blur()
    await expect(seninMasuk).toHaveValue('07.15')
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })
  })

  test('jam default tersimpan ke config.json', async ({ page, request }) => {
    const dataDir = await resolveDataDir(request)
    await page.goto('/settings')

    const selasaPulang = page.getByLabel('Jam pulang Selasa')
    await selasaPulang.fill('17.30')
    await selasaPulang.blur()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    const config = JSON.parse(readFileSync(join(dataDir, 'config.json'), 'utf8')) as {
      jamDefault: Record<string, { masuk: string; pulang: string }>
    }
    expect(config.jamDefault.selasa?.pulang).toBe('17.30')
  })

  test('alasan bisa ditambah, duplikat ditolak, dan bisa dihapus', async ({ page, request }) => {
    const dataDir = await resolveDataDir(request)
    await page.goto('/settings')

    await page.getByLabel('Tambah alasan').fill('Wawancara')
    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'Hapus alasan Wawancara' })).toBeVisible()

    // Duplikat tidak menambah entri baru.
    await page.getByLabel('Tambah alasan').fill('wawancara')
    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByRole('button', { name: 'Hapus alasan Wawancara' })).toHaveCount(1)

    // Hapus mengembalikan daftar ke kondisi sebelumnya.
    await page.getByRole('button', { name: 'Hapus alasan Wawancara' }).click()
    await expect(page.getByRole('button', { name: 'Hapus alasan Wawancara' })).toHaveCount(0)
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    const config = JSON.parse(readFileSync(join(dataDir, 'config.json'), 'utf8')) as {
      alasan: string[]
    }
    expect(config.alasan).not.toContain('Wawancara')
  })

  test('ukuran kertas dan folder ekspor tersimpan ke config.json', async ({ page, request }) => {
    const dataDir = await resolveDataDir(request)
    await page.goto('/settings')

    await page.getByRole('radio', { name: 'F4' }).click()
    await page.getByLabel('Folder ekspor').fill('/tmp/opencode/logman-export')
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    const config = JSON.parse(readFileSync(join(dataDir, 'config.json'), 'utf8')) as {
      ukuranKertas: string
      folderExport: string
    }
    expect(config.ukuranKertas).toBe('F4')
    expect(config.folderExport).toBe('/tmp/opencode/logman-export')

    await page.reload()
    await expect(page.getByRole('radio', { name: 'F4' })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByLabel('Folder ekspor')).toHaveValue('/tmp/opencode/logman-export')
  })

  test('pola nama file tampil di seksi dokumen', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText('LogBook_', { exact: false })).toBeVisible()
  })

  test('file config tetap valid dan ada', async ({ request }) => {
    const dataDir = await resolveDataDir(request)
    const configFile = join(dataDir, 'config.json')
    expect(existsSync(configFile)).toBe(true)
    const config = JSON.parse(readFileSync(configFile, 'utf8')) as {
      profil: unknown
      jamDefault: unknown
      alasan: unknown
      ukuranKertas: string
      folderExport: string
    }
    expect(config.profil).toBeDefined()
    expect(config.jamDefault).toBeDefined()
    expect(Array.isArray(config.alasan)).toBe(true)
    expect(typeof config.folderExport).toBe('string')
  })
})
