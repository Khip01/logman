import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * Pengalih bahasa antarmuka (AGENTS.md bagian 21).
 *
 * Cakupan uji:
 * - default Indonesia, termasuk judul tab;
 * - mengganti bahasa ke Inggris mengubah shell dan halaman;
 * - judul tab mengikuti halaman dan bahasa;
 * - dokumen cetak TETAP bahasa Indonesia walau antarmuka Inggris, karena mengikuti
 *   template kampus;
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
    await setConfig(request, { bahasa: 'id', magang: RENTANG })
  })

  // WAJIB: config bertahan setelah run, sehingga bahasa Inggris ATAU rentang yang diubah
  // test ini akan merusak spec berikutnya.
  test.afterEach(async ({ request }) => {
    await setConfig(request, { bahasa: 'id', magang: RENTANG })
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

    // Editor memakai judul kolom bahasa Inggris. Data log dimuat lewat jaringan setelah
    // halaman mount, jadi judul kolom diberi waktu lebih longgar. Tanpa ini test rapuh
    // saat mesin sedang sibuk dan tabel belum selesai dirender.
    await page.goto('/')
    await expect(page.getByRole('columnheader', { name: 'Activities' })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('dokumen cetak tetap bahasa Indonesia saat antarmuka Inggris', async ({ page }) => {
    const current = (await (await page.request.get('http://127.0.0.1:5198/api/config')).json()) as {
      config: Record<string, unknown>
    }
    await page.request.put('http://127.0.0.1:5198/api/config', {
      data: { config: { ...current.config, bahasa: 'en' } },
    })

    await page.goto('/')
    const doc = page.getByTestId('print-identity')
    await expect(doc).toContainText('Nama')
    await expect(doc).toContainText('Program Studi')
  })

  test('pilihan bahasa bertahan setelah muat ulang', async ({ page }) => {
    await page.goto('/settings')
    await page.getByTestId('section-bahasa').getByRole('radio', { name: 'English' }).click()
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
  })
})
