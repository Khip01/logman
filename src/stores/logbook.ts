import { create } from 'zustand'
import type { MonthGroup } from '@/lib/domain/types'

interface LogbookState {
  months: MonthGroup[]
  /** Bulan yang sedang dibuka di sidebar, format YYYY-MM. */
  activeMonthKey: string | null
  /** Minggu yang sedang dibuka di editor, id minggu. */
  activeWeekId: string | null
  setMonths: (months: MonthGroup[]) => void
  setActiveMonth: (key: string | null) => void
  setActiveWeek: (id: string | null) => void
}

export const useLogbookStore = create<LogbookState>((set) => ({
  months: [],
  activeMonthKey: null,
  activeWeekId: null,
  setMonths: (months) => set({ months }),
  setActiveMonth: (activeMonthKey) => set({ activeMonthKey }),
  setActiveWeek: (activeWeekId) => set({ activeWeekId }),
}))
