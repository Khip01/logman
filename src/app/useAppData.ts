import { useEffect } from 'react'
import {
  buildMonthGroups,
  pickInitialMonthKey,
  pickInitialWeekId,
  todayIso,
} from '@/lib/domain/calendar'
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
 * Membangun daftar bulan dan minggu dari rentang magang (AGENTS.md bagian 5.2).
 *
 * Struktur bulan dan minggu SELALU diturunkan dari rentang, tidak disimpan. Penting:
 * fungsi ini SENGAJA tidak membaca data hari. Bila ia ikut bergantung pada data hari,
 * setiap ketikan akan membangun ulang seluruh struktur dan memaksa semua baris editor
 * ter-render ulang, melanggar aturan performa di AGENTS.md bagian 13. Isi hari dibaca
 * langsung oleh komponen baris lewat selector per tanggal.
 *
 * Efek ini juga menjaga agar pilihan bulan dan minggu tetap valid.
 */
export function useDeriveMonths(): void {
  const mulai = useConfigStore((s) => s.config.magang.mulai)
  const selesai = useConfigStore((s) => s.config.magang.selesai)
  const setMonths = useLogbookStore((s) => s.setMonths)

  useEffect(() => {
    if (!mulai || !selesai) {
      setMonths([])
      useLogbookStore.getState().setActiveMonth(null)
      return
    }

    const months = buildMonthGroups(mulai, selesai)
    setMonths(months)

    // Pertahankan pilihan user bila masih valid, selain itu pilih default.
    const today = todayIso()
    const logbook = useLogbookStore.getState()
    const monthKey = logbook.activeMonthKey ?? pickInitialMonthKey(months, today)
    const month = monthKey ? months.find((item) => item.key === monthKey) : undefined
    if (!month) return

    const weekId = month.weeks.some((week) => week.id === logbook.activeWeekId)
      ? logbook.activeWeekId
      : pickInitialWeekId(month, today)

    if (weekId) logbook.selectWeek(weekId, month.key)
    else logbook.setActiveMonth(month.key)
  }, [mulai, selesai, setMonths])
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
