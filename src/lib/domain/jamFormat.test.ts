import { describe, expect, it } from 'vitest'
import {
  formatJamDisplay,
  isJamFormat,
  minuteOptions,
  parseJam24,
  parseJamDisplay,
  to12Hour,
  to24Hour,
  toJam24,
} from './jamFormat'

describe('isJamFormat', () => {
  it('hanya menerima 24 dan 12', () => {
    expect(isJamFormat('24')).toBe(true)
    expect(isJamFormat('12')).toBe(true)
    expect(isJamFormat('13')).toBe(false)
    expect(isJamFormat(24)).toBe(false)
    expect(isJamFormat(null)).toBe(false)
  })
})

describe('parseJam24', () => {
  it('membaca format titik valid', () => {
    expect(parseJam24('08.00')).toEqual({ hh: 8, mm: 0 })
    expect(parseJam24('23.59')).toEqual({ hh: 23, mm: 59 })
  })

  it('menolak nilai tidak valid', () => {
    expect(parseJam24('24.00')).toBeNull()
    expect(parseJam24('08.60')).toBeNull()
    expect(parseJam24('8.00')).toBeNull()
    expect(parseJam24('')).toBeNull()
  })
})

describe('toJam24', () => {
  it('memad jam dan menit', () => {
    expect(toJam24(8, 0)).toBe('08.00')
    expect(toJam24(0, 5)).toBe('00.05')
  })

  it('menolak nilai di luar rentang atau bukan bilangan bulat', () => {
    expect(toJam24(24, 0)).toBeNull()
    expect(toJam24(-1, 0)).toBeNull()
    expect(toJam24(8, 60)).toBeNull()
    expect(toJam24(8.5, 0)).toBeNull()
  })
})

describe('to12Hour', () => {
  it('tengah malam dan tengah hari menjadi 12', () => {
    expect(to12Hour(0)).toEqual({ hh: 12, meridiem: 'AM' })
    expect(to12Hour(12)).toEqual({ hh: 12, meridiem: 'PM' })
  })

  it('sore menjadi jam 12 jam dengan PM', () => {
    expect(to12Hour(13)).toEqual({ hh: 1, meridiem: 'PM' })
    expect(to12Hour(23)).toEqual({ hh: 11, meridiem: 'PM' })
  })
})

describe('to24Hour', () => {
  it('12 AM menjadi 0 dan 12 PM menjadi 12', () => {
    expect(to24Hour(12, 'AM')).toBe(0)
    expect(to24Hour(12, 'PM')).toBe(12)
  })

  it('jam lain bergeser sesuai meridiem', () => {
    expect(to24Hour(8, 'AM')).toBe(8)
    expect(to24Hour(1, 'PM')).toBe(13)
    expect(to24Hour(11, 'PM')).toBe(23)
  })
})

describe('formatJamDisplay', () => {
  it('format 24 memakai titik', () => {
    expect(formatJamDisplay('08.00', '24')).toBe('08.00')
    expect(formatJamDisplay('16.30', '24')).toBe('16.30')
  })

  it('format 12 memakai AM/PM', () => {
    expect(formatJamDisplay('08.00', '12')).toBe('8.00 AM')
    expect(formatJamDisplay('16.30', '12')).toBe('4.30 PM')
    expect(formatJamDisplay('00.00', '12')).toBe('12.00 AM')
    expect(formatJamDisplay('12.00', '12')).toBe('12.00 PM')
  })

  it('membiarkan nilai belum valid apa adanya', () => {
    expect(formatJamDisplay('08', '12')).toBe('08')
    expect(formatJamDisplay('', '24')).toBe('')
  })
})

describe('parseJamDisplay format 24', () => {
  it('menerima berbagai bentuk', () => {
    expect(parseJamDisplay('08.00', '24')).toBe('08.00')
    expect(parseJamDisplay('8.00', '24')).toBe('08.00')
    expect(parseJamDisplay('08:00', '24')).toBe('08.00')
    expect(parseJamDisplay('8', '24')).toBe('08.00')
  })

  it('menolak nilai tidak valid', () => {
    expect(parseJamDisplay('25.00', '24')).toBeNull()
    expect(parseJamDisplay('abc', '24')).toBeNull()
    expect(parseJamDisplay('', '24')).toBeNull()
  })
})

describe('parseJamDisplay format 12', () => {
  it('menerima bentuk dengan meridiem', () => {
    expect(parseJamDisplay('8.00 AM', '12')).toBe('08.00')
    expect(parseJamDisplay('8:00 pm', '12')).toBe('20.00')
    expect(parseJamDisplay('12 AM', '12')).toBe('00.00')
    expect(parseJamDisplay('12 PM', '12')).toBe('12.00')
    expect(parseJamDisplay('8', '12')).toBe('08.00')
  })

  it('tanpa meridiem dianggap AM', () => {
    expect(parseJamDisplay('8.30', '12')).toBe('08.30')
  })

  it('menolak jam di luar 1 sampai 12', () => {
    expect(parseJamDisplay('13.00 PM', '12')).toBeNull()
    expect(parseJamDisplay('0.00 AM', '12')).toBeNull()
  })
})

describe('minuteOptions', () => {
  it('mengembalikan kelipatan lima', () => {
    expect(minuteOptions(null)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
  })

  it('menyisipkan menit aktif bila bukan kelipatan lima', () => {
    expect(minuteOptions(7)).toContain(7)
    expect(minuteOptions(7)).toHaveLength(13)
  })

  it('tidak menambah bila sudah ada', () => {
    expect(minuteOptions(10)).toHaveLength(12)
  })
})
