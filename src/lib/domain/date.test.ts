import { describe, expect, it } from 'vitest'
import {
  addDays,
  dayNameId,
  dayOfWeek,
  diffDays,
  formatTanggalId,
  formatTanggalPendek,
  isIsoDate,
  isWeekend,
  isWithin,
  mondayOf,
  monthKey,
  monthLabel,
  monthShort,
  parseIsoDate,
  saturdayOf,
  toIsoDate,
} from './date'

describe('isIsoDate', () => {
  it('menerima tanggal valid', () => {
    expect(isIsoDate('2026-09-21')).toBe(true)
    expect(isIsoDate('2024-02-29')).toBe(true)
  })

  it('menolak format salah', () => {
    expect(isIsoDate('2026-9-21')).toBe(false)
    expect(isIsoDate('21-09-2026')).toBe(false)
    expect(isIsoDate('')).toBe(false)
    expect(isIsoDate(20260921)).toBe(false)
  })

  it('menolak tanggal yang tidak ada', () => {
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('2025-02-29')).toBe(false)
    expect(isIsoDate('2026-13-01')).toBe(false)
  })
})

describe('parse dan format', () => {
  it('bolak balik konsisten', () => {
    expect(toIsoDate(parseIsoDate('2026-09-21'))).toBe('2026-09-21')
  })

  it('memakai tengah hari agar aman dari zona waktu', () => {
    expect(parseIsoDate('2026-09-21').getHours()).toBe(12)
  })
})

describe('aritmetika tanggal', () => {
  it('menambah dan mengurangi hari', () => {
    expect(addDays('2026-09-21', 1)).toBe('2026-09-22')
    expect(addDays('2026-09-21', -1)).toBe('2026-09-20')
  })

  it('melewati batas bulan', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01')
    expect(addDays('2026-09-01', -1)).toBe('2026-08-31')
  })

  it('melewati batas tahun', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })

  it('menghitung selisih hari', () => {
    expect(diffDays('2026-09-01', '2026-09-30')).toBe(29)
    expect(diffDays('2026-09-30', '2026-09-01')).toBe(-29)
  })
})

describe('hari dan minggu', () => {
  it('mengenali nama hari', () => {
    // 21 September 2026 adalah Senin.
    expect(dayOfWeek('2026-09-21')).toBe(1)
    expect(dayNameId('2026-09-21')).toBe('Senin')
    expect(dayNameId('2026-09-26')).toBe('Sabtu')
    expect(dayNameId('2026-09-20')).toBe('Minggu')
  })

  it('menghitung Senin dan Sabtu dari sebuah minggu', () => {
    expect(mondayOf('2026-09-21')).toBe('2026-09-21')
    expect(mondayOf('2026-09-26')).toBe('2026-09-21')
    expect(mondayOf('2026-09-20')).toBe('2026-09-14')
    expect(saturdayOf('2026-09-21')).toBe('2026-09-26')
  })

  it('menghasilkan Senin yang sama untuk seluruh hari dalam satu minggu', () => {
    const week = [
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
    ]
    for (const iso of week) {
      expect(mondayOf(iso)).toBe('2026-09-21')
    }
  })

  it('mengenali akhir pekan', () => {
    expect(isWeekend('2026-09-20')).toBe(true)
    expect(isWeekend('2026-09-26')).toBe(true)
    expect(isWeekend('2026-09-21')).toBe(false)
  })
})

describe('bulan', () => {
  it('mengambil kunci bulan', () => {
    expect(monthKey('2026-09-21')).toBe('2026-09')
  })

  it('memberi label panjang dan pendek', () => {
    expect(monthLabel('2026-09')).toBe('September 2026')
    expect(monthShort('2026-09')).toBe('Sep')
    expect(monthLabel('2026-08')).toBe('Agustus 2026')
    expect(monthShort('2026-08')).toBe('Agu')
  })

  it('menolak kunci bulan tidak valid', () => {
    expect(() => monthLabel('2026-13')).toThrow()
    expect(() => monthShort('2026')).toThrow()
  })
})

describe('format tanggal Indonesia', () => {
  it('memformat tanggal lengkap', () => {
    expect(formatTanggalId('2026-09-21')).toBe('Senin, 21 September 2026')
    expect(formatTanggalId('2026-01-05')).toBe('Senin, 5 Januari 2026')
  })

  it('memformat tanggal pendek', () => {
    expect(formatTanggalPendek('2026-09-21')).toBe('21 Sep 2026')
  })
})

describe('isWithin', () => {
  it('inklusif di kedua ujung', () => {
    expect(isWithin('2026-09-01', '2026-09-01', '2026-09-30')).toBe(true)
    expect(isWithin('2026-09-30', '2026-09-01', '2026-09-30')).toBe(true)
    expect(isWithin('2026-08-31', '2026-09-01', '2026-09-30')).toBe(false)
  })
})
