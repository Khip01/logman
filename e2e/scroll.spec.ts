import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * Ingatan posisi scroll per halaman (AGENTS.md bagian 11.4).
 *
 * Kontainer scroll aplikasi (`[data-testid="app-main"]`) tidak pernah diganti saat
 * berpindah halaman, jadi tanpa pengelolaan posisi halaman lama terbawa ke halaman baru.
 * Test ini memastikan tiap halaman punya posisinya sendiri dan halaman baru mulai dari atas.
 */

const API = 'http://127.0.0.1:5198'

async function setConfig(request: APIRequestContext, patch: Record<string, unknown>) {
  const current = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: { config: { ...current.config, ...patch } },
  })
}

test.describe('ingatan posisi scroll', () => {
  test.beforeEach(async ({ request }) => {
    // Rentang panjang agar halaman Log Book dan Pengaturan sama-sama dapat digulir,
    // dan tier dikunci supaya perpindahan halaman deterministik.
    await setConfig(request, {
      magang: { mulai: '2026-06-29', selesai: '2026-12-31' },
      tierAnimasi: 'penuh',
      contentScale: 1,
      tampilkanDevUi: false,
    })
  })

  test('tiap halaman mengingat posisinya sendiri, halaman baru mulai dari atas', async ({
    page,
  }) => {
    const app = () => page.getByTestId('app-main')
    const posisi = () => app().evaluate((el) => Math.round(el.scrollTop))

    // 1) Kunjungan pertama Log Book: mulai dari atas.
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Log Book' })).toBeVisible()
    expect(await posisi()).toBe(0)

    // 2) Pengaturan: gulir ke bawah.
    await page.getByRole('button', { name: 'Pengaturan' }).first().click()
    await expect(page.getByRole('heading', { name: 'Pengaturan' })).toBeVisible()
    await app().evaluate((el) => {
      el.scrollTop = 900
    })
    await expect.poll(posisi).toBeGreaterThan(500)
    const posisiSettings = await posisi()

    // 3) Halaman yang belum pernah dibuka (Ekspor) mulai dari atas, tidak mewarisi
    //    posisi Pengaturan.
    await page.getByRole('button', { name: 'Ekspor' }).first().click()
    await expect(page.getByRole('heading', { name: 'Ekspor PDF' })).toBeVisible()
    expect(await posisi()).toBe(0)

    // 4) Kembali ke Pengaturan: posisi lama pulih.
    await page.getByRole('button', { name: 'Pengaturan' }).first().click()
    await expect(page.getByRole('heading', { name: 'Pengaturan' })).toBeVisible()
    await expect.poll(posisi).toBeGreaterThan(500)
    expect(Math.abs((await posisi()) - posisiSettings)).toBeLessThanOrEqual(2)

    // 5) Kembali ke Log Book: tetap di atas, bukan ikut posisi Pengaturan.
    await page.getByRole('button', { name: 'Log Book' }).first().click()
    await expect(page.getByRole('heading', { name: 'Log Book' })).toBeVisible()
    expect(await posisi()).toBe(0)
  })

  test('refresh mengembalikan posisi ke atas karena ingatan hanya selama sesi', async ({
    page,
  }) => {
    const app = () => page.getByTestId('app-main')

    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Pengaturan' })).toBeVisible()
    await app().evaluate((el) => {
      el.scrollTop = 800
    })
    await expect.poll(() => app().evaluate((el) => Math.round(el.scrollTop))).toBeGreaterThan(500)

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Pengaturan' })).toBeVisible()
    expect(await app().evaluate((el) => Math.round(el.scrollTop))).toBe(0)
  })
})
