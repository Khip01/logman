import { type APIRequestContext, expect, test } from '@playwright/test'

/**
 * Perf gate (AGENTS.md bagian 13 dan 14.3).
 *
 * Dua pemeriksaan dijalankan terhadap build DEV lewat harness yang sama dengan
 * /dev/perf (`window.__logmanPerf`):
 * 1. Saat user mengetik cepat di editor, tidak boleh ada long task di atas 50 ms.
 * 2. Satu ketikan hanya me-render ulang baris tanggal itu, bukan baris lain.
 */

test.describe.configure({ mode: 'serial' })

const API = 'http://127.0.0.1:5198'

interface PerfBridge {
  __logmanPerf?: {
    startLongTaskMonitor: () => void
    stopLongTaskMonitor: () => void
    clearLongTaskSamples: () => void
    getLongTaskSamples: () => { duration: number; startTime: number }[]
    getRenderCounts: () => Record<string, number>
    resetRenderCounts: () => void
  }
}

async function setConfig(request: APIRequestContext, patch: Record<string, unknown>) {
  const current = (await (await request.get(`${API}/api/config`)).json()) as {
    config: Record<string, unknown>
  }
  await request.put(`${API}/api/config`, {
    data: { config: { ...current.config, ...patch } },
  })
}

async function clearLogs(request: APIRequestContext) {
  await request.put(`${API}/api/logs`, { data: { data: { version: 1, days: {} } } })
}

test.describe('perf gate', () => {
  test.beforeEach(async ({ request }) => {
    await setConfig(request, {
      magang: { mulai: '2026-09-21', selesai: '2026-09-26' },
      folderExport: '',
    })
    await clearLogs(request)
  })

  test('mengetik cepat tidak memicu long task di atas 50 ms', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('editor-row-2026-09-21')).toBeVisible()
    // Tunggu bootstrap selesai supaya monitor tidak menangkap pekerjaan load,
    // lalu hangatkan modul editor dengan ketikan awal (Vite cold start di CI).
    await expect(page.getByTestId('save-status')).toBeVisible()
    await page.waitForTimeout(300)

    const keg = page.getByLabel('Kegiatan Senin 21 September 2026')
    await keg.click()
    await keg.type('panas', { delay: 16 })
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    await page.evaluate(() => {
      const perf = window as PerfBridge
      perf.__logmanPerf?.clearLongTaskSamples()
      perf.__logmanPerf?.startLongTaskMonitor()
    })

    // Delay 16 ms meniru ketikan manusia. Delay 0 menumpuk puluhan update React
    // dalam satu task dan tidak representatif terhadap perilaku user.
    await keg.type('ABCDEFGHIJKLMNOPQRSTUVWXYZ012345', { delay: 16 })
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    const tasks = await page.evaluate(() => {
      const perf = window as PerfBridge
      perf.__logmanPerf?.stopLongTaskMonitor()
      return perf.__logmanPerf?.getLongTaskSamples() ?? []
    })

    const over = tasks.filter((task) => task.duration > 50)
    expect(over, `long task di atas 50 ms: ${JSON.stringify(over)}`).toEqual([])
  })

  test('satu ketikan hanya me-render baris tanggal terkait', async ({ page }) => {
    await page.goto('/')
    for (const date of [
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
    ]) {
      await expect(page.getByTestId(`editor-row-${date}`)).toBeVisible()
    }
    await expect(page.getByTestId('save-status')).toBeVisible()
    await page.waitForTimeout(300)

    await page.evaluate(() => {
      const perf = window as PerfBridge
      perf.__logmanPerf?.resetRenderCounts()
    })

    const target = page.getByLabel('Kegiatan Kamis 24 September 2026')
    await target.click()
    await target.type('Cek render', { delay: 16 })
    await expect(page.getByTestId('save-status')).toHaveText('Tersimpan', { timeout: 10_000 })

    const result = await page.evaluate(() => {
      const perf = window as PerfBridge
      const counts = perf.__logmanPerf?.getRenderCounts() ?? {}
      const rows = Array.from(document.querySelectorAll('[data-testid^="editor-row-"]')).map((el) =>
        (el.getAttribute('data-testid') ?? '').replace('editor-row-', ''),
      )
      return { counts, rows }
    })

    expect(result.rows).toHaveLength(6)
    expect(result.counts['2026-09-24']).toBeGreaterThan(0)
    for (const date of result.rows) {
      if (date === '2026-09-24') continue
      expect(result.counts[date] ?? 0, `baris ${date} ikut ter-render`).toBe(0)
    }
  })
})
