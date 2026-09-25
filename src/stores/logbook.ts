import { create } from 'zustand'
import type { MonthGroup } from '@/lib/domain/types'

/**
 * Navigasi bulan dan minggu (AGENTS.md bagian 6 dan 11.4).
 *
 * Struktur bulan dan minggu TIDAK disimpan, melainkan diturunkan dari rentang magang
 * dan disuntikkan lewat `setMonths`. Store ini hanya memegang pilihan user: bulan mana
 * yang sedang dibuka dan minggu mana yang sedang aktif.
 *
 * Minggu lintas bulan muncul di dua grup, jadi minggu aktif TIDAK cukup diidentifikasi
 * oleh id-nya saja. `selectWeek` menerima bulan konteks agar baris milik bulan yang
 * benar yang ditampilkan aktif.
 */

interface LogbookState {
  months: MonthGroup[]
  /** Bulan yang sedang dibuka, format YYYY-MM. */
  activeMonthKey: string | null
  /** Minggu yang sedang dibuka, id minggu (tanggal Senin). */
  activeWeekId: string | null
  /**
   * Permintaan memfokuskan satu baris tanggal, dipicu tombol di banner validasi.
   * `token` naik setiap permintaan supaya klik berulang pada tanggal yang sama tetap
   * memicu ulang animasi dan fokus (AGENTS.md bagian 11.3).
   */
  focusRequest: FocusRequest | null
  setMonths: (months: MonthGroup[]) => void
  setActiveMonth: (key: string | null) => void
  setActiveWeek: (id: string | null) => void
  /** Memilih minggu sekaligus menetapkan bulan konteksnya. */
  selectWeek: (weekId: string, monthKey: string) => void
  /** Meminta baris `date` difokuskan dan dianimasikan kilat. */
  requestFocus: (date: string) => void
  /** Membersihkan permintaan fokus setelah dipakai, agar tidak berulang. */
  clearFocus: () => void
}

export interface FocusRequest {
  date: string
  token: number
}

/** Minggu pertama dari sebuah grup bulan, atau null bila kosong. */
function firstWeekId(months: MonthGroup[], key: string | null): string | null {
  if (!key) return null
  const month = months.find((item) => item.key === key)
  return month?.weeks[0]?.id ?? null
}

/** Benar bila minggu ada di dalam grup bulan tersebut. */
function monthHasWeek(months: MonthGroup[], key: string | null, weekId: string | null): boolean {
  if (!key || !weekId) return false
  const month = months.find((item) => item.key === key)
  return month?.weeks.some((week) => week.id === weekId) ?? false
}

export const useLogbookStore = create<LogbookState>((set, get) => ({
  months: [],
  activeMonthKey: null,
  activeWeekId: null,
  focusRequest: null,

  setMonths: (months) => set({ months }),

  setActiveMonth: (key) => {
    const { months, activeWeekId } = get()
    // Bila minggu aktif tidak ada di bulan baru (misal minggu lintas bulan yang hanya
    // muncul di grup lain), pindah ke minggu pertama bulan itu agar tidak kosong.
    if (!monthHasWeek(months, key, activeWeekId)) {
      set({ activeMonthKey: key, activeWeekId: firstWeekId(months, key) })
      return
    }
    set({ activeMonthKey: key })
  },

  setActiveWeek: (id) => set({ activeWeekId: id }),

  selectWeek: (weekId, monthKey) => {
    // Untuk minggu lintas bulan, bulan konteks ikut dipilih agar baris milik bulan
    // yang benar yang aktif (AGENTS.md bagian 6 poin 4 dan 6).
    const months = get().months
    if (monthHasWeek(months, monthKey, weekId)) {
      set({ activeMonthKey: monthKey, activeWeekId: weekId })
      return
    }
    set({ activeWeekId: weekId })
  },

  requestFocus: (date) =>
    set((state) => ({
      focusRequest: { date, token: (state.focusRequest?.token ?? 0) + 1 },
    })),

  clearFocus: () => set({ focusRequest: null }),
}))
