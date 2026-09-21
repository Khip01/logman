import { expect, test } from '@playwright/test'

test('shell tampil dan halaman logbook merender tanpa error', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await page.goto('/')
  await expect(page.getByTestId('sidebar-rail')).toBeVisible()

  // Halaman logbook punya dua bentuk: ajakan mengatur rentang (bila kosong) atau
  // daftar minggu (bila rentang sudah diisi). Uji keduanya agar test tidak rapuh
  // terhadap isi direktori data.
  const kosong = page.getByRole('heading', { name: 'Rentang magang belum diatur' })
  const terisi = page.getByRole('heading', { name: 'Log Book' })
  await expect(kosong.or(terisi)).toBeVisible()
  expect(errors).toEqual([])
})

test('navigasi ke pengaturan menampilkan 9 tema dan tier animasi', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Pengaturan' })).toBeVisible()
  await expect(page.getByText('Hitam Pekat')).toBeVisible()
  await expect(page.getByText('Dark Word')).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Penuh' })).toBeVisible()
})

test('mengganti tema mengubah atribut data-theme', async ({ page }) => {
  await page.goto('/settings')
  await page.getByText('Putih Bersih').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'putih-bersih')
})

test('mengubah tier animasi mengubah data-motion', async ({ page }) => {
  await page.goto('/settings')
  await page.getByRole('radio', { name: 'Minimal' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'minimal')
})

test('rail selalu tampil dan drawer bisa dibuka lalu ditutup', async ({ page }) => {
  await page.goto('/')

  const rail = page.getByTestId('sidebar-rail')
  await expect(rail).toBeVisible()

  // Konten tetap bisa diklik di desktop (tidak ada backdrop yang memblokir).
  await page.locator('h1').first().click()

  // Buka drawer dari tombol di rail.
  await rail.getByRole('button', { name: 'Buka sidebar' }).click()
  const drawer = page.getByTestId('sidebar-drawer')
  await expect(drawer).toBeVisible()

  // Tutup drawer dari dalam drawer, rail tetap ada.
  await drawer.getByRole('button', { name: 'Tutup sidebar' }).click()
  await expect(drawer).toBeHidden()
  await expect(rail).toBeVisible()
})
