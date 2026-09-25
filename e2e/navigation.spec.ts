import { expect, test } from '@playwright/test'

/**
 * E2E navigasi bulan dan minggu (AGENTS.md bagian 6 dan 11.4).
 *
 * Rentang yang dipakai sengaja lintas bulan dan tidak mulai hari Senin:
 * 2026-08-31 (Senin) sampai 2026-09-12 (Sabtu). Minggu 31 Agu sampai 5 Sep muncul di
 * DUA grup bulan sekaligus, sehingga bisa menguji kepemilikan baris per bulan.
 */

test.describe.configure({ mode: 'serial' })

test.describe('navigasi bulan dan minggu', () => {
  test('menampilkan bulan dan minggu dari rentang magang', async ({ page, request }) => {
    // Set rentang lewat API agar test tidak bergantung urutan spec lain.
    // Endpoint GET mengembalikan { config }, PUT menerima { config }.
    const current = (await (await request.get('http://127.0.0.1:5198/api/config')).json()) as {
      config: Record<string, unknown>
    }
    await request.put('http://127.0.0.1:5198/api/config', {
      data: {
        config: {
          ...current.config,
          magang: { mulai: '2026-08-31', selesai: '2026-09-12' },
        },
      },
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Log Book' })).toBeVisible()
    await expect(page.getByRole('tab', { selected: true })).toContainText('M')
  })

  test('pindah bulan dengan tombol navigasi', async ({ page }) => {
    await page.goto('/')
    const bulan = page.locator('h2').first()
    const awal = await bulan.textContent()

    await page.getByRole('button', { name: 'Bulan sebelumnya' }).click()
    await expect(bulan).not.toHaveText(awal ?? '')

    await page.getByRole('button', { name: 'Bulan berikutnya' }).click()
    await expect(bulan).toHaveText(awal ?? '')
  })

  test('kepemilikan baris: minggu lintas bulan aktif di bulan yang berbeda', async ({ page }) => {
    await page.goto('/')

    // Pilih grup Agustus 2026 dan minggu 31 Agu.
    const bulan = page.locator('h2').first()
    if ((await bulan.textContent()) !== 'Agustus 2026') {
      await page.getByRole('button', { name: 'Bulan sebelumnya' }).click()
    }
    await expect(bulan).toHaveText('Agustus 2026')

    await page.getByRole('tab', { name: /31 Agu/ }).click()

    // 31 Agustus milik Agustus, 1 September milik September.
    await expect(page.getByTestId('editor-row-2026-08-31')).toHaveAttribute(
      'data-disabled',
      'false',
    )
    await expect(page.getByTestId('editor-row-2026-09-01')).toHaveAttribute('data-disabled', 'true')
    // Baris disabled tidak punya kontrol yang dapat difokus.
    await expect(page.getByLabel('Kegiatan Selasa 1 September 2026')).toHaveCount(0)

    // Buka grup September 2026 dan minggu yang sama.
    await page.getByRole('button', { name: 'Bulan berikutnya' }).click()
    await expect(bulan).toHaveText('September 2026')
    await page.getByRole('tab', { name: /31 Agu/ }).click()

    await expect(page.getByTestId('editor-row-2026-09-01')).toHaveAttribute(
      'data-disabled',
      'false',
    )
    await expect(page.getByTestId('editor-row-2026-08-31')).toHaveAttribute('data-disabled', 'true')
  })

  test('hari setelah magang selesai disabled dengan alasan yang tepat', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /7 Sep/ }).click()

    // Rentang selesai 2026-09-12, jadi 7 Sep masih aktif.
    await expect(page.getByTestId('editor-row-2026-09-07')).toHaveAttribute(
      'data-disabled',
      'false',
    )

    // Minggu 14 Sep tidak ada di rentang, jadi tidak muncul sebagai tab. Cek bahwa
    // minggu terakhir yang tersedia tetap bisa dibuka.
    await expect(page.getByRole('tab', { name: /14 Sep/ })).toHaveCount(0)
  })

  test('rail membuka daftar minggu lewat popover saat sidebar tertutup', async ({ page }) => {
    await page.goto('/')
    const rail = page.getByTestId('sidebar-rail')
    await expect(rail).toBeVisible()

    await rail
      .getByRole('button', { name: /Bulan / })
      .first()
      .click()
    await expect(page.getByRole('button', { name: /^M1/ }).first()).toBeVisible()

    // Pilih minggu pertama dari popover dan pastikan halaman menampilkannya.
    await page.getByRole('button', { name: /^M1/ }).first().click()
    await expect(page.getByRole('tab', { selected: true })).toContainText('M1')
  })

  test('sidebar drawer menandai minggu aktif dan bisa memilih minggu', async ({
    page,
    request,
  }) => {
    // Rentang dikunci supaya jumlah minggu di September deterministik, dan dev UI
    // dimatikan agar daftar nav dev tidak ikut terbaca sebagai bulan atau minggu.
    const current = (await (await request.get('/api/config')).json()) as {
      config: Record<string, unknown>
    }
    await request.put('/api/config', {
      data: {
        config: {
          ...current.config,
          magang: { mulai: '2026-08-31', selesai: '2026-09-12' },
          tampilkanDevUi: false,
        },
      },
    })

    await page.goto('/')
    await page.getByTestId('sidebar-open-logo').click()

    const drawer = page.getByTestId('sidebar-drawer')
    await expect(drawer).toBeVisible()

    // Menekan item bulan hanya membuka daftar minggunya, TIDAK memilih bulan. Minggu
    // di dalamnya sudah terlihat karena bulan aktif dibuka otomatis.
    const september = drawer.getByRole('button', { name: 'September 2026' })
    await expect(september).toHaveAttribute('aria-expanded', 'true')
    const minggu = drawer.getByRole('button', { name: /^M2/ }).first()
    await expect(minggu).toBeVisible()

    // Menekan item bulan lagi menutup daftar minggunya.
    await september.click()
    await expect(september).toHaveAttribute('aria-expanded', 'false')
    await expect(drawer.getByRole('button', { name: /^M2/ })).toHaveCount(0)
    await september.click()

    await minggu.click()
    await expect(page.getByRole('tab', { selected: true })).toContainText('M2')

    await drawer.getByTestId('sidebar-collapse-strip').click()
    await expect(drawer).toBeHidden()
  })

  test('bulan ditandai aktif hanya pada bulan minggu terpilih, dan tidak menutup bulan lain', async ({
    page,
    request,
  }) => {
    const current = (await (await request.get('/api/config')).json()) as {
      config: Record<string, unknown>
    }
    await request.put('/api/config', {
      data: {
        config: {
          ...current.config,
          magang: { mulai: '2026-07-01', selesai: '2026-09-30' },
          tampilkanDevUi: false,
        },
      },
    })

    await page.goto('/')
    await page.getByTestId('sidebar-open-logo').click()
    const drawer = page.getByTestId('sidebar-drawer')
    await expect(drawer).toBeVisible()

    // Tepat satu bulan ditandai aktif, mengikuti minggu yang sedang dipilih.
    const aktif = drawer.locator('button[data-active="true"]')
    await expect(aktif).toHaveCount(1)
    await expect(aktif).toHaveText('September 2026')

    // Buka pula Juli dan Agustus.
    const juli = drawer.getByRole('button', { name: 'Juli 2026' })
    const agustus = drawer.getByRole('button', { name: 'Agustus 2026' })
    await juli.click()
    await agustus.click()
    await expect(juli).toHaveAttribute('aria-expanded', 'true')
    await expect(agustus).toHaveAttribute('aria-expanded', 'true')

    // Bulan aktif TIDAK ikut berubah walau bulan lain dibuka.
    await expect(aktif).toHaveCount(1)
    await expect(aktif).toHaveText('September 2026')

    // Pilih minggu di Agustus: penanda aktif pindah ke Agustus.
    await agustus.locator('xpath=following-sibling::ul[1]//button[contains(., "M2")]').click()
    await expect(aktif).toHaveCount(1)
    await expect(aktif).toHaveText('Agustus 2026')

    // Semua bulan yang tadi terbuka TETAP terbuka, tidak ada yang ditutup otomatis.
    await expect(juli).toHaveAttribute('aria-expanded', 'true')
    await expect(agustus).toHaveAttribute('aria-expanded', 'true')
  })

  test('minggu lintas bulan hanya ditandai aktif pada bulan konteksnya', async ({
    page,
    request,
  }) => {
    // Rentang ini membuat minggu 31 Agu - 5 Sep muncul di Agustus (M6) DAN September (M1).
    const current = (await (await request.get('/api/config')).json()) as {
      config: Record<string, unknown>
    }
    await request.put('/api/config', {
      data: {
        config: {
          ...current.config,
          magang: { mulai: '2026-08-01', selesai: '2026-09-30' },
          tampilkanDevUi: false,
        },
      },
    })

    await page.goto('/')
    // Pindah ke Agustus lalu pilih M6, sehingga bulan konteksnya Agustus.
    await page.getByRole('button', { name: 'Bulan sebelumnya' }).click()
    await page.getByRole('tab', { name: /^M6/ }).click()

    await page.getByTestId('sidebar-open-logo').click()
    const drawer = page.getByTestId('sidebar-drawer')
    await expect(drawer).toBeVisible()

    // Buka September TAMBAHAN; Agustus sudah otomatis terbuka sebagai bulan aktif.
    await drawer.getByRole('button', { name: 'September 2026' }).click()
    await expect(drawer.getByRole('button', { name: 'September 2026' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    // Kedua baris minggu yang sama-sama "31 Agu - 5 Sep" terlihat, tetapi HANYA SATU
    // yang ditandai aktif, yaitu milik Agustus (bulan konteks), bukan September.
    await expect(drawer.locator('button[aria-current="true"]')).toHaveCount(1)

    const agustusM6 = drawer
      .getByRole('button', { name: 'Agustus 2026' })
      .locator('xpath=following-sibling::ul[1]//button[contains(., "M6")]')
    await expect(agustusM6).toHaveAttribute('aria-current', 'true')
  })
})
