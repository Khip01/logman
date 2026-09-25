import { Activity, Gauge, Layers, RotateCcw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useT } from '@/lib/i18n'
import { LONG_TASK_LIMIT_MS, type LongTaskSample, longTasksOverLimit } from '@/lib/utils/perf'

interface BundleStats {
  generatedAt: string
  initialGzip: number
  initialRaw: number
  budgetBytes: number
  warnBytes: number
  lazyChunkCount: number
  lazyGzip: number
  ok: boolean
}

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

/**
 * Dashboard performa untuk agen (AGENTS.md bagian 15): ukuran bundle, jumlah
 * render, dan long task dalam satu tampilan, supaya progres terlihat tanpa
 * membuka CI. Pengukuran render dan long task memakai harness yang sama dengan
 * e2e (`src/lib/utils/perf.ts`) dan hanya berfungsi pada build DEV.
 */
export function DevPerfPage() {
  const t = useT()
  const [bundle, setBundle] = useState<BundleStats | null>(null)
  const [bundleError, setBundleError] = useState<string | null>(null)
  const [renders, setRenders] = useState<Record<string, number>>({})
  const [longTasks, setLongTasks] = useState<LongTaskSample[]>([])
  const [monitoring, setMonitoring] = useState(true)

  const refreshRenders = useCallback(() => {
    const perf = window as unknown as {
      __logmanPerf?: { getRenderCounts: () => Record<string, number> }
    }
    setRenders(perf.__logmanPerf?.getRenderCounts() ?? {})
  }, [])

  const refreshLongTasks = useCallback(() => {
    const perf = window as unknown as {
      __logmanPerf?: { getLongTaskSamples: () => LongTaskSample[] }
    }
    setLongTasks(perf.__logmanPerf?.getLongTaskSamples() ?? [])
  }, [])

  useEffect(() => {
    const perf = window as unknown as {
      __logmanPerf?: {
        startLongTaskMonitor: () => void
        stopLongTaskMonitor: () => void
        clearLongTaskSamples: () => void
        getLongTaskSamples: () => LongTaskSample[]
        getRenderCounts: () => Record<string, number>
      }
    }
    if (perf.__logmanPerf) {
      perf.__logmanPerf.startLongTaskMonitor()
      setLongTasks(perf.__logmanPerf.getLongTaskSamples())
      setRenders(perf.__logmanPerf.getRenderCounts())
    }

    let cancelled = false
    fetch('/bundle-stats.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<BundleStats>
      })
      .then((stats) => {
        if (!cancelled) setBundle(stats)
      })
      .catch(() => {
        if (!cancelled) setBundleError(t('dev.perf.belumAdaBundle'))
      })
    return () => {
      cancelled = true
      perf.__logmanPerf?.stopLongTaskMonitor()
    }
  }, [t])

  function resetRenders() {
    const perf = window as unknown as {
      __logmanPerf?: {
        resetRenderCounts: () => void
        getRenderCounts: () => Record<string, number>
      }
    }
    perf.__logmanPerf?.resetRenderCounts()
    refreshRenders()
  }

  function clearLongTasks() {
    const perf = window as unknown as {
      __logmanPerf?: {
        clearLongTaskSamples: () => void
        getLongTaskSamples: () => LongTaskSample[]
      }
    }
    perf.__logmanPerf?.clearLongTaskSamples()
    refreshLongTasks()
  }

  function toggleMonitor() {
    const perf = window as unknown as {
      __logmanPerf?: { startLongTaskMonitor: () => void; stopLongTaskMonitor: () => void }
    }
    if (monitoring) perf.__logmanPerf?.stopLongTaskMonitor()
    else perf.__logmanPerf?.startLongTaskMonitor()
    setMonitoring(!monitoring)
  }

  const overLimit = longTasksOverLimit(longTasks)
  const renderEntries = Object.entries(renders).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Gauge className="size-5 text-text-muted" strokeWidth={1.75} />
        <h1 className="text-[17px] font-semibold text-text-primary">Performa</h1>
      </div>
      <p className="mb-8 text-[13px] text-text-muted">
        Angka yang sama dengan gate CI: ukuran bundle, jumlah render per sel editor, dan long task
        saat mengetik (AGENTS.md bagian 13).
      </p>

      <section
        data-testid="perf-bundle"
        className="theme-t mb-6 border border-border-base bg-bg-card px-4 py-3"
      >
        <div className="mb-2 flex items-center gap-2">
          <Layers className="size-4 text-text-muted" strokeWidth={1.75} />
          <h2 className="text-[13px] font-semibold text-text-primary">Bundle (JS awal)</h2>
        </div>
        {bundle ? (
          <div className="space-y-1 text-[12px] text-text-main">
            <p>
              {formatKb(bundle.initialGzip)} gzip dari anggaran {formatKb(bundle.budgetBytes)}
              {bundle.initialGzip > bundle.warnBytes ? (
                <span className="text-status-warn-text"> (mendekati batas peringatan)</span>
              ) : (
                <span className="text-status-ok-text"> (di bawah anggaran)</span>
              )}
            </p>
            <p className="text-text-dim">
              Raw {formatKb(bundle.initialRaw)}; chunk lazy {bundle.lazyChunkCount} file (
              {formatKb(bundle.lazyGzip)} gzip) tidak dihitung.
            </p>
            <p className="text-text-dim">Dibangun {bundle.generatedAt}</p>
          </div>
        ) : (
          <p className="text-[12px] text-text-dim">{bundleError ?? 'Memuat stats bundle...'}</p>
        )}
      </section>

      <section
        data-testid="perf-renders"
        className="theme-t mb-6 border border-border-base bg-bg-card px-4 py-3"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-text-muted" strokeWidth={1.75} />
            <h2 className="text-[13px] font-semibold text-text-primary">Jumlah render editor</h2>
          </div>
          <Button variant="outline" size="sm" onClick={resetRenders}>
            <RotateCcw className="size-3.5" strokeWidth={1.75} />
            Reset
          </Button>
        </div>
        <p className="mb-2 text-[12px] text-text-dim">
          Reset, lalu ketik di halaman Log Book. Hanya tanggal yang Anda ketik yang boleh bertambah.
        </p>
        {renderEntries.length === 0 ? (
          <p className="text-[12px] text-text-muted">Belum ada render tercatat (build DEV saja).</p>
        ) : (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {renderEntries.map(([date, count]) => (
              <li
                key={date}
                className="border border-border-base px-2 py-1 font-mono text-[11px] text-text-main"
              >
                {date}: {count}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        data-testid="perf-longtasks"
        className="theme-t border border-border-base bg-bg-card px-4 py-3"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="size-4 text-text-muted" strokeWidth={1.75} />
            <h2 className="text-[13px] font-semibold text-text-primary">
              Long task (batas {LONG_TASK_LIMIT_MS} ms)
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleMonitor}>
              {monitoring ? t('dev.perf.hentikanMonitor') : t('dev.perf.mulaiMonitor')}{' '}
              {t('dev.perf.monitor')}
            </Button>
            <Button variant="outline" size="sm" onClick={clearLongTasks}>
              <Trash2 className="size-3.5" strokeWidth={1.75} />
              Bersihkan
            </Button>
          </div>
        </div>
        <p className="mb-2 text-[12px] text-text-dim">
          Monitor aktif sejak halaman dibuka. Ketik cepat di Log Book lalu kembali ke sini dan tekan
          Muat ulang dengan me-refresh halaman.
        </p>
        <Button variant="ghost" size="sm" onClick={refreshLongTasks}>
          Muat ulang sampel
        </Button>
        <Button variant="ghost" size="sm" onClick={refreshRenders}>
          Muat ulang render
        </Button>
        {longTasks.length === 0 ? (
          <p className="mt-2 text-[12px] text-status-ok-text">
            Tidak ada long task tercatat selama monitor aktif.
          </p>
        ) : (
          <ul className="mt-2 m-0 flex list-none flex-wrap gap-2 p-0">
            {longTasks.map((sample) => (
              <li
                key={`${sample.startTime}-${sample.duration}`}
                className={
                  sample.duration > LONG_TASK_LIMIT_MS
                    ? 'border border-status-error px-2 py-1 font-mono text-[11px] text-status-error-text'
                    : 'border border-border-base px-2 py-1 font-mono text-[11px] text-text-main'
                }
              >
                {Math.round(sample.duration)} ms
              </li>
            ))}
          </ul>
        )}
        {overLimit.length > 0 ? (
          <p className="mt-2 text-[12px] text-status-error-text" data-testid="perf-over-limit">
            {overLimit.length} long task melebihi {LONG_TASK_LIMIT_MS} ms.
          </p>
        ) : null}
      </section>
    </div>
  )
}
