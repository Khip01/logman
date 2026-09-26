import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * Pengalih bahasa antarmuka (AGENTS.md bagian 21).
 *
 * Cakupan uji:
 * - default Indonesia, termasuk judul tab;
 * - mengganti bahasa ke Inggris mengubah shell dan halaman;
 * - judul tab mengikuti halaman dan bahasa;
 * - isi dokumen cetak mengikuti `bahasaDokumen`, TERPISAH dari `bahasa` antarmuka;
 * - pilihan bahasa bertahan setelah muat ulang.
 *
 * PENTING: seluruh test di sini membuka halaman Log Book dan mengharapkan editor
 * benar-benar tampil. Bila rentang magang kosong, halaman justru menampilkan empty state
 * "Rentang magang belum diatur" dan test gagal. Direktori `data-e2e` dipakai bersama semua
 * spec dan defaultnya rentang KOSONG, sementara spec lain (misalnya `data.spec.ts`)
 * sengaja mengosongkannya, jadi rentang DIISI SENDIRI di sini, bukan diwarisi.
 */

test.describe.configure({ mode: 'serial' })

const API = 'http://127.0.0.1:5198'

/** Rentang tetap agar test tidak bergantung spec lain maupun run sebelumnya. */
const RENTANG = { mulai: '2026-09-21', selesai: '2026-09-26' }

/** Setel sebagian config lewat API, dengan nilai lain dipertahankan. */
async function setConfig(request: APIRequestContext, patch: Record<string, unknown>) {
  const current = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: { config: { ...current.config, ...patch } },
  })
}

test.describe('bahasa antarmuka', () => {
  test.beforeEach(async ({ request }) => {
    // Hermetik: data-e2e persist antar run, jadi bahasa dan rentang dikembalikan ke
    // nilai yang dibutuhkan test ini lebih dulu.
    await setConfig(request, { bahasa: 'id', bahasaDokumen: 'id', magang: RENTANG })
  })

  // WAJIB: config bertahan setelah run, sehingga bahasa Inggris ATAU rentang yang diubah
  // test ini akan merusak spec berikutnya.
  test.afterEach(async ({ request }) => {
    await setConfig(request, { bahasa: 'id', bahasaDokumen: 'id', magang: RENTANG })
  })

  test('default Indonesia dan judul tab memakai nama produk', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Log Book', level: 1 })).toBeVisible()
    await expect(page).toHaveTitle('Log Book Manager')
  })

  test('judul tab mengikuti halaman dan bahasa', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveTitle('Pengaturan - Log Book Manager')

    await page.getByTestId('section-bahasa').getByRole('radio', { name: 'English' }).click()
    await expect(page).toHaveTitle('Settings - Log Book Manager')
  })

  test('mengganti ke Inggris mengubah shell dan halaman', async ({ page }) => {
    await page.goto('/settings')
    const bahasa = page.getByTestId('section-bahasa')

    await bahasa.getByRole('radio', { name: 'English' }).click()

    // Judul halaman dan label navigasi ikut berubah.
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
    await page.getByTestId('sidebar-open-logo').click()
    const drawer = page.getByTestId('sidebar-drawer')
    await expect(drawer.getByTestId('sidebar-brand')).toBeVisible()
    await expect(drawer.getByText('Log Book').first()).toBeVisible()

    // Tabel di layar mengikuti bahasa DOKUMEN, bukan bahasa antarmuka, karena preview di
    // browser adalah dokumen itu sendiri. Jadi dengan antarmuka Inggris tapi dokumen
    // Indonesia, judul kolomnya TETAP bahasa Indonesia. Data log dimuat lewat jaringan
    // setelah halaman mount, jadi diberi waktu lebih longgar.
    await page.goto('/')
    await expect(page.getByRole('columnheader', { name: 'Kegiatan' })).toBeVisible({
      timeout: 15_000,
    })
  })

  /*
   * Bahasa isi dokumen terpisah dari bahasa antarmuka. Ini menggantikan aturan lama yang
   * menyatukan keduanya, yaitu dokumen SELALU bahasa Indonesia.
   */
  test('isi dokumen tetap Indonesia walau antarmuka Inggris', async ({ page }) => {
    await setConfig(page.request, { bahasa: 'en' })
    await page.goto('/')
    const doc = page.getByTestId('print-identity')
    await expect(doc).toContainText('Nama')
    await expect(doc).toContainText('Program Studi')
  })

  test('bahasa dokumen Inggris mengubah isi dokumen tanpa mengubah kop surat', async ({ page }) => {
    await setConfig(page.request, { bahasaDokumen: 'en' })
    await page.goto('/')

    const doc = page.getByTestId('print-identity')
    await expect(doc).toContainText('Name')
    await expect(doc).toContainText('Study Program')

    // Judul dokumen dan kop surat tetap Indonesia, itu bagian identitas resmi kampus.
    await expect(page.getByTestId('print-heading')).toContainText('LOG BOOK MAGANG')
    await expect(page.getByTestId('print-letterhead')).toContainText('JURUSAN TEKNOLOGI INFORMASI')
  })

  test('nama hari dan judul kolom di tabel ikut bahasa dokumen', async ({ page }) => {
    await setConfig(page.request, { bahasaDokumen: 'en' })
    await page.goto('/')
    await expect(page.getByRole('columnheader', { name: 'Day, Date' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('columnheader', { name: 'Time In' })).toBeVisible()
  })

  test('pilihan bahasa bertahan setelah muat ulang', async ({ page }) => {
    await page.goto('/settings')
    await page.getByTestId('section-bahasa').getByRole('radio', { name: 'English' }).click()
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
  })
})
