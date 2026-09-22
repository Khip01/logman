import { create } from 'zustand'
import { createDebouncedSaver } from '@/lib/autosave/debouncedSaver'
import { applyDayPatch, applyNamaMingguPatch, defaultLogData } from '@/lib/domain/schema'
import type { DayEntry, LogData, NamaMinggu } from '@/lib/domain/types'
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

/** Patch nama penanda tangan satu minggu. Field null atau kosong menghapus override. */
export interface NamaMingguPatch {
  weekId: string
  patch: Partial<Record<keyof NamaMinggu, string | null>>
}

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
  /** Mengubah override nama penanda tangan satu minggu. */
  setNamaMinggu: (weekId: string, patch: Partial<Record<keyof NamaMinggu, string | null>>) => void
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

/** Saver terpisah untuk nama penanda tangan, agar tidak mencampur tipe payload. */
const namaSaver = createDebouncedSaver<NamaMingguPatch>({
  delayMs: 500,
  merge: (pending, incoming) => {
    // Hanya gabungkan bila minggu sama; kalau beda, tulis yang terakhir dijadwalkan.
    if (pending.weekId !== incoming.weekId) return incoming
    return { weekId: incoming.weekId, patch: { ...pending.patch, ...incoming.patch } }
  },
  save: async ({ weekId, patch }) => {
    const traceId = log.newTrace()
    try {
      await getRepositories().logs.patchNamaMinggu(weekId, patch)
      log.info('logs.namaMinggu', 'Nama penanda tangan minggu tersimpan.', {
        traceId,
        data: { minggu: weekId },
      })
    } catch (error) {
      log.error('logs.namaMinggu', 'Gagal menyimpan nama penanda tangan minggu.', {
        traceId,
        data: { minggu: weekId, pesan: error instanceof Error ? error.message : String(error) },
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

  setNamaMinggu: (weekId, patch) => {
    const current = get().data
    const { data } = applyNamaMingguPatch(current, weekId, patch)
    set({ data })
    namaSaver.schedule({ weekId, patch })
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
    await namaSaver.flush()
  },
}))
