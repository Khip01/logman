/**
 * Harness performa untuk pengembangan (AGENTS.md bagian 13 dan 15).
 *
 * Dua pengukuran utama:
 * 1. Jumlah render per kunci (tanggal baris editor). Satu ketikan hanya boleh
 *    me-render ulang sel yang bersangkutan, bukan tabel atau halaman.
 * 2. Long task saat user mengetik. Tidak boleh ada task di atas 50 ms.
 *
 * Semua pengukuran hanya aktif pada build DEV. Pada build produksi `bumpRender`
 * adalah no-op dan hook tidak dipasang, sehingga tidak ada overhead bagi user.
 * E2E membaca hasil lewat `window.__logmanPerf` (hanya DEV).
 */

/** Ambang long task dari AGENTS.md bagian 13. */
export const LONG_TASK_LIMIT_MS = 50

export interface LongTaskSample {
  duration: number
  startTime: number
}

const renderCounts = new Map<string, number>()
let longTaskSamples: LongTaskSample[] = []
let longTaskObserver: PerformanceObserver | null = null

/** Menandai satu render dengan kunci, misal tanggal ISO sebuah baris editor. */
export function bumpRender(key: string): void {
  if (!import.meta.env.DEV) return
  renderCounts.set(key, (renderCounts.get(key) ?? 0) + 1)
}

/** Salinan penghitung render per kunci. */
export function getRenderCounts(): Record<string, number> {
  return Object.fromEntries(renderCounts)
}

/** Mengosongkan penghitung sebelum sesi pengukuran baru. */
export function resetRenderCounts(): void {
  renderCounts.clear()
}

/** Mulai mengamati long task. Aman dipanggil berulang. */
export function startLongTaskMonitor(): void {
  if (!import.meta.env.DEV) return
  if (typeof PerformanceObserver === 'undefined' || longTaskObserver) return
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTaskSamples.push({ duration: entry.duration, startTime: entry.startTime })
      }
    })
    observer.observe({ entryTypes: ['longtask'] })
    longTaskObserver = observer
  } catch {
    longTaskObserver = null
  }
}

/** Berhenti mengamati tanpa membuang sampel yang sudah terkumpul. */
export function stopLongTaskMonitor(): void {
  longTaskObserver?.disconnect()
  longTaskObserver = null
}

/** Mengosongkan sampel long task. */
export function clearLongTaskSamples(): void {
  longTaskSamples = []
}

/** Salinan sampel long task yang sudah terkumpul. */
export function getLongTaskSamples(): LongTaskSample[] {
  return longTaskSamples.map((sample) => ({ ...sample }))
}

/** Sampel long task yang durasinya melebihi ambang bagian 13. */
export function longTasksOverLimit(
  samples: LongTaskSample[] = getLongTaskSamples(),
): LongTaskSample[] {
  return samples.filter((sample) => sample.duration > LONG_TASK_LIMIT_MS)
}

/**
 * Papar harness ke window hanya di DEV, agar e2e dan /dev/perf bisa membaca
 * pengukuran yang sama tanpa jalur API khusus.
 */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const target = window as unknown as { __logmanPerf?: unknown }
  target.__logmanPerf = {
    LONG_TASK_LIMIT_MS,
    bumpRender,
    getRenderCounts,
    resetRenderCounts,
    startLongTaskMonitor,
    stopLongTaskMonitor,
    clearLongTaskSamples,
    getLongTaskSamples,
    longTasksOverLimit,
  }
}
