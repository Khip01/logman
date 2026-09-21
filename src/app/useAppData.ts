import { useEffect } from 'react'
import { buildMonthGroups } from '@/lib/domain/calendar'
import { log } from '@/lib/log'
import { useConfigStore } from '@/stores/config'
import { useLogbookStore } from '@/stores/logbook'
import { useLogsStore } from '@/stores/logs'
import { useUiStore } from '@/stores/ui'

/**
 * Memuat konfigurasi dan data log sekali saat aplikasi dibuka.
 *
 * Gagal memuat TIDAK boleh mematikan aplikasi: error dicatat, status bar menampilkan
 * keadaan gagal, dan UI tetap bisa dibuka dengan nilai default.
 */
export function useBootstrapData(): { ready: boolean } {
  const loadedConfig = useConfigStore((s) => s.loaded)
  const loadedLogs = useLogsStore((s) => s.loaded)
  const loadConfig = useConfigStore((s) => s.load)
  const loadLogs = useLogsStore((s) => s.load)

  useEffect(() => {
    const traceId = log.newTrace()
    log.info('app.bootstrap', 'Memuat data awal.', { traceId })
    void loadConfig()
    void loadLogs()
  }, [loadConfig, loadLogs])

  return { ready: loadedConfig && loadedLogs }
}

/**
 * Menyimpan otomatis perubahan preferensi UI (tema dan tier animasi) ke konfigurasi.
 * Dipisah dari store UI agar store UI tetap ringan dan tidak bergantung pada repository.
 */
export function useUiPreferenceSync(): void {
  const theme = useUiStore((s) => s.theme)
  const motion = useUiStore((s) => s.motion)
  const loaded = useConfigStore((s) => s.loaded)

  useEffect(() => {
    if (!loaded) return
    const config = useConfigStore.getState().config
    if (config.tema === theme && config.tierAnimasi === motion) return
    useConfigStore.getState().update({ tema: theme, tierAnimasi: motion })
  }, [theme, motion, loaded])
}

/**
 * Membangun daftar bulan dan minggu dari rentang magang, lalu mengisinya dengan
 * entri hari dari store logs. Struktur bulan dan minggu selalu diturunkan, tidak
 * disimpan (AGENTS.md bagian 5.2).
 */
export function useDeriveMonths(): void {
  const mulai = useConfigStore((s) => s.config.magang.mulai)
  const selesai = useConfigStore((s) => s.config.magang.selesai)
  const days = useLogsStore((s) => s.data.days)
  const setMonths = useLogbookStore((s) => s.setMonths)
  const activeMonthKey = useLogbookStore((s) => s.activeMonthKey)
  const setActiveMonth = useLogbookStore((s) => s.setActiveMonth)

  useEffect(() => {
    if (!mulai || !selesai) {
      setMonths([])
      if (activeMonthKey !== null) setActiveMonth(null)
      return
    }

    const months = buildMonthGroups(mulai, selesai)
    const filled = months.map((month) => ({
      ...month,
      weeks: month.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => {
          const saved = days[day.date]
          return saved ? { ...day, ...saved } : day
        }),
      })),
    }))

    setMonths(filled)
    if (!activeMonthKey && filled[0]) setActiveMonth(filled[0].key)
  }, [mulai, selesai, days, setMonths, activeMonthKey, setActiveMonth])
}

/**
 * Menyimpan perubahan yang tertunda saat tab disembunyikan atau ditutup, agar
 * perubahan tidak hilang (AGENTS.md bagian 7).
 */
export function useFlushOnHidden(): void {
  useEffect(() => {
    function flush(): void {
      if (document.visibilityState === 'hidden') {
        void useConfigStore.getState().flush()
        void useLogsStore.getState().flush()
      }
    }
    function onPageHide(): void {
      void useConfigStore.getState().flush()
      void useLogsStore.getState().flush()
    }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [])
}
