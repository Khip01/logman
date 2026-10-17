import { ChevronRight, Download, FileText, RefreshCw, TriangleAlert, X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import {
  buildMonthGroups,
  editableWeekDates,
  formatWeekRange,
  type MagangRange,
} from '@/lib/domain/calendar'
import { formatTanggalId } from '@/lib/domain/date'
import { isDayFilled, monthIncompleteDates } from '@/lib/domain/editor'
import { useLocale, useT } from '@/lib/i18n'
import { getRepositories } from '@/lib/repo'
import { popTransition } from '@/motion/presets'
import { MOTION_TIER_PROFILE } from '@/motion/tiers'
import { useConfigStore } from '@/stores/config'
import { useLogsStore } from '@/stores/logs'
import { useUiStore } from '@/stores/ui'

interface PreviewTab {
  monthKey: string
  weekId: string
  fingerprint: string
}

const PREVIEW_TABS_KEY = 'logman.export.preview-tabs'
const PREVIEW_ACTIVE_KEY = 'logman.export.preview-active'
const PREVIEW_WIDTH_MODE_KEY = 'logman.export.preview-width-mode'
const PREVIEW_WIDTH_MODES = ['third', 'two-thirds', 'full'] as const
type PreviewWidthMode = (typeof PREVIEW_WIDTH_MODES)[number]

function readStoredPreviewWidthMode(): PreviewWidthMode {
  try {
    const value = localStorage.getItem(PREVIEW_WIDTH_MODE_KEY)
    return PREVIEW_WIDTH_MODES.includes(value as PreviewWidthMode)
      ? (value as PreviewWidthMode)
      : 'two-thirds'
  } catch {
    return 'two-thirds'
  }
}

function tabKey(monthKey: string, weekId: string) {
  return `${monthKey}:${weekId}`
}

function readStoredTabs(): PreviewTab[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREVIEW_TABS_KEY) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is PreviewTab =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.monthKey === 'string' &&
        typeof item.weekId === 'string' &&
        typeof item.fingerprint === 'string',
    )
  } catch {
    return []
  }
}

function fingerprintFor(
  monthKey: string,
  weekId: string,
  config: unknown,
  logs: { days: unknown; namaPenandaTangan: unknown },
): string {
  return JSON.stringify({
    monthKey,
    weekId,
    config,
    days: logs.days,
    names: logs.namaPenandaTangan,
  })
}

export function ExportPage() {
  const t = useT()
  const locale = useLocale()
  const motionTier = useUiStore((s) => s.motion)
  const config = useConfigStore((s) => s.config)
  const logs = useLogsStore((s) => s.data)
  const configLoaded = useConfigStore((s) => s.loaded)
  const logsLoaded = useLogsStore((s) => s.loaded)
  const loaded = configLoaded && logsLoaded
  const [exporting, setExporting] = useState<string | null>(null)
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({})
  const [tabs, setTabs] = useState<PreviewTab[]>(() => readStoredTabs())
  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(PREVIEW_ACTIVE_KEY)
    } catch {
      return null
    }
  })
  const [panelOpen, setPanelOpen] = useState(() => tabs.length > 0)
  const [previewWidthMode, setPreviewWidthMode] = useState<PreviewWidthMode>(() =>
    readStoredPreviewWidthMode(),
  )
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [pendingExport, setPendingExport] = useState<{
    monthKey: string
    weekId: string
    incomplete: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scrollRequest, setScrollRequest] = useState(0)
  const weekRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const months = useMemo(
    () =>
      loaded
        ? buildMonthGroups(
            config.magang.mulai ?? '',
            config.magang.selesai ?? '',
            locale,
            config.hariKerja,
          )
        : [],
    [config.hariKerja, config.magang.mulai, config.magang.selesai, loaded, locale],
  )
  const range: MagangRange = { mulai: config.magang.mulai, selesai: config.magang.selesai }

  function currentFingerprint(monthKey: string, weekId: string) {
    return fingerprintFor(monthKey, weekId, config, logs)
  }

  const loadPreview = useCallback(
    async (monthKey: string, weekId: string) => {
      const id = tabKey(monthKey, weekId)
      setLoadingPreview(id)
      setError(null)
      try {
        const blob = await getRepositories().export.preview(monthKey, weekId)
        const url = URL.createObjectURL(blob)
        setPreviewUrls((current) => {
          if (current[id]) URL.revokeObjectURL(current[id])
          return { ...current, [id]: url }
        })
        setTabs((current) =>
          current.map((tab) =>
            tabKey(tab.monthKey, tab.weekId) === id
              ? { ...tab, fingerprint: fingerprintFor(monthKey, weekId, config, logs) }
              : tab,
          ),
        )
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t('ekspor.gagalServer'))
      } finally {
        setLoadingPreview(null)
      }
    },
    [config, logs, t],
  )

  useEffect(() => {
    try {
      localStorage.setItem(PREVIEW_TABS_KEY, JSON.stringify(tabs))
      if (activeTabId) localStorage.setItem(PREVIEW_ACTIVE_KEY, activeTabId)
      else localStorage.removeItem(PREVIEW_ACTIVE_KEY)
    } catch {
      // Preview tetap berfungsi bila storage browser tidak tersedia.
    }
  }, [activeTabId, tabs])

  useEffect(() => {
    try {
      localStorage.setItem(PREVIEW_WIDTH_MODE_KEY, previewWidthMode)
    } catch {
      // Preview tetap bisa dipakai bila storage browser tidak tersedia.
    }
  }, [previewWidthMode])

  const previewUrlsRef = useRef(previewUrls)

  // Memuat ulang tab tersimpan yang belum memiliki object URL pada sesi browser ini.
  useEffect(() => {
    previewUrlsRef.current = previewUrls
  }, [previewUrls])

  useEffect(() => {
    return () => {
      for (const url of Object.values(previewUrlsRef.current)) URL.revokeObjectURL(url)
    }
  }, [])

  useEffect(() => {
    if (!activeTabId || !tabs.some((tab) => tabKey(tab.monthKey, tab.weekId) === activeTabId)) {
      setActiveTabId(tabs[0] ? tabKey(tabs[0].monthKey, tabs[0].weekId) : null)
    }
  }, [activeTabId, tabs])

  useEffect(() => {
    if (!panelOpen || !activeTabId || previewUrls[activeTabId] || loadingPreview === activeTabId)
      return
    const tab = tabs.find((item) => tabKey(item.monthKey, item.weekId) === activeTabId)
    if (tab) void loadPreview(tab.monthKey, tab.weekId)
  }, [activeTabId, loadPreview, loadingPreview, panelOpen, previewUrls, tabs])

  useEffect(() => {
    if (!activeTabId || !panelOpen) return
    void scrollRequest
    const behavior = MOTION_TIER_PROFILE[motionTier].duration === 0 ? 'auto' : 'smooth'
    const timer = window.setTimeout(() => {
      weekRefs.current[activeTabId]?.scrollIntoView({ behavior, block: 'center' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [activeTabId, motionTier, panelOpen, scrollRequest])

  if (!loaded) {
    return (
      <div className="grid min-h-40 place-items-center">
        <Spinner />
      </div>
    )
  }

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

  async function exportWeek(monthKey: string, weekId: string, confirmPartial = false) {
    setExporting(`${monthKey}:${weekId}`)
    setError(null)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthKey, weekId, confirmPartial }),
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

  function requestWeekExport(monthKey: string, weekId: string, incomplete: string[]) {
    if (incomplete.length > 0) {
      setPendingExport({ monthKey, weekId, incomplete })
      return
    }
    void exportWeek(monthKey, weekId)
  }

  function openPreview(monthKey: string, weekId: string) {
    const id = tabKey(monthKey, weekId)
    const existing = tabs.find((tab) => tabKey(tab.monthKey, tab.weekId) === id)
    const next = existing
      ? tabs
      : [...tabs, { monthKey, weekId, fingerprint: currentFingerprint(monthKey, weekId) }]
    setTabs(next)
    setActiveTabId(id)
    setPanelOpen(true)
    setOpenMonths((current) => ({ ...current, [monthKey]: true }))
    setScrollRequest((current) => current + 1)
    if (!previewUrls[id] || existing?.fingerprint !== currentFingerprint(monthKey, weekId)) {
      void loadPreview(monthKey, weekId)
    }
  }

  function closeTab(id: string) {
    setTabs((current) => current.filter((tab) => tabKey(tab.monthKey, tab.weekId) !== id))
    setPreviewUrls((current) => {
      if (current[id]) URL.revokeObjectURL(current[id])
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  function selectPreviewTab(monthKey: string, weekId: string) {
    const id = tabKey(monthKey, weekId)
    setActiveTabId(id)
    setOpenMonths((current) => ({ ...current, [monthKey]: true }))
    setScrollRequest((current) => current + 1)
  }

  const activeTab = tabs.find((tab) => tabKey(tab.monthKey, tab.weekId) === activeTabId)
  const activeMonth = activeTab
    ? months.find((month) => month.key === activeTab.monthKey)
    : undefined
  const activeWeek = activeMonth?.weeks.find((week) => week.id === activeTab?.weekId)
  const activeOutdated = Boolean(
    activeTab && activeTab.fingerprint !== currentFingerprint(activeTab.monthKey, activeTab.weekId),
  )
  const activeUrl = activeTabId ? previewUrls[activeTabId] : undefined
  const activeIncomplete =
    activeMonth && activeWeek
      ? monthIncompleteDates({ ...activeMonth, weeks: [activeWeek] }, logs.days, range)
      : []

  return (
    <div className="export-workspace flex min-h-full min-w-0">
      <div className="export-list-scroll min-w-0 flex-1 px-6 py-8">
        <div className="mx-auto max-w-2xl">
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
              const tanggalBulanIni = month.weeks.flatMap((week) =>
                editableWeekDates(week, month.key, range),
              )
              const dayCount = tanggalBulanIni.length
              const filledCount = tanggalBulanIni.filter((date) =>
                isDayFilled(logs.days[date]),
              ).length
              const incomplete = monthIncompleteDates(month, logs.days, range)
              const isOpen = openMonths[month.key] ?? false
              return (
                <div key={month.key} className="theme-t border border-border-base bg-bg-card">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-bg-card-hover"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenMonths((current) => ({ ...current, [month.key]: !isOpen }))
                    }
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
                            const id = tabKey(month.key, week.id)
                            const isActive = activeTabId === id
                            const isExporting = exporting === id
                            return (
                              <div
                                key={week.id}
                                ref={(node) => {
                                  weekRefs.current[id] = node
                                }}
                                className={`export-week-row flex items-center justify-between gap-3 border px-3 py-2 ${isActive ? 'export-week-row-active border-border-focus bg-bg-card-hover' : 'border-border-light'}`}
                              >
                                <button
                                  type="button"
                                  className="export-week-trigger min-w-0 flex-1 cursor-pointer text-left"
                                  aria-label={`Preview ${month.label} ${t('ekspor.mingguKe', { n: week.weekOfMonth })}`}
                                  onClick={() => openPreview(month.key, week.id)}
                                >
                                  <p className="text-[12px] font-medium text-text-primary">
                                    {t('ekspor.mingguKe', { n: week.weekOfMonth })}
                                  </p>
                                  <p className="text-[11px] text-text-dim">
                                    {formatWeekRange(week.startDate, locale)} ·{' '}
                                    {t('ekspor.hariTerisi', {
                                      hari: weekDates.length,
                                      terisi: weekDates.filter((date) =>
                                        isDayFilled(logs.days[date]),
                                      ).length,
                                    })}
                                  </p>
                                  {weekIncomplete.length > 0 ? (
                                    <p className="mt-0.5 text-[11px] text-status-warn-text">
                                      {t('ekspor.belumLengkap', { n: weekIncomplete.length })}
                                    </p>
                                  ) : null}
                                </button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="cursor-pointer"
                                  disabled={isExporting}
                                  onClick={() =>
                                    requestWeekExport(month.key, week.id, weekIncomplete)
                                  }
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
      </div>
      <AnimatePresence>
        {panelOpen ? (
          <m.aside
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={popTransition}
            className="export-preview-panel theme-t flex min-h-0 min-w-[360px] flex-col border-l border-border-base bg-bg-card"
            data-preview-width={previewWidthMode}
          >
            <div className="flex min-h-10 items-center justify-between border-b border-border-base px-2">
              <div className="flex min-w-0 flex-1 overflow-x-auto">
                {tabs.map((tab) => {
                  const id = tabKey(tab.monthKey, tab.weekId)
                  const month = months.find((item) => item.key === tab.monthKey)
                  const week = month?.weeks.find((item) => item.id === tab.weekId)
                  const outdated = tab.fingerprint !== currentFingerprint(tab.monthKey, tab.weekId)
                  return (
                    <div
                      key={id}
                      className={`export-preview-tab flex shrink-0 items-center gap-1 border-r border-border-light ${activeTabId === id ? 'export-preview-tab-active' : ''}`}
                    >
                      <button
                        type="button"
                        className="max-w-36 cursor-pointer truncate px-2 py-2 text-[11px] text-text-muted hover:text-text-primary"
                        onClick={() => selectPreviewTab(tab.monthKey, tab.weekId)}
                      >
                        {month?.label ?? tab.monthKey} ·{' '}
                        {week ? t('ekspor.mingguKe', { n: week.weekOfMonth }) : tab.weekId}
                        {outdated ? ' *' : ''}
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer p-1 text-text-dim hover:text-text-primary"
                        aria-label={`Tutup preview ${id}`}
                        onClick={() => closeTab(id)}
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Tutup panel preview"
                onClick={() => setPanelOpen(false)}
              >
                <X />
              </Button>
            </div>
            <div className="export-preview-width-switcher flex items-center gap-0.5 border-b border-border-light px-2 py-1.5">
              {PREVIEW_WIDTH_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`export-preview-width-option ${previewWidthMode === mode ? 'export-preview-width-option-active' : ''}`}
                  aria-pressed={previewWidthMode === mode}
                  onClick={() => setPreviewWidthMode(mode)}
                >
                  {mode === 'third' ? '1/3' : mode === 'two-thirds' ? '2/3' : 'Full'}
                </button>
              ))}
            </div>
            {activeTab ? (
              <>
                <div className="flex min-h-11 items-center justify-between gap-2 border-b border-border-light px-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-text-primary">
                      {activeMonth?.label} ·{' '}
                      {activeWeek
                        ? t('ekspor.mingguKe', { n: activeWeek.weekOfMonth })
                        : activeTab.weekId}
                    </p>
                    {loadingPreview === activeTabId ? (
                      <p className="text-[11px] text-text-dim">Sedang memuat preview...</p>
                    ) : activeOutdated ? (
                      <p className="flex items-center gap-1 text-[11px] text-status-warn-text">
                        Preview sudah tidak terbaru{' '}
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 underline"
                          onClick={() => void loadPreview(activeTab.monthKey, activeTab.weekId)}
                        >
                          <RefreshCw className="size-3" />
                          Muat ulang
                        </button>
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exporting === activeTabId}
                    onClick={() =>
                      requestWeekExport(activeTab.monthKey, activeTab.weekId, activeIncomplete)
                    }
                  >
                    <Download className="size-3.5" />
                    Ekspor PDF
                  </Button>
                </div>
                <div className="export-preview-frame min-h-0 flex-1">
                  {loadingPreview === activeTabId || !activeUrl ? (
                    <div className="export-preview-shimmer h-full" role="status">
                      <div className="export-shimmer-line" />
                      <div className="export-shimmer-line export-shimmer-line-short" />
                      <div className="export-shimmer-paper" />
                    </div>
                  ) : (
                    <iframe
                      title={`Preview ${activeMonth?.label ?? ''}`}
                      src={activeUrl}
                      className="h-full w-full border-0 bg-white"
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center px-8 text-center text-[12px] text-text-muted">
                Pilih minggu untuk membuka preview PDF.
              </div>
            )}
          </m.aside>
        ) : null}
      </AnimatePresence>
      <Dialog
        open={pendingExport !== null}
        onOpenChange={(open) => {
          if (!open) setPendingExport(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('ekspor.dialogJudul')}</DialogTitle>
            <DialogDescription>
              {pendingExport
                ? t('ekspor.dialogDeskripsi', {
                    n: pendingExport.incomplete.length,
                    tanggal: pendingExport.incomplete
                      .map((date) => formatTanggalId(date, locale))
                      .join(', '),
                  })
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingExport(null)}>
              {t('common.batal')}
            </Button>
            <Button
              onClick={() => {
                if (!pendingExport) return
                const { monthKey, weekId } = pendingExport
                setPendingExport(null)
                void exportWeek(monthKey, weekId, true)
              }}
            >
              {t('common.tetapEkspor')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
