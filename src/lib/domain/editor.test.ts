import { describe, expect, it } from 'vitest'
import { buildMonthGroups } from './calendar'
import {
  collectIncompleteDates,
  displayJam,
  effectiveStatus,
  isDayFilled,
  isStripStatus,
  JAM_STRIP,
  monthIncompleteDates,
  patchAlasan,
  patchKegiatan,
  showsJamStrip,
  statusFromAlasan,
  validateDay,
} from './editor'
import type { DayEntry } from './types'

function day(patch: Partial<DayEntry> = {}): DayEntry {
  return {
    date: '2026-09-21',
    masuk: null,
    pulang: null,
    kegiatan: '',
    alasan: null,
    status: 'kosong',
    ...patch,
  }
}

describe('statusFromAlasan', () => {
  it('memetakan Sakit dan Izin ke status khusus', () => {
    expect(statusFromAlasan('Sakit')).toBe('sakit')
    expect(statusFromAlasan('sakit')).toBe('sakit')
    expect(statusFromAlasan('  IZIN  ')).toBe('izin')
  })

  it('memetakan alasan lain ke libur', () => {
    expect(statusFromAlasan('Libur Nasional')).toBe('libur')
    expect(statusFromAlasan('Cuti Bersama')).toBe('libur')
    expect(statusFromAlasan('Wawancara')).toBe('libur')
  })
})

describe('effectiveStatus', () => {
  it('terisi bila ada kegiatan', () => {
    expect(effectiveStatus(day({ kegiatan: 'Membuat laporan' }))).toBe('terisi')
  })

  it('mengikuti alasan bila kegiatan kosong', () => {
    expect(effectiveStatus(day({ alasan: 'Sakit' }))).toBe('sakit')
    expect(effectiveStatus(day({ alasan: 'Izin' }))).toBe('izin')
    expect(effectiveStatus(day({ alasan: 'Libur Nasional' }))).toBe('libur')
  })

  it('kosong bila keduanya kosong', () => {
    expect(effectiveStatus(day())).toBe('kosong')
  })

  it('kegiatan menang atas alasan', () => {
    expect(effectiveStatus(day({ kegiatan: 'Rapat', alasan: 'Sakit' }))).toBe('terisi')
  })

  it('mengabaikan kegiatan yang hanya berisi spasi', () => {
    expect(effectiveStatus(day({ kegiatan: '   ' }))).toBe('kosong')
  })
})

describe('isStripStatus dan showsJamStrip', () => {
  it('hanya Sakit dan Izin yang memakai strip', () => {
    expect(isStripStatus('sakit')).toBe(true)
    expect(isStripStatus('izin')).toBe(true)
    expect(isStripStatus('libur')).toBe(false)
    expect(isStripStatus('terisi')).toBe(false)
    expect(isStripStatus('kosong')).toBe(false)
  })

  it('menentukan strip dari isi hari', () => {
    expect(showsJamStrip(day({ alasan: 'Sakit' }))).toBe(true)
    expect(showsJamStrip(day({ kegiatan: 'Kerja' }))).toBe(false)
  })
})

describe('displayJam', () => {
  it('menampilkan fallback bila jam belum diisi', () => {
    expect(displayJam(null, '08.00')).toBe('08.00')
  })

  it('menampilkan jam bila ada', () => {
    expect(displayJam('08.00', '09.00')).toBe('08.00')
    expect(displayJam('16.00', '17.00')).toBe('16.00')
  })

  it('memakai karakter strip yang bukan em dash', () => {
    expect(JAM_STRIP).toBe('-')
  })
})

describe('isDayFilled', () => {
  it('menghitung hari ber-kegiatan sebagai berisi', () => {
    expect(isDayFilled(day({ kegiatan: 'Kerja' }))).toBe(true)
  })

  /*
   * Regresi: hari yang diisi ALASAN statusnya bukan 'terisi', melainkan 'libur', 'sakit',
   * atau 'izin'. Penghitung yang membandingkan langsung dengan 'terisi' melaporkan 0
   * sehingga badge "x/y terisi" tetap nol padahal barisnya sudah diisi alasan.
   */
  it('menghitung hari ber-ALASAN sebagai berisi', () => {
    expect(isDayFilled(day({ alasan: 'Libur Nasional' }))).toBe(true)
    expect(isDayFilled(day({ alasan: 'Cuti Bersama' }))).toBe(true)
    expect(isDayFilled(day({ alasan: 'Sakit' }))).toBe(true)
    expect(isDayFilled(day({ alasan: 'Izin' }))).toBe(true)
    expect(isDayFilled(day({ alasan: 'Wawancara' }))).toBe(true)
  })

  it('menghitung hari kosong sebagai belum berisi', () => {
    expect(isDayFilled(day())).toBe(false)
    expect(isDayFilled(day({ kegiatan: '   ' }))).toBe(false)
    // Entri yang belum ada (tanggal tanpa data tersimpan) juga belum berisi.
    expect(isDayFilled(undefined)).toBe(false)
  })

  it('sejalan dengan validateDay: berisi berarti tidak ada masalah', () => {
    const contoh = [
      day(),
      day({ kegiatan: 'Kerja' }),
      day({ alasan: 'Sakit' }),
      day({ alasan: 'Libur Nasional' }),
    ]
    for (const entri of contoh) {
      expect(validateDay(entri).length === 0).toBe(isDayFilled(entri))
    }
  })
})

describe('validateDay', () => {
  it('menandai hari kosong tanpa alasan', () => {
    const issues = validateDay(day())
    expect(issues).toHaveLength(1)
    expect(issues[0]?.code).toBe('tanpa-alasan')
  })

  it('menerima hari yang terisi kegiatan', () => {
    expect(validateDay(day({ kegiatan: 'Kerja' }))).toEqual([])
  })

  it('menerima hari yang punya alasan', () => {
    expect(validateDay(day({ alasan: 'Libur Nasional' }))).toEqual([])
    expect(validateDay(day({ alasan: 'Sakit' }))).toEqual([])
  })

  it('TIDAK menandai jam yang kosong sebagai masalah (jam default dipakai)', () => {
    expect(validateDay(day({ kegiatan: 'Kerja', masuk: null, pulang: null }))).toEqual([])
  })
})

describe('collectIncompleteDates', () => {
  it('hanya mengumpulkan hari yang dapat diisi', () => {
    const days = [
      day({ date: '2026-09-21' }),
      day({ date: '2026-09-22', kegiatan: 'Kerja' }),
      day({ date: '2026-09-23' }),
    ]
    const editable = (iso: string) => iso !== '2026-09-23'
    expect(collectIncompleteDates(days, editable)).toEqual(['2026-09-21'])
  })

  it('mengembalikan kosong bila semua lengkap', () => {
    const days = [day({ date: '2026-09-21', kegiatan: 'Kerja' })]
    expect(collectIncompleteDates(days, () => true)).toEqual([])
  })
})

describe('monthIncompleteDates', () => {
  const month =
    buildMonthGroups('2026-09-23', '2026-09-26').find((m) => m.key === '2026-09') ?? null
  if (!month) throw new Error('fixture bulan September tidak ditemukan')
  const range = { mulai: '2026-09-23', selesai: '2026-09-26' }

  it('menghitung hari yang bisa diisi namun masih kosong', () => {
    const days: Record<string, DayEntry> = {
      '2026-09-23': { ...day({ date: '2026-09-23' }), kegiatan: 'Kerja', status: 'terisi' },
    }
    expect(monthIncompleteDates(month, days, range)).toEqual([
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
    ])
  })

  it('tidak menghitung hari di luar rentang dan hari dengan alasan', () => {
    const days: Record<string, DayEntry> = {
      '2026-09-23': { ...day({ date: '2026-09-23' }), alasan: 'Sakit', status: 'sakit' },
      '2026-09-24': { ...day({ date: '2026-09-24' }), kegiatan: 'Kerja', status: 'terisi' },
      '2026-09-25': { ...day({ date: '2026-09-25' }), kegiatan: 'Kerja', status: 'terisi' },
      '2026-09-26': { ...day({ date: '2026-09-26' }), kegiatan: 'Kerja', status: 'terisi' },
    }
    expect(monthIncompleteDates(month, days, range)).toEqual([])
  })

  it('mengembalikan kosong bila seluruh hari yang bisa diisi terisi', () => {
    const days: Record<string, DayEntry> = Object.fromEntries(
      ['2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26'].map((date) => [
        date,
        { ...day({ date }), kegiatan: 'Kerja', status: 'terisi' },
      ]),
    )
    expect(monthIncompleteDates(month, days, range)).toEqual([])
  })
})

describe('patchAlasan', () => {
  it('mengisi alasan, mengosongkan kegiatan, dan menyimpan status', () => {
    expect(patchAlasan('Sakit')).toEqual({ alasan: 'Sakit', status: 'sakit', kegiatan: '' })
    expect(patchAlasan('Libur Nasional')).toEqual({
      alasan: 'Libur Nasional',
      status: 'libur',
      kegiatan: '',
    })
  })

  it('memangkas spasi', () => {
    expect(patchAlasan('  Izin  ')).toEqual({ alasan: 'Izin', status: 'izin', kegiatan: '' })
  })

  it('mengosongkan alasan dan status saat nilai kosong', () => {
    expect(patchAlasan('   ')).toEqual({ alasan: null, status: 'kosong' })
  })
})

describe('patchKegiatan', () => {
  it('mengetik kegiatan menjadikan terisi dan membatalkan alasan lama', () => {
    expect(patchKegiatan('Rapat')).toEqual({ kegiatan: 'Rapat', status: 'terisi', alasan: null })
  })

  it('mengosongkan kegiatan menurunkan status tanpa menyentuh alasan', () => {
    expect(patchKegiatan('')).toEqual({ kegiatan: '', status: 'kosong' })
  })
})
