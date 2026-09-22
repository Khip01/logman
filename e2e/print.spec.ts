import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * E2E preview cetak dokumen di browser (AGENTS.md bagian 12).
 *
 * Preview di browser adalah dokumen itu sendiri: kop, judul, identitas, dan blok
 * tanda tangan memakai kelas print-only; chrome aplikasi memakai no-print.
 * Ukuran kertas ditulis runtime lewat tag style #logman-page-style.
 */

test.describe.configure({ mode: 'serial' })

const API = 'http://127.0.0.1:5198'

async function setConfig(request: APIRequestContext, patch: Record<string, unknown>) {
  const current = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: { config: { ...current.config, ...patch } },
  })
}

test.describe('preview cetak dokumen', () => {
  test.beforeEach(async ({ request }) => {
    await setConfig(request, {
      magang: { mulai: '2026-09-01', selesai: '2026-09-30' },
      ukuranKertas: 'A4',
      dosenPembimbing: '',
      pembimbingLapangan: [],
      pembimbingLapanganDefault: null,
    })
  })

  test('tag style @page mengikuti ukuran kertas dari config', async ({ page, request }) => {
    const pageCss = () =>
      page.evaluate(() => document.getElementById('logman-page-style')?.textContent ?? '')

    await setConfig(request, { ukuranKertas: 'F4' })
    await page.goto('/')
    await expect.poll(pageCss).toContain('215mm 330mm')
    await expect.poll(pageCss).toContain('margin: 2.54cm')

    await setConfig(request, { ukuranKertas: 'A4' })
    await page.reload()
    await expect.poll(pageCss).toContain('size: A4')
  })

  test('kop dokumen tersembunyi di layar dan tampil beserta chrome disembunyikan di mode cetak', async ({
    page,
  }) => {
    const headingLayar = page.getByRole('heading', { name: 'Log Book', level: 1, exact: true })

    await page.goto('/')
    await expect(page.getByTestId('print-letterhead')).toBeHidden()
    await expect(page.getByTestId('print-heading')).toBeHidden()
    await expect(headingLayar).toBeVisible()
    await expect(page.getByTestId('sidebar-rail')).toBeVisible()

    await page.emulateMedia({ media: 'print' })
    await expect(page.getByTestId('print-letterhead')).toBeVisible()
    await expect(page.getByTestId('print-heading')).toContainText('LOG BOOK MAGANG')
    await expect(page.getByTestId('print-heading')).toContainText('Minggu')
    await expect(headingLayar).toBeHidden()
    await expect(page.getByTestId('sidebar-rail')).toBeHidden()
  })

  test('identitas tampil di minggu pertama dan tanda tangan di minggu terakhir', async ({
    page,
  }) => {
    await page.goto('/')

    // Minggu pertama M1: identitas tampil, tanda tangan belum.
    await page.getByRole('tab').first().click()
    await page.emulateMedia({ media: 'print' })
    await expect(page.getByTestId('print-identity')).toBeVisible()
    await expect(page.getByTestId('print-signature')).toBeHidden()

    // Minggu terakhir M5 (28 Sep - 3 Okt): tanda tangan tampil, identitas tidak.
    await page.emulateMedia({ media: 'screen' })
    await page.getByRole('tab').last().click()
    await page.emulateMedia({ media: 'print' })
    await expect(page.getByTestId('print-signature')).toBeVisible()
    await expect(page.getByTestId('print-identity')).toBeHidden()
  })

  test('nama penanda tangan minggu terakhir muncul di blok tanda tangan', async ({
    page,
    request,
  }) => {
    await setConfig(request, {
      dosenPembimbing: 'Dr. Budi Santoso',
      pembimbingLapangan: ['Siti Aminah'],
      pembimbingLapanganDefault: 'Siti Aminah',
    })
    await page.goto('/')
    await page.getByRole('tab').last().click()

    const signature = page.getByTestId('print-signature')
    await expect(signature).toContainText('(Dr. Budi Santoso)')
    await expect(signature).toContainText('(Siti Aminah)')
  })

  test('nama penanda tangan bisa disesuaikan per minggu dari Log Book', async ({
    page,
    request,
  }) => {
    await setConfig(request, {
      pembimbingLapangan: ['Siti Aminah', 'Andi Wijaya'],
      pembimbingLapanganDefault: 'Siti Aminah',
    })
    await page.goto('/')
    await page.getByRole('tab').last().click()

    const pembimbing = page.getByLabel('Pembimbing Lapangan')
    await pembimbing.fill('Andi Wijaya')
    await pembimbing.press('Enter')
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    await expect(page.getByTestId('print-signature')).toContainText('(Andi Wijaya)')

    // Pilihan tersimpan di logs.json per minggu.
    const logs = (await (await request.get(`${API}/api/logs`)).json()) as {
      data: { namaPenandaTangan: Record<string, { pembimbing?: string }> }
    }
    const values = Object.values(logs.data.namaPenandaTangan)
    expect(values.some((entry) => entry.pembimbing === 'Andi Wijaya')).toBe(true)
  })
})
