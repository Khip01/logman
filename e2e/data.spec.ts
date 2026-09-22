import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * E2E alur data (AGENTS.md bagian 14).
 *
 * Catatan penting:
 * - Direktori data diambil dari endpoint health, bukan diasumsikan, karena server
 *   bisa dijalankan dengan LOGMAN_DATA_DIR berbeda.
 * - Nilai yang diisi dibuat unik per run, supaya test tetap menguji perubahan walau
 *   server dipakai ulang dan sudah menyimpan nilai sebelumnya.
 */

test.describe.configure({ mode: 'serial' })

async function resolveDataDir(request: APIRequestContext): Promise<string> {
  const response = await request.get('http://127.0.0.1:5198/api/health')
  const body = (await response.json()) as { dataDir: string }
  return isAbsolute(body.dataDir) ? body.dataDir : join(process.cwd(), body.dataDir)
}

/** Nilai unik per run agar selalu terdeteksi sebagai perubahan. */
const RUN = Date.now().toString().slice(-6)
const NAMA = `Akhmad ${RUN}`
const NIM = `234172${RUN}`

test.describe('alur data', () => {
  test('mengisi rentang magang lalu daftar minggu muncul', async ({ page }) => {
    await page.goto('/settings')

    await page.getByLabel('Tanggal mulai magang').fill('2026-08-01')
    await page.getByLabel('Tanggal selesai magang').fill('2026-09-30')
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Log Book' })).toBeVisible()
    // Halaman menampilkan satu bulan aktif pada satu waktu; bulan yang memuat hari ini
    // dibuka otomatis, dan bulan lain dijangkau lewat tombol navigasi.
    await expect(page.locator('h2').first()).toHaveText('September 2026')
    await page.getByRole('button', { name: 'Bulan sebelumnya' }).click()
    await expect(page.locator('h2').first()).toHaveText('Agustus 2026')
  })

  test('data bertahan setelah reload', async ({ page }) => {
    await page.goto('/settings')
    await page.getByLabel('Nama mahasiswa', { exact: true }).fill(NAMA)
    await page.getByLabel('NIM', { exact: true }).fill(NIM)
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    await page.reload()
    await expect(page.getByLabel('Nama mahasiswa', { exact: true })).toHaveValue(NAMA)
    await expect(page.getByLabel('NIM', { exact: true })).toHaveValue(NIM)
  })

  test('menulis file config dan logs ke disk', async ({ page, request }) => {
    const dataDir = await resolveDataDir(request)
    const configFile = join(dataDir, 'config.json')

    await page.goto('/settings')
    // Pakai nilai unik agar selalu terdeteksi sebagai perubahan.
    await page.getByLabel('Program Studi').fill(`Prodi ${RUN}`)
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    expect(existsSync(configFile)).toBe(true)
    const config = JSON.parse(readFileSync(configFile, 'utf8')) as {
      profil: { nama: string; programStudi: string }
    }
    expect(config.profil.nama).toBe(NAMA)
    expect(config.profil.programStudi).toBe(`Prodi ${RUN}`)
  })

  test('endpoint patch menulis logs.json ke disk', async ({ request }) => {
    const dataDir = await resolveDataDir(request)
    const logsFile = join(dataDir, 'logs.json')

    const response = await request.patch('http://127.0.0.1:5198/api/logs', {
      data: { patch: { '2026-09-21': { kegiatan: `Kegiatan ${RUN}`, status: 'terisi' } } },
    })
    expect(response.ok()).toBe(true)

    expect(existsSync(logsFile)).toBe(true)
    const logs = JSON.parse(readFileSync(logsFile, 'utf8')) as {
      version: number
      days: Record<string, { kegiatan: string }>
    }
    expect(logs.version).toBe(1)
    expect(logs.days['2026-09-21']?.kegiatan).toBe(`Kegiatan ${RUN}`)
  })

  test('backup dibuat sebelum menimpa file', async ({ request }) => {
    const dataDir = await resolveDataDir(request)
    const backupsDir = join(dataDir, 'backups')

    // Tulis dua kali agar backup terbentuk pada penulisan kedua.
    for (const kegiatan of [`Pertama ${RUN}`, `Kedua ${RUN}`]) {
      await request.patch('http://127.0.0.1:5198/api/logs', {
        data: { patch: { '2026-09-22': { kegiatan, status: 'terisi' } } },
      })
    }

    const backups = await request.get('http://127.0.0.1:5198/api/backups')
    const body = (await backups.json()) as { backups: { file: string }[] }
    expect(body.backups.length).toBeGreaterThan(0)
    expect(existsSync(backupsDir)).toBe(true)
  })

  test('ganti tema tersimpan ke konfigurasi', async ({ page, request }) => {
    const dataDir = await resolveDataDir(request)

    // Paksa tema awal berbeda dari target, supaya klik selalu memicu penyimpanan
    // walau data-e2e masih menyimpan tema yang sama dari run sebelumnya.
    const current = (await (await request.get('http://127.0.0.1:5198/api/config')).json()) as {
      config: Record<string, unknown>
    }
    await request.put('http://127.0.0.1:5198/api/config', {
      data: { config: { ...current.config, tema: 'hitam-pekat' } },
    })

    await page.goto('/settings')
    await page.getByText('Putih Bersih').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'putih-bersih')
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    const config = JSON.parse(readFileSync(join(dataDir, 'config.json'), 'utf8')) as {
      tema: string
    }
    expect(config.tema).toBe('putih-bersih')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'putih-bersih')
  })

  test('status bar menampilkan status simpan', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.getByTestId('save-status')).toBeVisible()
  })

  test('rentang yang terbalik dipulihkan server', async ({ page, request }) => {
    const dataDir = await resolveDataDir(request)
    await page.goto('/settings')
    await page.getByLabel('Tanggal mulai magang').fill('2026-12-31')
    await page.getByLabel('Tanggal selesai magang').fill('2026-01-01')
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    const config = JSON.parse(readFileSync(join(dataDir, 'config.json'), 'utf8')) as {
      magang: { mulai: string; selesai: string }
    }
    expect(config.magang.mulai <= config.magang.selesai).toBe(true)
  })
})
