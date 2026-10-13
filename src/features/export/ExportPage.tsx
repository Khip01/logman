import { ChevronRight, Download, FileText, TriangleAlert } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import {
  buildMonthGroups,
  editableWeekDates,
  formatWeekRange,
  type MagangRange,
} from '@/lib/domain/calendar'
import { isDayFilled, monthIncompleteDates } from '@/lib/domain/editor'
import { useLocale, useT } from '@/lib/i18n'
import { popTransition } from '@/motion/presets'
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
  const t = useT()
  const locale = useLocale()
  const config = useConfigStore((s) => s.config)
  const logs = useLogsStore((s) => s.data)
  const configLoaded = useConfigStore((s) => s.loaded)
  const logsLoaded = useLogsStore((s) => s.loaded)
  const loaded = configLoaded && logsLoaded
  const [exporting, setExporting] = useState<string | null>(null)
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  if (!loaded) {
    return (
      <div className="grid min-h-40 place-items-center">
        <Spinner />
      </div>
    )
  }

  const months = buildMonthGroups(
    config.magang.mulai ?? '',
    config.magang.selesai ?? '',
    locale,
    config.hariKerja,
  )
  const range: MagangRange = { mulai: config.magang.mulai, selesai: config.magang.selesai }

  if (months.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        headingLevel={1}
        title={t('ekspor.belumAdaBulan')}
        description={t('ekspor.belumAdaBulanDeskripsi')}
      />
    )
  }

  async function exportWeek(monthKey: string, weekId: string) {
    setExporting(`${monthKey}:${weekId}`)
    setError(null)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthKey, weekId }),
      })
      const body = (await response.json()) as { ok?: boolean; fileName?: string; error?: string }
      if (!response.ok || !body.ok) {
        setError(body.error ?? t('ekspor.gagalEkspor'))
        return
      }
      const link = document.createElement('a')
      link.href = `/api/export/download?file=${encodeURIComponent(body.fileName ?? '')}`
      link.download = body.fileName ?? `LogBook_${monthKey}.pdf`
      link.click()
    } catch {
      setError(t('ekspor.gagalServer'))
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-2 text-[17px] font-semibold text-text-primary">{t('ekspor.judul')}</h1>
      <p className="mb-6 text-[13px] text-text-muted">
        {t('ekspor.deskripsi', {
          pola: `LogBook_${config.profil.nim || '<NIM>'}_Bulan-Tahun.pdf`,
        })}
      </p>

      {error ? (
        <div className="mb-4 border border-status-error bg-status-error-bg px-3 py-2 text-[12px] text-status-error-text">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {months.map((month) => {
          /*
           * Hari dan hari terisi dihitung dari hari yang BENAR-BENAR milik bulan ini dan
           * di dalam rentang, memakai predikat yang sama dengan editor. Sebelumnya `dayCount`
           * hanya menyaring rentang tanpa menyaring bulan, dan `filledCount` tidak menyaring
           * apa pun, sehingga minggu lintas bulan ikut terhitung dua kali dan hari di luar
           * rentang ikut masuk.
           */
          const tanggalBulanIni = month.weeks.flatMap((week) =>
            editableWeekDates(week, month.key, range),
          )
          const dayCount = tanggalBulanIni.length
          const filledCount = tanggalBulanIni.filter((date) => isDayFilled(logs.days[date])).length
          const incomplete = monthIncompleteDates(month, logs.days, range)
          const isOpen = openMonths[month.key] ?? false

          return (
            <div key={month.key} className="theme-t border border-border-base bg-bg-card">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-bg-card-hover"
                aria-expanded={isOpen}
                onClick={() => setOpenMonths((current) => ({ ...current, [month.key]: !isOpen }))}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <m.span animate={{ rotate: isOpen ? 90 : 0 }} transition={popTransition}>
                    <ChevronRight className="size-3.5" strokeWidth={1.75} />
                  </m.span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-text-primary">
                        {month.label}
                      </span>
                      <Badge>{t('ekspor.minggu', { n: month.weeks.length })}</Badge>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-text-dim">
                      {t('ekspor.hariTerisi', { hari: dayCount, terisi: filledCount })}
                    </span>
                    {incomplete.length > 0 ? (
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-status-warn-text">
                        <TriangleAlert className="size-3 shrink-0" strokeWidth={1.75} />
                        {t('ekspor.belumLengkap', { n: incomplete.length })}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <m.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={popTransition}
                    className="overflow-hidden border-t border-border-light"
                  >
                    <div className="flex flex-col gap-2 px-4 py-3">
                      {month.weeks.map((week) => {
                        const weekDates = editableWeekDates(week, month.key, range)
                        const weekIncomplete = monthIncompleteDates(
                          { ...month, weeks: [week] },
                          logs.days,
                          range,
                        )
                        const exportKey = `${month.key}:${week.id}`
                        const isExporting = exporting === exportKey
                        const blocked = weekIncomplete.length > 0
                        return (
                          <div
                            key={week.id}
                            className="flex items-center justify-between gap-3 border border-border-light px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-[12px] font-medium text-text-primary">
                                {t('ekspor.mingguKe', { n: week.weekOfMonth })}
                              </p>
                              <p className="text-[11px] text-text-dim">
                                {formatWeekRange(week.startDate, locale)} ·{' '}
                                {t('ekspor.hariTerisi', {
                                  hari: weekDates.length,
                                  terisi: weekDates.filter((date) => isDayFilled(logs.days[date]))
                                    .length,
                                })}
                              </p>
                              {blocked ? (
                                <p className="mt-0.5 text-[11px] text-status-warn-text">
                                  {t('ekspor.belumLengkap', { n: weekIncomplete.length })}
                                </p>
                              ) : null}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isExporting || blocked}
                              onClick={() => exportWeek(month.key, week.id)}
                            >
                              {isExporting ? (
                                <Spinner />
                              ) : (
                                <>
                                  <Download className="size-3.5" strokeWidth={1.75} />
                                  {t('ekspor.ekspor')}
                                </>
                              )}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </m.div>
                ) : null}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
