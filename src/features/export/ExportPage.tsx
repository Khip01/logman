import { Download, FileText, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { buildMonthGroups, type MagangRange } from '@/lib/domain/calendar'
import { monthIncompleteDates } from '@/lib/domain/editor'
import { useConfigStore } from '@/stores/config'
import { useLogsStore } from '@/stores/logs'

/**
 * Halaman ekspor PDF (AGENTS.md bagian 11.3 dan 12).
 *
 * Ekspor per bulan ditolak selama masih ada hari yang belum lengkap, sesuai
 * aturan "setiap hari kosong wajib punya alasan sebelum ekspor": tombol
 * dinonaktifkan dan daftar hari belum lengkap ditampilkan per bulan. Server
 * juga menolak dengan 422 bila dipanggil langsung.
 */
export function ExportPage() {
  const config = useConfigStore((s) => s.config)
  const logs = useLogsStore((s) => s.data)
  const configLoaded = useConfigStore((s) => s.loaded)
  const logsLoaded = useLogsStore((s) => s.loaded)
  const loaded = configLoaded && logsLoaded
  const [exporting, setExporting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!loaded) {
    return (
      <div className="grid min-h-40 place-items-center">
        <Spinner />
      </div>
    )
  }

  const months = buildMonthGroups(config.magang.mulai ?? '', config.magang.selesai ?? '')
  const range: MagangRange = { mulai: config.magang.mulai, selesai: config.magang.selesai }

  if (months.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        headingLevel={1}
        title="Belum ada bulan untuk diekspor"
        description="Atur rentang magang di Pengaturan terlebih dahulu."
      />
    )
  }

  async function exportMonth(monthKey: string) {
    setExporting(monthKey)
    setError(null)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthKey }),
      })
      const body = (await response.json()) as { ok?: boolean; fileName?: string; error?: string }
      if (!response.ok || !body.ok) {
        setError(body.error ?? 'Gagal mengekspor PDF.')
        return
      }
      const link = document.createElement('a')
      link.href = `/api/export/download?file=${encodeURIComponent(body.fileName ?? '')}`
      link.download = body.fileName ?? `LogBook_${monthKey}.pdf`
      link.click()
    } catch {
      setError('Gagal menghubungi server ekspor.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-2 text-[17px] font-semibold text-text-primary">Ekspor PDF</h1>
      <p className="mb-6 text-[13px] text-text-muted">
        Unduh Log Book per bulan sebagai PDF. Nama file mengikuti pola{' '}
        <code className="font-mono text-[12px]">
          LogBook_{config.profil.nim || '<NIM>'}_Bulan-Tahun.pdf
        </code>
      </p>

      {error ? (
        <div className="mb-4 border border-status-error bg-status-error-bg px-3 py-2 text-[12px] text-status-error-text">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {months.map((month) => {
          const weekCount = month.weeks.length
          const dayCount = month.weeks.reduce(
            (sum, week) =>
              sum +
              week.days.filter(
                (d) =>
                  d.date >= (config.magang.mulai ?? '') && d.date <= (config.magang.selesai ?? ''),
              ).length,
            0,
          )
          const filledCount = month.weeks.reduce(
            (sum, week) =>
              sum +
              week.days.filter((d) => {
                const entry = logs.days[d.date]
                return entry?.kegiatan?.trim() || entry?.alasan
              }).length,
            0,
          )
          const incomplete = monthIncompleteDates(month, logs.days, range)
          const isExporting = exporting === month.key
          const blocked = incomplete.length > 0

          return (
            <div
              key={month.key}
              className="theme-t flex items-center justify-between gap-3 border border-border-base bg-bg-card px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-text-primary">{month.label}</span>
                  <Badge>{weekCount} minggu</Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-text-dim">
                  {dayCount} hari, {filledCount} terisi
                </p>
                {blocked ? (
                  <p
                    id={`export-blocked-${month.key}`}
                    className="mt-0.5 flex items-center gap-1 text-[11px] text-status-warn-text"
                  >
                    <TriangleAlert className="size-3 shrink-0" strokeWidth={1.75} />
                    {incomplete.length} hari belum lengkap
                  </p>
                ) : null}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isExporting || blocked}
                aria-describedby={blocked ? `export-blocked-${month.key}` : undefined}
                onClick={() => exportMonth(month.key)}
              >
                {isExporting ? (
                  <Spinner />
                ) : (
                  <>
                    <Download className="size-3.5" strokeWidth={1.75} />
                    Ekspor
                  </>
                )}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
