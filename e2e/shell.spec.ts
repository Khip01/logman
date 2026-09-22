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

  // Buka drawer dari tombol logo di rail.
  await page.getByTestId('sidebar-open-logo').click()
  const drawer = page.getByTestId('sidebar-drawer')
  await expect(drawer).toBeVisible()

  // Tutup drawer dari tombol collapse di dasar drawer, rail tetap ada.
  await drawer.getByTestId('sidebar-collapse-strip').click()
  await expect(drawer).toBeHidden()
  await expect(rail).toBeVisible()
})

test('drawer bisa dibuka dari strip bawah dan ditutup dengan Escape', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('sidebar-open-strip').click()
  const drawer = page.getByTestId('sidebar-drawer')
  await expect(drawer).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
})

test('rail punya ikon Log Book, Pengaturan, dan Ekspor yang bisa diklik', async ({ page }) => {
  await page.goto('/settings')
  const rail = page.getByTestId('sidebar-rail')

  await expect(rail.getByTestId('rail-logbook')).toBeVisible()
  await expect(rail.getByTestId('rail-settings')).toBeVisible()

  await rail.getByTestId('rail-logbook').click()
  await expect(page.getByRole('heading', { name: 'Log Book' })).toBeVisible()

  await rail.getByTestId('rail-export').click()
  await expect(page.getByRole('heading', { name: 'Ekspor PDF' })).toBeVisible()
})

test('drawer membuka bulan aktif dan menandai minggu yang sedang dibuka', async ({
  page,
  request,
}) => {
  // Rentang dikunci supaya bulan dan minggu aktif deterministik, dan dev UI dimatikan
  // agar daftar nav drawer tidak mengganggu pencarian elemen.
  const current = (await (await request.get('/api/config')).json()) as {
    config: Record<string, unknown>
  }
  await request.put('/api/config', {
    data: {
      config: {
        ...current.config,
        magang: { mulai: '2026-09-01', selesai: '2026-10-31' },
        tampilkanDevUi: false,
      },
    },
  })

  await page.goto('/')
  await page.getByTestId('sidebar-open-logo').click()

  const drawer = page.getByTestId('sidebar-drawer')
  await expect(drawer).toBeVisible()

  // Bulan aktif terbuka sendiri, jadi daftar minggunya langsung terlihat.
  const activeMonth = drawer.getByRole('button', { name: /September 2026/ })
  await expect(activeMonth).toHaveAttribute('aria-expanded', 'true')

  // Minggu yang sedang dibuka ditandai aria-current.
  await expect(drawer.locator('[aria-current="true"]')).toHaveCount(1)
})
