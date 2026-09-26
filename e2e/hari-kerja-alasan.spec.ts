import { type APIRequestContext, expect, type Page, test } from '@playwright/test'

/**
 * E2E untuk dua pengaturan yang ditambahkan belakangan (AGENTS.md bagian 11.7 dan 11.8).
 *
 * 1. HARI KERJA: pengguna dapat mematikan Sabtu, sehingga tabel dokumen dan PDF hanya
 *    punya lima baris Senin sampai Jumat.
 * 2. ALASAN STRIP: pengguna dapat menandai alasan sendiri sebagai pembuat strip jam,
 *    sehingga alasan kustom seperti "Sakit Gigi" juga menampilkan jam sebagai strip.
 *
 * Rentang dikunci ke 2026-09-21 sampai 2026-09-26 (Minggu 4 September 2026) supaya
 * minggu yang diuji tidak bergantung tanggal hari ini. `data-e2e` bertahan antar run,
 * jadi setiap test mengembalikan `hariKerja`, `alasan`, dan `logs` ke keadaan netral.
 */

test.describe.configure({ mode: 'serial' })

const API = 'http://127.0.0.1:5198'
const MULAI = '2026-09-21'
const SELESAI = '2026-09-26'

const SENIN_SABTU = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
const SENIN_JUMAT = ['senin', 'selasa', 'rabu', 'kamis', 'jumat']

/** Enam hari Senin sampai Sabtu pada minggu M4 September 2026. */
const HARI_MINGGU = [
  '2026-09-21',
  '2026-09-22',
  '2026-09-23',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
]

async function setConfig(
  request: APIRequestContext,
  patch: Record<string, unknown>,
): Promise<void> {
  const current = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: {
      config: {
        ...current.config,
        magang: { mulai: MULAI, selesai: SELESAI },
        // Setelan berikut dikunci agar test tidak dipengaruhi spec lain.
        formatJam: '24',
        tierAnimasi: 'penuh',
        contentScale: 1,
        bahasa: 'id',
        tampilkanDevUi: false,
        ...patch,
      },
    },
  })
}

/**
 * Baris tabel editor yang benar-benar ada di DOM, yaitu milik bulan dan rentang.
 *
 * WAJIB menunggu tabel muncul dulu. `evaluateAll` tidak melakukan wait otomatis
 * seperti `expect`, jadi tanpa tunggu eksplisit ukurannya bisa nol padahal tabelnya
 * belum selesai render.
 */
async function barisTerisi(page: Page): Promise<string[]> {
  await page.locator('table.doc-table').first().waitFor({ state: 'attached' })
  return page
    .locator('[data-testid^="editor-row-"]')
    .evaluateAll((els) =>
      els
        .filter((el) => el.getAttribute('data-disabled') !== 'true')
        .map((el) => el.getAttribute('data-testid') ?? ''),
    )
}

/** Mengembalikan config dan log ke keadaan netral. */
async function bersihkan(request: APIRequestContext): Promise<void> {
  await setConfig(request, { hariKerja: SENIN_SABTU })
  await request.put(`${API}/api/logs`, { data: { data: { version: 1, days: {} } } })
}

test.describe('hari kerja', () => {
  test.afterEach(async ({ request }) => {
    await bersihkan(request)
  })

  test('bawaannya enam baris Senin sampai Sabtu', async ({ page, request }) => {
    await setConfig(request, { hariKerja: SENIN_SABTU })
    await page.goto('/')

    const baris = await barisTerisi(page)
    expect(baris).toHaveLength(6)
    for (const tanggal of HARI_MINGGU) {
      await expect(page.getByTestId(`editor-row-${tanggal}`)).toHaveCount(1)
    }
  })

  test('mematikan Sabtu menghapus baris Sabtu dari tabel', async ({ page, request }) => {
    await setConfig(request, { hariKerja: SENIN_JUMAT })
    await page.goto('/')

    // Baris Sabtu tidak lagi ada sama sekali, bukan cuma disabled.
    await expect(page.getByTestId('editor-row-2026-09-26')).toHaveCount(0)
    const baris = await barisTerisi(page)
    expect(baris).toHaveLength(5)
    for (const tanggal of HARI_MINGGU.slice(0, 5)) {
      await expect(page.getByTestId(`editor-row-${tanggal}`)).toHaveCount(1)
    }
  })

  test('toggle di Settings mengubah jumlah baris dan tersimpan di config.json', async ({
    page,
    request,
  }) => {
    await setConfig(request, { hariKerja: SENIN_SABTU })
    await page.goto('/settings')

    const tombolSabtu = page.getByRole('button', { name: 'Sabtu', exact: true })
    await expect(tombolSabtu).toHaveAttribute('aria-pressed', 'true')

    await tombolSabtu.click()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })
    await expect(tombolSabtu).toHaveAttribute('aria-pressed', 'false')

    const config = (await (await request.get(`${API}/api/config`)).json()) as {
      config: { hariKerja: string[] }
    }
    expect(config.config.hariKerja).toEqual(SENIN_JUMAT)

    await page.goto('/')
    await expect(page.getByTestId('editor-row-2026-09-26')).toHaveCount(0)
  })

  /*
   * Mematikan semua hari akan membuat tabel tanpa baris sama sekali, dan Log Book jadi
   * tidak bisa diisi. Jadi hari terakhir yang menyala tidak boleh bisa dimatikan.
   */
  test('hari terakhir yang menyala tidak bisa dimatikan', async ({ page, request }) => {
    await setConfig(request, { hariKerja: ['senin'] })
    await page.goto('/settings')

    const tombolSenin = page.getByRole('button', { name: 'Senin', exact: true })
    await expect(tombolSenin).toBeDisabled()
    await expect(tombolSenin).toHaveAttribute('aria-disabled', 'true')
    await expect(tombolSenin).toHaveAttribute('aria-pressed', 'true')
  })

  test('menyalakan kembali Sabtu mengembalikan baris', async ({ page, request }) => {
    await setConfig(request, { hariKerja: SENIN_JUMAT })
    await page.goto('/')
    await expect(page.getByTestId('editor-row-2026-09-26')).toHaveCount(0)

    await page.goto('/settings')
    await page.getByRole('button', { name: 'Sabtu', exact: true }).click()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    await page.goto('/')
    await expect(page.getByTestId('editor-row-2026-09-26')).toHaveCount(1)
  })
})

test.describe('alasan dengan strip jam', () => {
  test.afterEach(async ({ request }) => {
    await bersihkan(request)
  })

  test('toggle strip pada alasan kustom membuat jam jadi strip di editor', async ({
    page,
    request,
  }) => {
    await setConfig(request, {
      alasan: [
        { label: 'Libur Nasional', stripJam: false },
        { label: 'Sakit Gigi', stripJam: true },
      ],
    })
    await page.goto('/')

    const sel = page.getByTestId('editor-row-2026-09-24')
    await sel.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Sakit Gigi' }).click()

    // Alasan tampil di kolom Kegiatan.
    await expect(sel.getByText('Sakit Gigi', { exact: true })).toBeVisible()
    // Kontrol jam hilang dan yang tampil adalah strip. Inilah yang tidak mungkin dulu:
    // "Sakit Gigi" bukan "Sakit" dan "Izin", jadi tidak pernah strip.
    await expect(page.getByLabel('Jam masuk Kamis 24 September 2026')).toHaveCount(0)
    await expect(sel.getByText('-', { exact: true }).first()).toBeVisible()
  })

  test('alasan yang tidak ditandai tetap menampilkan jam sebagai angka', async ({
    page,
    request,
  }) => {
    await setConfig(request, {
      alasan: [
        { label: 'Libur Nasional', stripJam: false },
        { label: 'Sakit Gigi', stripJam: true },
      ],
    })
    await page.goto('/')

    const sel = page.getByTestId('editor-row-2026-09-23')
    await sel.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Libur Nasional' }).click()

    // Kontrol jam tetap ada, jadi tidak ada strip.
    await expect(page.getByLabel('Jam masuk Rabu 23 September 2026')).toHaveCount(1)
    await expect(sel.getByText('-', { exact: true })).toHaveCount(0)
  })

  test('toggle di Settings menyimpan stripJam dan langsung berlaku di editor', async ({
    page,
    request,
  }) => {
    await setConfig(request, {
      alasan: [
        { label: 'Libur Nasional', stripJam: false },
        { label: 'Sakit Gigi', stripJam: false },
      ],
    })
    await page.goto('/settings')

    const toggle = page.getByRole('button', { name: 'Jadikan jam strip untuk Sakit Gigi' })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await toggle.click()
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')

    const config = (await (await request.get(`${API}/api/config`)).json()) as {
      config: { alasan: { label: string; stripJam: boolean }[] }
    }
    const gigi = config.config.alasan.find((item) => item.label === 'Sakit Gigi')
    expect(gigi?.stripJam).toBe(true)

    await page.goto('/')
    const sel = page.getByTestId('editor-row-2026-09-24')
    await sel.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Sakit Gigi' }).click()
    await expect(page.getByLabel('Jam masuk Kamis 24 September 2026')).toHaveCount(0)
  })

  /*
   * Regresi untuk config milik user yang sudah tersimpan sebelum fitur ini ada.
   * Bentuk lamanya `string[]`, dan "Sakit" serta "Izin" harus tetap membuat jam strip.
   */
  test('config lama berupa string[] tetap membuat strip pada "Sakit" dan "Izin"', async ({
    page,
    request,
  }) => {
    const current = (await (await request.get(`${API}/api/config`)).json()) as {
      config: Record<string, unknown>
    }
    await request.put(`${API}/api/config`, {
      data: {
        config: {
          ...current.config,
          magang: { mulai: MULAI, selesai: SELESAI },
          // Ditulis sebagai string[] persis seperti config lama di disk.
          alasan: ['Libur Nasional', 'Izin', 'Sakit'],
        },
      },
    })

    await page.goto('/')
    const sel = page.getByTestId('editor-row-2026-09-24')
    await sel.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Sakit' }).click()
    await expect(page.getByLabel('Jam masuk Kamis 24 September 2026')).toHaveCount(0)

    // Setelah dimuat, config sudah dalam bentuk baru dan toggle-nya terlihat.
    await page.goto('/settings')
    await expect(
      page.getByRole('button', { name: 'Jadikan jam strip untuk Sakit' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.getByRole('button', { name: 'Jadikan jam strip untuk Libur Nasional' }),
    ).toHaveAttribute('aria-pressed', 'false')
  })
})
