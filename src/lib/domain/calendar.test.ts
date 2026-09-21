import { describe, expect, it } from 'vitest'
import {
  buildMonthGroups,
  buildWeekDays,
  createEmptyDay,
  dayOfWeekKey,
  disabledReasonFor,
  formatWeekRange,
  isDayActive,
  mondaysInRange,
  weekDates,
} from './calendar'

describe('dayOfWeekKey', () => {
  it('memetakan hari kerja', () => {
    expect(dayOfWeekKey('2026-09-21')).toBe('senin')
    expect(dayOfWeekKey('2026-09-22')).toBe('selasa')
    expect(dayOfWeekKey('2026-09-26')).toBe('sabtu')
  })

  it('mengembalikan null untuk akhir pekan', () => {
    expect(dayOfWeekKey('2026-09-20')).toBeNull()
  })
})

describe('createEmptyDay dan buildWeekDays', () => {
  it('membuat hari kosong dengan status kosong', () => {
    const day = createEmptyDay('2026-09-21')
    expect(day).toEqual({
      date: '2026-09-21',
      masuk: null,
      pulang: null,
      kegiatan: '',
      alasan: null,
      status: 'kosong',
    })
  })

  it('membangun tepat enam baris Senin sampai Sabtu', () => {
    const days = buildWeekDays('2026-09-21')
    expect(days).toHaveLength(6)
    expect(days[0]?.date).toBe('2026-09-21')
    expect(days[5]?.date).toBe('2026-09-26')
  })
})

describe('kepemilikan baris per bulan', () => {
  const range = { mulai: '2026-08-01', selesai: '2026-12-31' }

  it('baris pada bulan aktif tidak disabled', () => {
    expect(disabledReasonFor('2026-09-21', '2026-09', range)).toBeNull()
    expect(isDayActive('2026-09-21', '2026-09', range)).toBe(true)
  })

  it('baris milik bulan lain disabled dengan alasan bulan lain', () => {
    expect(disabledReasonFor('2026-08-31', '2026-09', range)).toBe('bulan-lain')
    expect(disabledReasonFor('2026-09-01', '2026-08', range)).toBe('bulan-lain')
  })

  it('hari sebelum magang mulai disabled', () => {
    const partial = { mulai: '2026-09-16', selesai: '2026-12-31' }
    expect(disabledReasonFor('2026-09-14', '2026-09', partial)).toBe('sebelum-magang')
    expect(disabledReasonFor('2026-09-16', '2026-09', partial)).toBeNull()
  })

  it('hari setelah magang selesai disabled', () => {
    const partial = { mulai: '2026-09-01', selesai: '2026-09-18' }
    expect(disabledReasonFor('2026-09-19', '2026-09', partial)).toBe('setelah-magang')
    expect(disabledReasonFor('2026-09-18', '2026-09', partial)).toBeNull()
  })

  it('prioritas: di luar rentang lebih dulu daripada bulan lain', () => {
    const partial = { mulai: '2026-09-16', selesai: '2026-12-31' }
    // 31 Agustus: di luar rentang DAN bulan lain. Alasan harus sebelum-magang.
    expect(disabledReasonFor('2026-08-31', '2026-09', partial)).toBe('sebelum-magang')
  })

  it('tanpa rentang, hanya aturan bulan yang berlaku', () => {
    const empty = { mulai: null, selesai: null }
    expect(disabledReasonFor('2026-09-21', '2026-09', empty)).toBeNull()
    expect(disabledReasonFor('2026-08-31', '2026-09', empty)).toBe('bulan-lain')
  })
})

describe('mondaysInRange', () => {
  it('menghasilkan Senin pertama sampai terakhir yang menyentuh rentang', () => {
    // Rentang mulai Rabu 16 Sep 2026, selesai Jumat 2 Okt 2026.
    const result = mondaysInRange('2026-09-16', '2026-10-02')
    expect(result).toEqual(['2026-09-14', '2026-09-21', '2026-09-28'])
  })

  it('rentang satu hari menghasilkan satu Senin', () => {
    expect(mondaysInRange('2026-09-21', '2026-09-21')).toEqual(['2026-09-21'])
  })
})

describe('buildMonthGroups', () => {
  it('mengembalikan kosong untuk rentang tidak valid', () => {
    expect(buildMonthGroups('2026-09-30', '2026-09-01')).toEqual([])
    expect(buildMonthGroups('bukan-tanggal', '2026-09-01')).toEqual([])
  })

  it('membagi minggu lintas bulan ke DUA grup (AGENTS.md bagian 6)', () => {
    // Rentang 1 Agu 2026 sampai 30 Sep 2026 memuat minggu 31 Agu - 5 Sep.
    const groups = buildMonthGroups('2026-08-01', '2026-09-30')
    expect(groups.map((g) => g.key)).toEqual(['2026-08', '2026-09'])

    const agustus = groups[0]
    const september = groups[1]
    if (!agustus || !september) throw new Error('grup bulan tidak lengkap')

    const weekId = '2026-08-31'
    const inAgustus = agustus.weeks.find((w) => w.id === weekId)
    const inSeptember = september.weeks.find((w) => w.id === weekId)

    expect(inAgustus).toBeDefined()
    expect(inSeptember).toBeDefined()
    expect(inAgustus?.startDate).toBe('2026-08-31')
    expect(inAgustus?.endDate).toBe('2026-09-05')
  })

  it('baris Senin 31 Agu aktif di grup Agustus dan disabled di grup September', () => {
    const range = { mulai: '2026-08-01', selesai: '2026-09-30' }

    expect(isDayActive('2026-08-31', '2026-08', range)).toBe(true)
    expect(isDayActive('2026-08-31', '2026-09', range)).toBe(false)
    expect(disabledReasonFor('2026-08-31', '2026-09', range)).toBe('bulan-lain')

    // Baris Selasa 1 Sep aktif di grup September dan disabled di grup Agustus.
    expect(isDayActive('2026-09-01', '2026-09', range)).toBe(true)
    expect(disabledReasonFor('2026-09-01', '2026-08', range)).toBe('bulan-lain')
  })

  it('nomor minggu di-reset per bulan, mulai dari 1', () => {
    const groups = buildMonthGroups('2026-08-01', '2026-09-30')
    for (const group of groups) {
      expect(group.weeks[0]?.weekOfMonth).toBe(1)
      // Nomor berurutan tanpa lompatan.
      group.weeks.forEach((week, index) => {
        expect(week.weekOfMonth).toBe(index + 1)
      })
    }
  })

  it('minggu lintas bulan menjadi M1 di bulan berikutnya', () => {
    const groups = buildMonthGroups('2026-08-01', '2026-09-30')
    const september = groups.find((g) => g.key === '2026-09')
    // Minggu 31 Agu - 5 Sep adalah minggu pertama yang menyentuh September.
    expect(september?.weeks[0]?.id).toBe('2026-08-31')
    expect(september?.weeks[0]?.weekOfMonth).toBe(1)
  })

  it('menangani rentang yang mulai di pertengahan minggu', () => {
    // Mulai Rabu 16 Sep 2026. Minggu pertama dimulai Senin 14 Sep, tapi hari
    // 14 dan 15 berada di luar rentang.
    const groups = buildMonthGroups('2026-09-16', '2026-10-02')
    const september = groups.find((g) => g.key === '2026-09')
    expect(september?.weeks[0]?.id).toBe('2026-09-14')

    const range = { mulai: '2026-09-16', selesai: '2026-10-02' }
    expect(isDayActive('2026-09-14', '2026-09', range)).toBe(false)
    expect(disabledReasonFor('2026-09-14', '2026-09', range)).toBe('sebelum-magang')
    expect(isDayActive('2026-09-16', '2026-09', range)).toBe(true)
  })

  it('menangani rentang yang berakhir di pertengahan minggu', () => {
    const groups = buildMonthGroups('2026-09-01', '2026-09-18')
    const range = { mulai: '2026-09-01', selesai: '2026-09-18' }
    expect(isDayActive('2026-09-18', '2026-09', range)).toBe(true)
    expect(disabledReasonFor('2026-09-19', '2026-09', range)).toBe('setelah-magang')
    expect(groups).toHaveLength(1)
  })

  it('menangani lintas tahun', () => {
    const groups = buildMonthGroups('2026-12-01', '2027-01-31')
    expect(groups.map((g) => g.key)).toEqual(['2026-12', '2027-01'])
    // Minggu 28 Des 2026 - 2 Jan 2027 harus muncul di kedua grup.
    const desember = groups.find((g) => g.key === '2026-12')
    const januari = groups.find((g) => g.key === '2027-01')
    expect(desember?.weeks.some((w) => w.id === '2026-12-28')).toBe(true)
    expect(januari?.weeks.some((w) => w.id === '2026-12-28')).toBe(true)
  })

  it('setiap minggu selalu punya enam hari', () => {
    const groups = buildMonthGroups('2026-08-01', '2026-09-30')
    for (const group of groups) {
      for (const week of group.weeks) {
        expect(week.days).toHaveLength(6)
      }
    }
  })
})

describe('weekDates dan formatWeekRange', () => {
  it('menghasilkan enam tanggal', () => {
    expect(weekDates('2026-08-31')).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
    ])
  })

  it('memformat rentang minggu lintas bulan', () => {
    expect(formatWeekRange('2026-08-31')).toBe('31 Agu - 5 Sep')
    expect(formatWeekRange('2026-09-21')).toBe('21 Sep - 26 Sep')
  })
})
