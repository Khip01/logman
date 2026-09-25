import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * Format teks pada kolom Kegiatan (AGENTS.md bagian 11.6).
 *
 * Cakupan uji:
 * - penanda tebal, miring, dan judul tidak lagi terlihat saat sel tidak difokus;
 * - saat sel difokus, teks asli dengan penandanya kembali terlihat untuk diedit;
 * - pintasan Ctrl+B dan Ctrl+I membungkus teks terpilih;
 * - tinggi sel tidak berubah saat berpindah antara mode baca dan mode edit;
 * - tanda bintang yang bermakna perkalian tidak berubah menjadi miring.
 *
 * Spec ini WAJIB hermetik: `data-e2e` dipakai bersama spec lain dan bertahan antar run.
 */

test.describe.configure({ mode: 'serial' })

const API = 'http://127.0.0.1:5198'

/** Rentang tetap supaya test tidak bergantung spec lain. */
const RENTANG = { mulai: '2026-09-21', selesai: '2026-09-26' }

const KEGIATAN =
  '# Aktivitas Harian\n' +
  'Mengerjakan **integrasi API** dengan tim.\n' +
  '## Temuan\n' +
  'Perlu *caching* di sisi klien.\n' +
  'Catatan: 2 * 3 * 4 tetap biasa.'

async function siapkan(request: APIRequestContext, tanggal: string, kegiatan: string) {
  const cfg = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: { config: { ...cfg.config, magang: RENTANG, tierAnimasi: 'penuh' } },
  })
  await request.put(`${API}/api/logs`, {
    data: {
      data: {
        version: 1,
        days: {
          [tanggal]: {
            date: tanggal,
            masuk: null,
            pulang: null,
            kegiatan,
            alasan: null,
            status: 'terisi',
          },
        },
      },
    },
  })
}

/** Mengembalikan config dan log ke keadaan netral agar spec berikutnya tidak terpengaruh. */
async function bersihkan(request: APIRequestContext) {
  const cfg = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: { config: { ...cfg.config, magang: RENTANG } },
  })
  await request.put(`${API}/api/logs`, { data: { data: { version: 1, days: {} } } })
}

test.describe('format teks kegiatan', () => {
  test.beforeEach(async ({ request }) => {
    await siapkan(request, '2026-09-21', KEGIATAN)
  })

  test.afterEach(async ({ request }) => {
    await bersihkan(request)
  })

  test('penanda disembunyikan dan formatnya tampil saat sel tidak difokus', async ({ page }) => {
    await page.goto('/')
    const sel = page.getByTestId('rich-2026-09-21')
    await expect(sel).toBeVisible()

    const baca = sel.locator('.rt-baca')
    // Penanda tidak boleh terlihat; yang tampil hanya teksnya.
    await expect(baca).not.toContainText('**')
    await expect(baca).not.toContainText('*caching*')
    await expect(baca).not.toContainText('# Aktivitas')

    // Judul dan gaya sebaris benar-benar dirender sebagai elemen.
    await expect(baca.locator('strong').first()).toHaveText('integrasi API')
    await expect(baca.locator('em').first()).toHaveText('caching')

    // Teks penanda yang bermakna perkalian TIDAK boleh berubah menjadi miring.
    await expect(baca).toContainText('2 * 3 * 4 tetap biasa')
  })

  test('sel difokus menampilkan kembali teks dengan penandanya', async ({ page }) => {
    await page.goto('/')
    const area = page.getByLabel('Kegiatan Senin 21 September 2026')

    // Mode baca: teks textarea tembus pandang, lapisan format yang tampil.
    await expect(page.getByTestId('rich-2026-09-21')).toHaveAttribute('data-aktif', 'false')

    await area.click()

    await expect(page.getByTestId('rich-2026-09-21')).toHaveAttribute('data-aktif', 'true')
    // Nilai textarea tetap teks asli berpenanda, jadi user mengedit apa adanya.
    await expect(area).toHaveValue(KEGIATAN)
  })

  test('Ctrl+B membungkus teks terpilih dengan penanda tebal', async ({ page }) => {
    await page.goto('/')
    const area = page.getByLabel('Kegiatan Senin 21 September 2026')
    await area.click()

    // Sorot kata "caching" SAJA, tanpa bintang di sekitarnya, seperti hasil klik ganda.
    await area.evaluate((el: HTMLTextAreaElement) => {
      const mulai = el.value.indexOf('caching')
      el.setSelectionRange(mulai, mulai + 'caching'.length)
    })
    await page.keyboard.press('Control+b')

    // Kata yang sudah miring menjadi tebal DAN miring, ditulis dengan tiga bintang.
    await expect(area).toHaveValue(KEGIATAN.replace('*caching*', '***caching***'))
  })

  test('Ctrl+I membungkus teks terpilih dengan penanda miring', async ({ page }) => {
    await page.goto('/')
    const area = page.getByLabel('Kegiatan Senin 21 September 2026')
    await area.click()

    // Sorot kata "tim" yang masih teks biasa.
    await area.evaluate((el: HTMLTextAreaElement) => {
      const mulai = el.value.indexOf('dengan tim')
      const mulaiKata = mulai + 'dengan '.length
      el.setSelectionRange(mulaiKata, mulaiKata + 'tim'.length)
    })
    await page.keyboard.press('Control+i')

    await expect(area).toHaveValue(KEGIATAN.replace('dengan tim', 'dengan *tim*'))
  })

  test('teks yang sudah terformat tetap berubah setelah disimpan', async ({ page, request }) => {
    await page.goto('/')
    const area = page.getByLabel('Kegiatan Senin 21 September 2026')
    await area.click()
    await area.fill('# Rencana\nKerjakan **besok** pagi.')
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    // Nilai tersimpan di server tetap teks polos berpenanda, tanpa HTML.
    const logs = (await (await request.get(`${API}/api/logs`)).json()) as {
      data: { days: Record<string, { kegiatan: string }> }
    }
    expect(logs.data.days['2026-09-21']?.kegiatan).toBe('# Rencana\nKerjakan **besok** pagi.')
  })

  /*
   * Tinggi sel tidak boleh berubah saat berpindah mode baca dan mode edit. Kalau berubah,
   * seluruh baris tabel di bawahnya ikut melompat dan terasa mengganggu saat mengedit.
   * Karena itu ukuran huruf dan tinggi baris kedua mode WAJIB sama.
   */
  test('tinggi sel tidak berubah saat berpindah mode baca dan mode edit', async ({ page }) => {
    await page.goto('/')
    const sel = page.getByTestId('rich-2026-09-21')
    const area = page.getByLabel('Kegiatan Senin 21 September 2026')
    await expect(sel).toBeVisible()

    const ukur = () => sel.evaluate((el: HTMLElement) => el.getBoundingClientRect().height)
    const modeBaca = await ukur()

    await area.click()
    await page.waitForTimeout(200)
    const modeEdit = await ukur()

    expect(Math.abs(modeEdit - modeBaca)).toBeLessThan(1)
  })
})
