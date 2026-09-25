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
 */

test.describe.configure({ mode: 'serial' })

/** Setel bahasa lewat API. Dipakai beforeEach dan afterEach. */
async function setBahasa(request: APIRequestContext, bahasa: 'id' | 'en') {
  const current = (await (await request.get('http://127.0.0.1:5198/api/config')).json()) as {
    config: Record<string, unknown>
  }
  await request.put('http://127.0.0.1:5198/api/config', {
    data: { config: { ...current.config, bahasa } },
  })
}

test.describe('bahasa antarmuka', () => {
  test.beforeEach(async ({ request }) => {
    // Hermetik: data-e2e persist antar run, jadi bahasa dikembalikan ke default dulu.
    await setBahasa(request, 'id')
  })

  // WAJIB: config bertahan setelah run, sehingga bahasa Inggris akan merusak spec
  // berikutnya yang mencari teks Indonesia.
  test.afterEach(async ({ request }) => {
    await setBahasa(request, 'id')
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
