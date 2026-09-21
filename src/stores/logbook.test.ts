import { beforeEach, describe, expect, it } from 'vitest'
import { buildMonthGroups } from '@/lib/domain/calendar'
import { useLogbookStore } from './logbook'

/**
 * Navigasi bulan dan minggu (AGENTS.md bagian 6 dan 11.4).
 *
 * Kasus terpenting: minggu lintas bulan muncul di DUA grup, jadi pilihan minggu harus
 * disertai bulan konteks agar baris milik bulan yang benar yang dianggap aktif.
 */

const GROUPS = buildMonthGroups('2026-08-01', '2026-09-30')

beforeEach(() => {
  useLogbookStore.setState({
    months: GROUPS,
    activeMonthKey: '2026-08',
    activeWeekId: GROUPS[0]?.weeks[0]?.id ?? null,
  })
})

describe('setActiveMonth', () => {
  it('memindahkan minggu aktif ke minggu pertama bulan baru bila minggu lama tidak ada di sana', () => {
    useLogbookStore.getState().setActiveMonth('2026-09')
    const state = useLogbookStore.getState()
    expect(state.activeMonthKey).toBe('2026-09')
    expect(state.activeWeekId).toBe('2026-08-31')
  })

  it('mempertahankan minggu aktif bila minggu itu ada di bulan baru', () => {
    // Minggu 31 Agu - 5 Sep muncul di Agustus dan September.
    useLogbookStore.setState({ activeMonthKey: '2026-08', activeWeekId: '2026-08-31' })
    useLogbookStore.getState().setActiveMonth('2026-09')
    const state = useLogbookStore.getState()
    expect(state.activeMonthKey).toBe('2026-09')
    expect(state.activeWeekId).toBe('2026-08-31')
  })

  it('mengosongkan pilihan saat key null', () => {
    useLogbookStore.getState().setActiveMonth(null)
    const state = useLogbookStore.getState()
    expect(state.activeMonthKey).toBeNull()
    expect(state.activeWeekId).toBeNull()
  })
})

describe('selectWeek', () => {
  it('menetapkan bulan konteks dan minggu sekaligus', () => {
    useLogbookStore.getState().selectWeek('2026-08-31', '2026-09')
    const state = useLogbookStore.getState()
    expect(state.activeMonthKey).toBe('2026-09')
    expect(state.activeWeekId).toBe('2026-08-31')
  })

  it('menetapkan minggu yang sama dengan bulan konteks berbeda (minggu lintas bulan)', () => {
    useLogbookStore.getState().selectWeek('2026-08-31', '2026-08')
    expect(useLogbookStore.getState().activeMonthKey).toBe('2026-08')

    useLogbookStore.getState().selectWeek('2026-08-31', '2026-09')
    expect(useLogbookStore.getState().activeMonthKey).toBe('2026-09')
  })

  it('jatuh ke setActiveWeek bila bulan konteks tidak memuat minggu itu', () => {
    useLogbookStore.getState().selectWeek('2026-09-21', '2026-08')
    const state = useLogbookStore.getState()
    expect(state.activeWeekId).toBe('2026-09-21')
    // Bulan tidak ikut berubah karena minggu tidak ada di sana.
    expect(state.activeMonthKey).toBe('2026-08')
  })
})

describe('setMonths', () => {
  it('mengganti daftar bulan', () => {
    useLogbookStore.getState().setMonths([])
    expect(useLogbookStore.getState().months).toEqual([])
  })
})
