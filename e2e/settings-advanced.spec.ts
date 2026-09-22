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

async function setConfig(request: APIRequestContext, patch: Record<string, unknown>) {
  const current = (await (await request.get('http://127.0.0.1:5198/api/config')).json()) as {
    config: Record<string, unknown>
  }
  await request.put('http://127.0.0.1:5198/api/config', {
    data: { config: { ...current.config, ...patch } },
  })
}

test.describe('settings lanjutan', () => {
  test.beforeEach(async ({ request }) => {
    // Kembalikan jam dan format yang diubah test ini ke default, supaya komit selalu
    // dianggap perubahan walau data-e2e masih menyimpan hasil run sebelumnya.
    await setConfig(request, {
      formatJam: '24',
      jamDefault: {
        senin: { masuk: '08.00', pulang: '16.00' },
        selasa: { masuk: '08.00', pulang: '16.00' },
        rabu: { masuk: '08.00', pulang: '16.00' },
        kamis: { masuk: '08.00', pulang: '16.00' },
        jumat: { masuk: '08.00', pulang: '16.00' },
        sabtu: { masuk: '08.00', pulang: '16.00' },
      },
    })
  })

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
    await page.getByTestId('section-alasan').getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'Hapus alasan Wawancara' })).toBeVisible()

    // Duplikat tidak menambah entri baru.
    await page.getByLabel('Tambah alasan').fill('wawancara')
    await page.getByTestId('section-alasan').getByRole('button', { name: 'Tambah' }).click()
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

  test('format jam 12 menampilkan AM/PM dan tetap menyimpan 24 jam', async ({ page, request }) => {
    await page.goto('/settings')

    await page.getByRole('radio', { name: '12 Jam (AM/PM)' }).click()
    const seninPulang = page.getByLabel('Jam pulang Senin')
    await expect(seninPulang).toHaveValue('4.00 PM')

    await seninPulang.fill('5.30 PM')
    await seninPulang.blur()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    const config = JSON.parse(
      readFileSync(join(await resolveDataDir(request), 'config.json'), 'utf8'),
    ) as { formatJam: string; jamDefault: Record<string, { pulang: string }> }
    expect(config.formatJam).toBe('12')
    expect(config.jamDefault.senin?.pulang).toBe('17.30')
  })

  test('pembimbing lapangan bisa ditambah, dijadikan default, dan dihapus', async ({
    page,
    request,
  }) => {
    await page.goto('/settings')
    const section = page.getByTestId('section-penanda-tangan')

    await page.getByLabel('Dosen Pembimbing').fill('Dr. Budi Santoso')

    await page.getByLabel('Tambah pembimbing').fill('Siti Aminah')
    await section.getByRole('button', { name: 'Tambah' }).click()
    await page.getByLabel('Tambah pembimbing').fill('Andi Wijaya')
    await section.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    // Jadikan Andi default.
    await section.getByRole('button', { name: 'Andi Wijaya', exact: true }).click()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    const config = JSON.parse(
      readFileSync(join(await resolveDataDir(request), 'config.json'), 'utf8'),
    ) as {
      dosenPembimbing: string
      pembimbingLapangan: string[]
      pembimbingLapanganDefault: string
    }
    expect(config.dosenPembimbing).toBe('Dr. Budi Santoso')
    expect(config.pembimbingLapangan).toEqual(['Siti Aminah', 'Andi Wijaya'])
    expect(config.pembimbingLapanganDefault).toBe('Andi Wijaya')

    // Hapus default: default bergeser ke nama pertama yang tersisa.
    await section.getByRole('button', { name: 'Hapus pembimbing Andi Wijaya' }).click()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })
    const after = JSON.parse(
      readFileSync(join(await resolveDataDir(request), 'config.json'), 'utf8'),
    ) as { pembimbingLapangan: string[]; pembimbingLapanganDefault: string }
    expect(after.pembimbingLapangan).toEqual(['Siti Aminah'])
    expect(after.pembimbingLapanganDefault).toBe('Siti Aminah')
  })

  test('toggle UI dev tersimpan dan menyembunyikan menu dev di sidebar', async ({
    page,
    request,
  }) => {
    // Nyalakan lewat API lalu buka halaman untuk melihat menu dev muncul di drawer.
    await setConfig(request, { tampilkanDevUi: true })
    await page.goto('/')
    await page.getByTestId('sidebar-open-logo').click()
    await expect(page.getByTestId('sidebar-drawer').getByText('Dev')).toBeVisible()

    await page.keyboard.press('Escape')
    await page.goto('/settings')
    await page.getByLabel('Perlihatkan UI pengembangan').click()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    const config = JSON.parse(
      readFileSync(join(await resolveDataDir(request), 'config.json'), 'utf8'),
    ) as { tampilkanDevUi: boolean }
    expect(config.tampilkanDevUi).toBe(false)
  })
})
