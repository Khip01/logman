import { expect, type Page, test } from '@playwright/test'

const API = 'http://127.0.0.1:5198'

/**
 * Tier animasi dikembalikan ke `penuh` sebelum tiap test. data-e2e persist antar run,
 * sehingga tanpa reset test animasi bisa gagal karena tier sudah bernilai sama dengan
 * yang akan diklik (tidak ada perubahan berarti tidak ada animasi).
 */
test.beforeEach(async ({ request }) => {
  const current = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: { config: { ...current.config, tierAnimasi: 'penuh' } },
  })
})

/** Menghitung pemanggilan document.startViewTransition selama sesi halaman. */
async function installViewTransitionCounter(page: Page) {
  await page.addInitScript(() => {
    const target = window as unknown as { __vtCount?: number }
    target.__vtCount = 0
    const original = document.startViewTransition?.bind(document)
    if (original) {
      document.startViewTransition = ((
        ...args: Parameters<typeof document.startViewTransition>
      ) => {
        target.__vtCount = (target.__vtCount ?? 0) + 1
        return original(...args)
      }) as typeof document.startViewTransition
    }
  })
}

async function readViewTransitionCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __vtCount?: number }).__vtCount ?? 0)
}

test('ganti tema memakai View Transitions dan menerapkan tema baru', async ({ page, request }) => {
  // Tier mati melewati View Transitions. Paksa tier beranimasi lebih dulu, karena
  // data-e2e persist dan run sebelumnya bisa meninggalkan tier mati.
  const current = (await (await request.get('http://127.0.0.1:5198/api/config')).json()) as {
    config: Record<string, unknown>
  }
  await request.put('http://127.0.0.1:5198/api/config', {
    data: { config: { ...current.config, tierAnimasi: 'seimbang' } },
  })

  await installViewTransitionCounter(page)
  await page.goto('/settings')

  await page.getByText('Putih Bersih').click()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'putih-bersih')
  expect(await readViewTransitionCount(page)).toBeGreaterThan(0)
})

test('tier mati mengganti tema tanpa View Transitions', async ({ page }) => {
  await installViewTransitionCounter(page)
  await page.goto('/settings')

  await page.getByRole('radio', { name: 'Mati' }).click()
  const before = await readViewTransitionCount(page)

  await page.getByText('Putih Tulang').click()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'putih-tulang')
  expect(await readViewTransitionCount(page)).toBe(before)
})

test('pratinjau tier menampilkan mini window dan deskripsi tier terpilih', async ({ page }) => {
  await page.goto('/settings')

  const preview = page.getByText('Pratinjau').locator('..').locator('..')
  await expect(preview).toBeVisible()

  // Label tier di pratinjau mengikuti tier yang dipilih.
  await page.getByRole('radio', { name: 'Minimal' }).click()
  await expect(preview.getByText('Minimal')).toBeVisible()
  await expect(page.getByText('Hanya transisi opacity', { exact: false })).toBeVisible()

  await page.getByRole('radio', { name: 'Penuh' }).click()
  await expect(preview.getByText('Penuh')).toBeVisible()
  await expect(page.getByText('Semua animasi aktif', { exact: false })).toBeVisible()
})

test('tombol putar ulang pratinjau bisa ditekan', async ({ page }) => {
  await page.goto('/settings')
  const replay = page.getByRole('button', { name: 'Putar ulang' })
  await expect(replay).toBeVisible()
  await replay.click()
  await expect(replay).toBeVisible()
})

/**
 * Regresi penting: `AnimatePresence initial={false}` di Shell pernah membuat SELURUH
 * animasi masuk dilewati (lewat konteks), sehingga pratinjau tier tidak beranimasi.
 * Test ini memastikan panel pratinjau benar-benar bergerak dari keadaan tersembunyi.
 */
test('pratinjau tier benar-benar beranimasi saat tier berganti', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByTestId('tier-preview-panel')).toBeVisible()

  const samples: string[] = []
  const stop = Date.now() + 700
  let reading = true
  const record = (async () => {
    while (reading) {
      const value = await page
        .getByTestId('tier-preview-panel')
        .evaluate((el) => Number(getComputedStyle(el).opacity).toFixed(2))
        .catch(() => null)
      if (value !== null) samples.push(value)
      if (Date.now() > stop) break
    }
  })()

  await page.getByRole('radio', { name: 'Seimbang' }).click()
  await record
  reading = false

  const unique = [...new Set(samples)]
  // Animasi berarti: opacity pernah bernilai antara (bukan langsung 1).
  expect(unique.some((value) => Number(value) > 0 && Number(value) < 1)).toBe(true)
})

test('tier mati membuat pratinjau tampil seketika', async ({ page }) => {
  await page.goto('/settings')
  await page.getByRole('radio', { name: 'Mati' }).click()
  await page.waitForTimeout(120)

  const samples: string[] = []
  const stop = Date.now() + 400
  while (Date.now() < stop) {
    const value = await page
      .getByTestId('tier-preview-panel')
      .evaluate((el) => Number(getComputedStyle(el).opacity).toFixed(2))
    samples.push(value)
  }

  const unique = [...new Set(samples)]
  // Tier mati: tidak ada nilai antara, langsung 1.00.
  expect(unique).toEqual(['1.00'])
})
