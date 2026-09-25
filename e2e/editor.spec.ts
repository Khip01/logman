import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * E2E editor langsung per sel (AGENTS.md bagian 11.2 dan 11.3).
 *
 * Rentang yang dipakai: Rabu 2026-09-23 sampai Sabtu 2026-09-26. Dengan rentang ini,
 * Senin 21 dan Selasa 22 berada SEBELUM magang, sehingga kedua baris harus disabled.
 * Ini menguji aturan yang sama seperti baris milik bulan lain (AGENTS.md bagian 6).
 */

test.describe.configure({ mode: 'serial' })

const API = 'http://127.0.0.1:5198'

async function setRange(request: APIRequestContext, mulai: string, selesai: string) {
  const current = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: {
      config: {
        ...current.config,
        magang: { mulai, selesai },
        // Format jam dikembalikan ke 24 jam agar test normalisasi tidak terpengaruh
        // sisa setelan 12 jam dari spec lain (data-e2e persist antar run).
        formatJam: '24',
        // Tier penuh agar kilatan baris dari banner validasi deterministik, dan skala
        // konten normal agar tata letak tidak bergeser dari sisa setelan spec lain.
        tierAnimasi: 'penuh',
        contentScale: 1,
        tampilkanDevUi: false,
      },
    },
  })
}

test.describe('editor per sel', () => {
  test.beforeEach(async ({ request }) => {
    await setRange(request, '2026-09-23', '2026-09-26')
    // Kosongkan logs agar test tidak mewarisi isi dari spec lain atau run sebelumnya
    // (data-e2e persist antar run; type pada textarea menambah ke nilai lama).
    await request.put(`${API}/api/logs`, { data: { data: { version: 1, days: {} } } })
  })

  test('baris sebelum rentang magang disabled', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('editor-row-2026-09-21')).toHaveAttribute('data-disabled', 'true')
    await expect(page.getByTestId('editor-row-2026-09-22')).toHaveAttribute('data-disabled', 'true')
    await expect(page.getByTestId('editor-row-2026-09-23')).toHaveAttribute(
      'data-disabled',
      'false',
    )

    // Baris disabled tidak punya kontrol yang bisa difokus.
    await expect(page.getByLabel('Kegiatan Senin 21 September 2026')).toHaveCount(0)
  })

  test('mengetik kegiatan langsung di sel dan tersimpan setelah reload', async ({ page }) => {
    await page.goto('/')

    const keg = page.getByLabel('Kegiatan Rabu 23 September 2026')
    await keg.fill('Membuat laporan mingguan')
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    await page.reload()
    await expect(page.getByLabel('Kegiatan Rabu 23 September 2026')).toHaveValue(
      'Membuat laporan mingguan',
    )
  })

  test('Enter menambah baris baru di kolom Kegiatan dan baris tumbuh', async ({ page }) => {
    await page.goto('/')

    const keg = page.getByLabel('Kegiatan Kamis 24 September 2026')
    const tinggiAwal = await keg.evaluate((el) => el.getBoundingClientRect().height)

    await keg.click()
    await keg.type('Baris satu')
    await page.keyboard.press('Enter')
    await keg.type('Baris dua')
    await page.keyboard.press('Enter')
    await keg.type('Baris tiga')

    await expect(keg).toHaveValue('Baris satu\nBaris dua\nBaris tiga')

    const tinggiAkhir = await keg.evaluate((el) => el.getBoundingClientRect().height)
    expect(tinggiAkhir).toBeGreaterThan(tinggiAwal)

    // Tidak boleh ada scrollbar di dalam sel.
    const adaScroll = await keg.evaluate((el) => el.scrollHeight > el.clientHeight + 1)
    expect(adaScroll).toBe(false)
  })

  test('jam dinormalkan ke format titik saat commit', async ({ page }) => {
    await page.goto('/')

    const jam = page.getByLabel('Jam masuk Jumat 25 September 2026')
    await jam.fill('7:05')
    await jam.blur()

    await expect(jam).toHaveValue('07.05')
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })
  })

  test('alasan Sakit menampilkan jam sebagai strip', async ({ page }) => {
    await page.goto('/')

    const sel = page.getByTestId('editor-row-2026-09-24')
    const combobox = sel.getByRole('combobox')
    await combobox.click()
    await expect(combobox).toHaveAttribute('aria-expanded', 'true')
    await page.getByRole('option', { name: 'Sakit' }).click()

    // Alasan tampil sebagai isi kolom Kegiatan.
    await expect(sel.getByText('Sakit', { exact: true })).toBeVisible()
    // Jam menjadi strip: kontrol jam hilang.
    await expect(page.getByLabel('Jam masuk Kamis 24 September 2026')).toHaveCount(0)
    await expect(sel.getByText('-', { exact: true }).first()).toBeVisible()
  })

  /*
   * Regresi: badge "x/y terisi" sebelumnya TIDAK menghitung hari yang diisi ALASAN.
   * Hari ber-alasan statusnya 'libur'/'sakit'/'izin', bukan 'terisi', sedangkan penghitung
   * lama membandingkan langsung dengan 'terisi'. Akibatnya badge tetap 0 padahal barisnya
   * sudah terisi, dan user mengira isian alasan tidak tersimpan.
   */
  test('memilih alasan menambah penghitung hari terisi di kartu minggu', async ({ page }) => {
    await page.goto('/')

    // Kartu minggu memuat enam hari (Senin sampai Sabtu), bukan hanya yang di dalam rentang.
    const kartu = page.getByTestId('week-progress')
    await expect(kartu).toHaveText('0 dari 6 terisi')

    const sel = page.getByTestId('editor-row-2026-09-24')
    await sel.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Libur Nasional' }).click()

    // Menambah lewat ALASAN harus ikut terhitung, bukan hanya lewat kegiatan.
    await expect(kartu).toHaveText('1 dari 6 terisi')
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })
  })

  test('menghapus alasan mengembalikan hari ke kosong', async ({ page }) => {
    await page.goto('/')

    const sel = page.getByTestId('editor-row-2026-09-25')
    await sel.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Izin' }).click()
    await expect(sel.getByText('Izin', { exact: true })).toBeVisible()

    await sel.getByRole('button', { name: /Hapus alasan/ }).click()

    // Kontrol jam muncul kembali dan pemilih alasan tersedia lagi.
    await expect(page.getByLabel('Jam masuk Jumat 25 September 2026')).toBeVisible()
    await expect(sel.getByRole('combobox')).toBeVisible()
  })

  test('alasan bebas bisa diketik dan dipakai', async ({ page }) => {
    await page.goto('/')

    const sel = page.getByTestId('editor-row-2026-09-26')
    const combobox = sel.getByRole('combobox')
    await combobox.fill('Wawancara lapangan')
    await expect(combobox).toHaveAttribute('aria-expanded', 'true')
    await page.getByRole('option', { name: /Gunakan "Wawancara lapangan"/ }).click()

    await expect(sel.getByText('Wawancara lapangan')).toBeVisible()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })
  })

  test('banner validasi menghitung hari yang belum lengkap', async ({ page, request }) => {
    // Rentang penuh satu minggu agar semua baris dapat diisi, dan bersihkan data lama
    // supaya hasil test tidak bergantung test sebelumnya.
    await setRange(request, '2026-09-21', '2026-09-26')
    await request.put(`${API}/api/logs`, { data: { data: { version: 1, days: {} } } })
    await page.goto('/')

    await expect(page.getByText(/hari belum punya kegiatan atau alasan/)).toBeVisible()

    // Isi seluruh enam hari, banner harus berubah menjadi lengkap dan menyebut bulannya.
    const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    for (const nama of hari) {
      const keg = page.getByLabel(`Kegiatan ${nama} ${tanggalUntuk(nama)}`)
      await keg.fill(`Kegiatan ${nama}`)
    }
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })
    await expect(page.getByTestId('validation-banner-ok')).toContainText(
      'Semua hari pada bulan September 2026 sudah lengkap',
    )
  })

  test('menekan hari di banner melompat ke minggu itu dan memfokuskan field kegiatan', async ({
    page,
    request,
  }) => {
    // Rentang dua minggu: supaya ada minggu lain untuk dipindah lebih dulu, sehingga
    // terbukti banner benar-benar mengarahkan balik ke minggu hari yang ditekan.
    await setRange(request, '2026-09-14', '2026-09-26')
    await request.put(`${API}/api/logs`, { data: { data: { version: 1, days: {} } } })
    await page.goto('/')

    // Pindah dulu ke minggu pertama.
    await page.getByRole('tab', { name: /^M1/ }).click()
    await expect(page.getByTestId('editor-row-2026-09-22')).toHaveCount(0)

    await page.getByTestId('banner-day-2026-09-22').click()

    // Baris tujuan kembali tampil, dan field kegiatannya otomatis terfokus.
    const row = page.getByTestId('editor-row-2026-09-22')
    await expect(row).toBeVisible()
    await expect(row).toHaveAttribute('data-flash', 'true')
    await expect(page.getByLabel('Kegiatan Selasa 22 September 2026')).toBeFocused()

    // Mengetik langsung tanpa klik tambahan harus bekerja.
    await page.keyboard.type('Rapat koordinasi')
    await expect(page.getByLabel('Kegiatan Selasa 22 September 2026')).toHaveValue(
      'Rapat koordinasi',
    )
  })

  test('kilatan hilang setelah selesai dan tidak mengganggu baris lain', async ({
    page,
    request,
  }) => {
    await setRange(request, '2026-09-21', '2026-09-26')
    await request.put(`${API}/api/logs`, { data: { data: { version: 1, days: {} } } })
    await page.goto('/')

    await page.getByTestId('banner-day-2026-09-23').click()
    await expect(page.getByTestId('editor-row-2026-09-23')).toHaveAttribute('data-flash', 'true')

    // Setelah animasi selesai, permintaan fokus dibersihkan sendiri.
    await expect(page.getByTestId('editor-row-2026-09-23')).toHaveAttribute('data-flash', 'false', {
      timeout: 5000,
    })
    // Baris lain tidak pernah ikut ditandai.
    await expect(page.getByTestId('editor-row-2026-09-24')).toHaveAttribute('data-flash', 'false')
  })
})

/** Tanggal bahasa Indonesia untuk nama hari pada rentang 21 sampai 26 September 2026. */
function tanggalUntuk(nama: string): string {
  const map: Record<string, string> = {
    Senin: '21 September 2026',
    Selasa: '22 September 2026',
    Rabu: '23 September 2026',
    Kamis: '24 September 2026',
    Jumat: '25 September 2026',
    Sabtu: '26 September 2026',
  }
  return map[nama] ?? ''
}
