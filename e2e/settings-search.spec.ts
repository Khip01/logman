import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * Pencarian menu Pengaturan (AGENTS.md bagian 22).
 *
 * Yang diuji: dua lapis saran (judul menu lalu isi menu), highlight kata yang cocok,
 * pemilihan otomatis saran teratas, navigasi panah, pesan kosong, dan bahasa.
 *
 * Sama seperti spec bahasa, spec ini WAJIB mengembalikan `bahasa` ke `id` setelah
 * selesai, karena `data-e2e` bertahan antar run.
 */

test.describe.configure({ mode: 'serial' })

const API = 'http://127.0.0.1:5198'

async function setBahasa(request: APIRequestContext, bahasa: 'id' | 'en') {
  const current = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: { config: { ...current.config, bahasa } },
  })
}

/** Mengembalikan tier animasi ke `penuh`. Sebagian test kilau mengubahnya. */
async function resetTier(request: APIRequestContext) {
  const current = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: { config: { ...current.config, tierAnimasi: 'penuh' } },
  })
}

test.describe('pencarian pengaturan', () => {
  test.beforeEach(async ({ request }) => {
    await setBahasa(request, 'id')
    await resetTier(request)
  })

  test.afterEach(async ({ request }) => {
    await setBahasa(request, 'id')
    await resetTier(request)
  })

  test('saran lapis judul tampil saat user mengetik nama menu', async ({ page }) => {
    await page.goto('/settings')

    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    await input.fill('jam')

    const hasil = page.getByTestId('settings-search-results')
    await expect(hasil).toBeVisible()
    await expect(hasil.getByRole('option')).toHaveCount(1)
    await expect(hasil.getByRole('option').first()).toContainText('Jam Default')
    // Kata yang cocok disorot.
    await expect(hasil.getByTestId('settings-search-mark')).toHaveText('Jam')
  })

  test('saran lapis konten menampilkan judul menu dan potongan isinya', async ({ page }) => {
    await page.goto('/settings')

    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    await input.fill('PDF')

    const hasil = page.getByTestId('settings-search-results')
    // Satu seksi bisa punya beberapa isi yang memuat kata itu, jadi ambil yang pertama.
    const dokumen = hasil.getByTestId('settings-suggestion-dokumen').first()
    await expect(dokumen).toBeVisible()
    await expect(dokumen).toContainText('Dokumen dan Ekspor')
    await expect(hasil.getByTestId('settings-search-mark').first()).toHaveText('PDF')
  })

  test('menekan Enter memakai saran teratas dan menggulir ke menunya', async ({ page }) => {
    await page.goto('/settings')

    // Mengetik nama menu terakhir supaya tujuan memang perlu digulir.
    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    await input.press('Control+a')
    await input.fill('tampilan')

    await input.press('Enter')

    const seksi = page.getByTestId('section-tampilan-dev')
    await expect(seksi).toBeVisible()
    await expect(seksi).toHaveAttribute('data-flash', 'true')
    // Tier `penuh` memakai gulir halus, jadi `toBeInViewport` diberi waktu lebih longgar.
    await expect(seksi).toBeInViewport({ timeout: 5000 })
  })

  test('panah bawah memindahkan pilihan sebelum Enter', async ({ page }) => {
    await page.goto('/settings')

    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    // "PDF" hanya muncul di isi beberapa menu, jadi seluruh saran adalah lapis konten.
    await input.fill('PDF')

    const opsi = page.getByTestId('settings-search-results').getByRole('option')
    await expect(opsi.first()).toHaveAttribute('aria-selected', 'true')
    await expect(opsi.nth(1)).toBeVisible()

    await input.press('ArrowDown')
    await expect(opsi.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(opsi.first()).toHaveAttribute('aria-selected', 'false')

    // Sasaran ditentukan dari saran kedua itu sendiri, agar test tidak bergantung urutan
    // teks katalog yang bisa berubah.
    const testId = await opsi.nth(1).getAttribute('data-testid')
    const sectionId = testId?.replace('settings-suggestion-', '') ?? ''

    await input.press('Enter')
    await expect(page.getByTestId(`section-${sectionId}`)).toBeInViewport()
  })

  test('menampilkan pesan kosong saat tidak ada yang cocok', async ({ page }) => {
    await page.goto('/settings')

    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    await input.fill('zzzz tidak ada')

    const hasil = page.getByTestId('settings-search-results')
    await expect(hasil).toBeVisible()
    await expect(hasil.getByRole('option')).toHaveCount(0)
    await expect(hasil).toContainText('Tidak ada yang cocok')
  })

  test('Escape menutup daftar saran tanpa menghapus ketikan', async ({ page }) => {
    await page.goto('/settings')

    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    await input.fill('jam')
    await expect(page.getByTestId('settings-search-results')).toBeVisible()

    await input.press('Escape')
    await expect(page.getByTestId('settings-search-results')).toBeHidden()
    await expect(input).toHaveValue('jam')
  })

  test('fokus tanpa ketikan menampilkan seluruh menu', async ({ page }) => {
    await page.goto('/settings')

    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    await input.focus()

    const opsi = page.getByTestId('settings-search-results').getByRole('option')
    await expect(opsi).toHaveCount(9)
    await expect(opsi.first()).toContainText('Profil')
  })

  test('saran ikut bahasa aktif', async ({ page, request }) => {
    await setBahasa(request, 'en')
    await page.goto('/settings')

    const input = page.getByRole('combobox', { name: 'Search settings' })
    await input.fill('paper')

    const hasil = page.getByTestId('settings-search-results')
    await expect(hasil.getByTestId('settings-suggestion-dokumen').first()).toContainText(
      'Document and Export',
    )
  })

  /*
   * Regresi: dulu key React saran disusun dari `sectionId` dan posisi match, sehingga
   * banyak saran punya key DUPLIKAT (mis. semua teks yang mulai cocok di indeks 0). React
   * lalu tidak membuang saran lama, dan hasil pencarian sebelumnya menyantol di atas hasil
   * baru saat user mengetik atau menghapus ketikan.
   */
  test('menambah huruf tidak menyisakan saran dari ketikan sebelumnya', async ({ page }) => {
    await page.goto('/settings')

    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    const opsi = page.getByTestId('settings-search-results').getByRole('option')

    await input.fill('a')
    const jumlahA = await opsi.count()
    expect(jumlahA).toBeGreaterThan(1)

    await input.fill('aa')
    await expect(opsi.first()).toBeVisible()

    // Setiap baris yang tampil HARUS memuat "aa". Saran sisa dari query "a" seperti
    // "Nama mahasiswa" tidak memuat "aa", jadi ikut terdeteksi bila masih menyantol.
    const teks = await opsi.allInnerTexts()
    for (const baris of teks) {
      expect(baris.toLowerCase()).toContain('aa')
    }
  })

  test('menghapus seluruh ketikan mengembalikan sembilan menu tanpa sisa', async ({ page }) => {
    await page.goto('/settings')

    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    const opsi = page.getByTestId('settings-search-results').getByRole('option')

    await input.fill('aaa')
    await expect(page.getByTestId('settings-search-results')).toContainText('Tidak ada yang cocok')

    // Dihapus lewat tombol silang, bukan fill(''), supaya mengikuti alur user sebenarnya.
    await page.getByTestId('settings-search-clear').click()

    await expect(input).toHaveValue('')
    await expect(opsi).toHaveCount(9)
    await expect(opsi.first()).toContainText('Profil')
    await expect(opsi.last()).toContainText('Tampilan')
  })

  /*
   * Kilau sasaran (AGENTS.md bagian 22). Yang penting diuji: kilau muncul saat tier
   * mengizinkan, tidak dijalankan sama sekali pada tier `mati`, dan TIDAK mengubah ukuran
   * maupun posisi seksi, karena hanya `transform` dan `opacity` yang dianimasikan.
   */
  test('kilau body dan border muncul saat seksi dipilih, tanpa menggeser layout', async ({
    page,
    request,
  }) => {
    const current = (await (await request.get(`${API}/api/config`)).json()) as {
      config: Record<string, unknown>
    }
    await request.put(`${API}/api/config`, {
      data: { config: { ...current.config, tierAnimasi: 'penuh' } },
    })

    await page.goto('/settings')
    const seksi = page.getByTestId('section-tema')

    // Ukuran dan posisi diukur SEBELUM kilau berjalan.
    const sebelum = await seksi.boundingBox()

    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    await input.fill('tema')
    await input.press('Enter')

    // Tier penuh: sapuan body, penutup, dan garis border semuanya dirender.
    await expect(seksi.getByTestId('section-glint')).toBeAttached()
    await expect(seksi.getByTestId('section-glint-shine')).toBeAttached()
    await expect(seksi.getByTestId('section-glint-cover')).toBeAttached()
    await expect(seksi.getByTestId('section-glint-ring')).toBeAttached()

    // Elemen kilau tidak boleh menangkap klik, karena ia melapisi seluruh seksi.
    await expect(seksi.getByTestId('section-glint')).toHaveCSS('pointer-events', 'none')

    const sesudah = await seksi.boundingBox()
    expect(sesudah?.width).toBe(sebelum?.width)
    expect(sesudah?.height).toBe(sebelum?.height)
  })

  /*
   * Urutan fase kilau: fade in memperlihatkan keadaan awal, sapuan berjalan, keadaan
   * akhir ditahan, lalu memudar. Yang penting dibuktikan: kilau TIDAK mulai saat gulir
   * masih berjalan, dan penutup border diam selama fade in.
   */
  test('kilau baru mulai setelah gulir mendarat, lalu fade in sebelum sapuan', async ({
    page,
    request,
  }) => {
    const current = (await (await request.get(`${API}/api/config`)).json()) as {
      config: Record<string, unknown>
    }
    await request.put(`${API}/api/config`, {
      data: { config: { ...current.config, tierAnimasi: 'penuh' } },
    })

    await page.goto('/settings')

    // Rekam opacity lapisan dan posisi penutup dari dalam halaman, tiap frame.
    await page.evaluate(() => {
      const w = window as unknown as { __rec?: number[][]; __t0?: number | null }
      w.__rec = []
      w.__t0 = null
      const tick = () => {
        const layer = document.querySelector('[data-testid="section-glint"]')
        const cover = document.querySelector('[data-testid="section-glint-cover"]')
        if (layer) {
          if (w.__t0 === null || w.__t0 === undefined) w.__t0 = performance.now()
          const m = getComputedStyle(cover as Element).transform.match(/matrix\(([^)]+)\)/)
          const y = m?.[1] ? Number.parseFloat(m[1].split(',')[5] ?? '0') : 0
          w.__rec?.push([
            Math.round(performance.now() - (w.__t0 ?? 0)),
            Number(getComputedStyle(layer).opacity),
            y,
          ])
        }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })

    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    await input.fill('tampilan')
    await input.press('Enter')

    /*
     * Tunggu sampai rangkaian kilau benar-benar SELESAI, bukan menebak lewat durasi tetap.
     * Elemen kilau dilepas setelah fade out tuntas, jadi menunggu lepasnya deterministik
     * walau gulir halus ke seksi terjauh memakan waktu lebih lama.
     */
    await page.waitForSelector('[data-testid="section-glint"]', {
      state: 'attached',
      timeout: 10_000,
    })
    await page.waitForSelector('[data-testid="section-glint"]', {
      state: 'detached',
      timeout: 10_000,
    })

    const rec = (await page.evaluate(
      () => (window as unknown as { __rec?: number[][] }).__rec ?? [],
    )) as number[][]

    expect(rec.length).toBeGreaterThan(5)

    /** Tiap frame: [waktu, opacity lapisan, posisi penutup]. */
    const frames = rec.map(([t, op, y]) => ({ t: t ?? 0, op: op ?? 0, y: y ?? 0 }))

    // 1. Ada fase fade in: opacity naik dari rendah menuju penuh sementara penutup diam.
    const fadeIn = frames.filter((f) => f.op > 0.02 && f.op < 0.98 && f.y === 0)
    expect(fadeIn.length).toBeGreaterThan(0)

    // 2. Selama fade in, penutup TIDAK bergerak sama sekali.
    expect(fadeIn.every((f) => f.y === 0)).toBe(true)

    // 3. Setelah fade in, penutup benar-benar bergerak turun.
    expect(frames.filter((f) => f.y > 0).length).toBeGreaterThan(0)

    // 4. Fase fade in terjadi SEBELUM gerakan: frame pertama yang bergerak harus datang
    //    setelah frame terakhir yang masih dalam fade in.
    const framePertamaBergerak = frames.findIndex((f) => f.y > 0)
    expect(framePertamaBergerak).toBeGreaterThan(0)
    const sebelumBergerak = frames.slice(0, framePertamaBergerak)
    expect(sebelumBergerak.every((f) => f.y === 0)).toBe(true)
    // Opacity sudah mendekati penuh saat gerakan dimulai.
    expect(sebelumBergerak[sebelumBergerak.length - 1]?.op).toBeGreaterThan(0.5)

    // 5. Ada fase fade out: opacity menurun lagi SETELAH penutup berhenti di dasar.
    //    Diukur mulai dari frame saat gerakan berhenti, bukan dari persentase jumlah
    //    frame, supaya frame diam di akhir sapuan tidak ikut terhitung.
    const frameTerakhirBergerak = frames.reduce((last, f, i) => (f.y > 0 ? i : last), 0)
    const sesudahGerak = frames.slice(frameTerakhirBergerak)
    expect(sesudahGerak.some((f) => f.op < 0.9)).toBe(true)
    // Rangkaiannya benar-benar berakhir: opacity kembali ke nol.
    expect(frames[frames.length - 1]?.op).toBeLessThan(0.5)
  })

  test('sisi bawah border tidak menyala saat kilau berjalan', async ({ page, request }) => {
    const current = (await (await request.get(`${API}/api/config`)).json()) as {
      config: Record<string, unknown>
    }
    await request.put(`${API}/api/config`, {
      data: { config: { ...current.config, tierAnimasi: 'penuh' } },
    })

    await page.goto('/settings')
    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    await input.fill('tema')
    await input.press('Enter')

    const ring = page.getByTestId('section-glint-ring')
    await expect(ring).toBeAttached()

    // Sisi yang menyala hanya atas, kiri, dan kanan.
    await expect(ring).toHaveCSS('border-bottom-style', 'none')
    const atas = await ring.evaluate((el) => getComputedStyle(el).borderTopWidth)
    const kiri = await ring.evaluate((el) => getComputedStyle(el).borderLeftWidth)
    const kanan = await ring.evaluate((el) => getComputedStyle(el).borderRightWidth)
    expect(Number.parseFloat(atas)).toBeGreaterThan(0)
    expect(Number.parseFloat(kiri)).toBeGreaterThan(0)
    expect(Number.parseFloat(kanan)).toBeGreaterThan(0)
  })

  test('isian body NGE-FILL dari atas dan bergradien sama dengan border', async ({
    page,
    request,
  }) => {
    const current = (await (await request.get(`${API}/api/config`)).json()) as {
      config: Record<string, unknown>
    }
    await request.put(`${API}/api/config`, {
      data: { config: { ...current.config, tierAnimasi: 'penuh' } },
    })

    await page.goto('/settings')
    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    await input.fill('tema')
    await input.press('Enter')

    const shine = page.getByTestId('section-glint-shine')
    await expect(shine).toBeAttached()

    // Titik tumbuhnya di ATAS (`transform-origin: top`), jadi tepi bawahnya yang turun
    // (NGE-FILL), bukan pita yang melintas lewat. Translasi `y` tidak boleh dipakai.
    const asal = await shine.evaluate((el) => getComputedStyle(el).transformOrigin)
    // Chromium menuliskan sumbu vertikalnya sebagai panjang, misal "372px 0px".
    expect(asal.split(/\s+/)[1]).toBe('0px')
    const gerak = await shine.evaluate((el) => {
      const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/)
      if (!m?.[1]) return { scaleY: 1, translateY: 0 }
      const parts = m[1].split(',').map((v) => Number.parseFloat(v))
      return { scaleY: parts[3] ?? 1, translateY: parts[5] ?? 0 }
    })
    // Selama animasi, skala vertikalnya belum penuh tetapi translasinya tetap nol.
    expect(gerak.scaleY).toBeGreaterThanOrEqual(0)
    expect(gerak.translateY).toBe(0)

    // Border dan isian memakai satu gradien yang sama, sehingga tidak ada garis yang
    // lebih tajam daripada isiannya.
    const ring = page.getByTestId('section-glint-ring')
    const gradien = await ring.evaluate((el) => getComputedStyle(el).borderImageSource)
    const gradienIsian = await shine.evaluate((el) => getComputedStyle(el).backgroundImage)
    expect(gradien).toBe(gradienIsian)
    expect(gradien).toContain('linear-gradient')
  })

  test('tier seimbang dan minimal tidak memakai sapuan body, hanya border', async ({
    page,
    request,
  }) => {
    const current = (await (await request.get(`${API}/api/config`)).json()) as {
      config: Record<string, unknown>
    }

    for (const tier of ['seimbang', 'minimal'] as const) {
      await request.put(`${API}/api/config`, {
        data: { config: { ...current.config, tierAnimasi: tier } },
      })
      await page.goto('/settings')

      const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
      await input.fill('bahasa')
      await input.press('Enter')

      const seksi = page.getByTestId('section-bahasa')
      await expect(seksi.getByTestId('section-glint')).toBeAttached()
      await expect(seksi.getByTestId('section-glint-cover')).toBeAttached()
      await expect(seksi.getByTestId('section-glint-shine')).toHaveCount(0)
    }
  })

  test('tier mati tidak menjalankan kilau sama sekali, tetapi tetap menggulir', async ({
    page,
    request,
  }) => {
    const current = (await (await request.get(`${API}/api/config`)).json()) as {
      config: Record<string, unknown>
    }
    await request.put(`${API}/api/config`, {
      data: { config: { ...current.config, tierAnimasi: 'mati' } },
    })

    await page.goto('/settings')
    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    await input.fill('tampilan')
    await input.press('Enter')

    const seksi = page.getByTestId('section-tampilan-dev')
    await expect(seksi).toBeInViewport({ timeout: 5000 })
    // Tanpa kilau, elemen kilau tidak pernah dirender.
    await expect(seksi.getByTestId('section-glint')).toHaveCount(0)
  })

  test('menghapus sebagian ketikan hanya menyisakan saran yang cocok', async ({ page }) => {
    await page.goto('/settings')

    const input = page.getByRole('combobox', { name: 'Cari di Pengaturan' })
    const opsi = page.getByTestId('settings-search-results').getByRole('option')

    await input.fill('aa')
    await input.fill('a')

    const teks = await opsi.allInnerTexts()
    for (const baris of teks) {
      expect(baris.toLowerCase()).toContain('a')
    }
    // Kembali ke keadaan query kosong harus tepat sembilan menu.
    await input.fill('')
    await expect(opsi).toHaveCount(9)
  })
})
