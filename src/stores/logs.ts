import { create } from 'zustand'
import { createDebouncedSaver } from '@/lib/autosave/debouncedSaver'
import { applyDayPatch, defaultLogData } from '@/lib/domain/schema'
import type { DayEntry, LogData } from '@/lib/domain/types'
import { log } from '@/lib/log'
import { getRepositories } from '@/lib/repo'
import { useSaveStatusStore } from '@/stores/saveStatus'

/**
 * Store data log dengan autosave per hari (AGENTS.md bagian 5 dan 7).
 *
 * Kunci desain: perubahan dikumpulkan sebagai PATCH per tanggal, bukan seluruh file.
 * Satu ketikan hanya mengirim satu tanggal ke server.
 */

export type DayPatch = Record<string, Partial<DayEntry> | null>

interface LogsState {
  data: LogData
  loaded: boolean
  loading: boolean
  error: string | null
  load: () => Promise<void>
  /** Mengubah satu hari secara optimistic lalu menjadwalkan simpan. */
  setDay: (date: string, patch: Partial<DayEntry>) => void
  /** Mengubah banyak hari sekaligus. */
  setDays: (patch: DayPatch) => void
  /** Menimpa seluruh data, dipakai mode seed. */
  replaceAll: (data: LogData) => Promise<void>
  flush: () => Promise<void>
}

/** Menggabungkan dua patch: field per tanggal di-merge, bukan ditimpa mentah. */
export function mergeDayPatches(a: DayPatch, b: DayPatch): DayPatch {
  const result: DayPatch = { ...a }
  for (const [date, value] of Object.entries(b)) {
    const existing = result[date]
    if (value === null) {
      result[date] = null
    } else if (existing && existing !== null) {
      result[date] = { ...existing, ...value }
    } else {
      result[date] = value
    }
  }
  return result
}

const saver = createDebouncedSaver<DayPatch>({
  delayMs: 500,
  merge: mergeDayPatches,
  save: async (patch) => {
    const traceId = log.newTrace()
    const started = performance.now()
    try {
      const result = await getRepositories().logs.patchDays(patch)
      log.info('logs.save', 'Perubahan hari tersimpan.', {
        traceId,
        durationMs: Math.round(performance.now() - started),
        data: { tanggal: result.changed },
      })
    } catch (error) {
      log.error('logs.save', 'Gagal menyimpan perubahan hari.', {
        traceId,
        data: {
          pesan: error instanceof Error ? error.message : String(error),
          tanggal: Object.keys(patch),
        },
      })
      throw error
    }
  },
  onStateChange: (state, detail) => {
    const status = useSaveStatusStore.getState()
    if (state === 'saved') status.markSaved()
    else if (state === 'error') status.markError(detail?.message ?? 'Gagal menyimpan perubahan.')
    else status.setState(state)
  },
})

export const useLogsStore = create<LogsState>((set, get) => ({
  data: defaultLogData(),
  loaded: false,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    const traceId = log.newTrace()
    try {
      const data = await getRepositories().logs.load()
      set({ data, loaded: true, loading: false })
      log.info('logs.load', 'Data log dimuat.', {
        traceId,
        data: { jumlahHari: Object.keys(data.days).length },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memuat data log.'
      set({ loading: false, error: message })
      log.error('logs.load', message, { traceId })
    }
  },

  setDay: (date, patch) => {
    const current = get().data
    const { data } = applyDayPatch(current, { [date]: patch })
    set({ data })
    saver.schedule({ [date]: patch })
  },

  setDays: (patch) => {
    const current = get().data
    const { data } = applyDayPatch(current, patch)
    set({ data })
    saver.schedule(patch)
  },

  replaceAll: async (data) => {
    const traceId = log.newTrace()
    await getRepositories().logs.replaceAll(data)
    set({ data })
    log.info('logs.replace', 'Seluruh data log ditimpa.', {
      traceId,
      data: { jumlahHari: Object.keys(data.days).length },
    })
  },

  flush: async () => {
    await saver.flush()
  },
}))
