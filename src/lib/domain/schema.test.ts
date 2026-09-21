import { describe, expect, it } from 'vitest'
import {
  applyDayPatch,
  DEFAULT_ALASAN,
  DEFAULT_MITRA,
  DEFAULT_PROGRAM_STUDI,
  defaultConfig,
  defaultLogData,
  isJamValid,
  normalizeJam,
  parseConfig,
  parseDayEntry,
  parseLogData,
} from './schema'

describe('jam', () => {
  it('menerima format titik yang valid', () => {
    expect(isJamValid('08.00')).toBe(true)
    expect(isJamValid('23.59')).toBe(true)
    expect(isJamValid('00.00')).toBe(true)
  })

  it('menolak format salah', () => {
    expect(isJamValid('8.00')).toBe(false)
    expect(isJamValid('24.00')).toBe(false)
    expect(isJamValid('08:00')).toBe(false)
    expect(isJamValid('')).toBe(false)
  })

  it('menormalkan titik dua menjadi titik', () => {
    expect(normalizeJam('08:30')).toBe('08.30')
    expect(normalizeJam(' 16.00 ')).toBe('16.00')
    expect(normalizeJam('')).toBeNull()
    expect(normalizeJam('salah')).toBeNull()
    expect(normalizeJam(null)).toBeNull()
  })
})

describe('parseConfig', () => {
  it('memakai default untuk input bukan objek', () => {
    const { value, issues } = parseConfig(null)
    expect(value).toEqual(defaultConfig())
    expect(issues.length).toBeGreaterThan(0)
  })

  it('mengisi default profil dan alasan', () => {
    const { value } = parseConfig({})
    expect(value.profil.programStudi).toBe(DEFAULT_PROGRAM_STUDI)
    expect(value.profil.mitraIndustri).toBe(DEFAULT_MITRA)
    expect(value.alasan).toEqual(DEFAULT_ALASAN)
    expect(value.ukuranKertas).toBe('A4')
    expect(value.tema).toBe('hitam-pekat')
    expect(value.tierAnimasi).toBe('penuh')
  })

  it('mempertahankan nilai valid', () => {
    const { value, issues } = parseConfig({
      profil: { nama: 'Akhmad', nim: '2341720071' },
      magang: { mulai: '2026-08-01', selesai: '2026-12-31' },
      alasan: ['Izin'],
      ukuranKertas: 'F4',
    })
    expect(value.profil.nama).toBe('Akhmad')
    expect(value.profil.nim).toBe('2341720071')
    expect(value.magang.mulai).toBe('2026-08-01')
    expect(value.alasan).toEqual(['Izin'])
    expect(value.ukuranKertas).toBe('F4')
    expect(issues).toEqual([])
  })

  it('menolak tanggal tidak valid dan mencatat issue', () => {
    const { value, issues } = parseConfig({
      magang: { mulai: '2026-02-30', selesai: 'bukan-tanggal' },
    })
    expect(value.magang.mulai).toBeNull()
    expect(value.magang.selesai).toBeNull()
    expect(issues.length).toBe(2)
  })

  it('menukar rentang yang terbalik', () => {
    const { value, issues } = parseConfig({
      magang: { mulai: '2026-12-31', selesai: '2026-01-01' },
    })
    expect(value.magang.mulai).toBe('2026-01-01')
    expect(value.magang.selesai).toBe('2026-12-31')
    expect(issues.some((i) => i.includes('melebihi'))).toBe(true)
  })

  it('menormalkan jam dan menolak yang tidak valid', () => {
    const { value, issues } = parseConfig({
      jamDefault: {
        senin: { masuk: '07:30', pulang: '15:45' },
        selasa: { masuk: 'salah', pulang: '16.00' },
      },
    })
    expect(value.jamDefault.senin).toEqual({ masuk: '07.30', pulang: '15.45' })
    expect(value.jamDefault.selasa.pulang).toBe('16.00')
    expect(issues.some((i) => i.includes('selasa'))).toBe(true)
  })

  it('menolak ukuran kertas tidak dikenal', () => {
    const { value } = parseConfig({ ukuranKertas: 'A3' })
    expect(value.ukuranKertas).toBe('A4')
  })
})

describe('parseDayEntry', () => {
  it('menerima entri valid', () => {
    const day = parseDayEntry({
      date: '2026-09-21',
      masuk: '08.00',
      pulang: '16.00',
      kegiatan: 'Rapat',
      alasan: null,
      status: 'terisi',
    })
    expect(day).toEqual({
      date: '2026-09-21',
      masuk: '08.00',
      pulang: '16.00',
      kegiatan: 'Rapat',
      alasan: null,
      status: 'terisi',
    })
  })

  it('menolak entri tanpa tanggal valid', () => {
    expect(parseDayEntry({ date: 'salah' })).toBeNull()
    expect(parseDayEntry(null)).toBeNull()
  })

  it('mengganti status tidak dikenal dengan kosong', () => {
    const day = parseDayEntry({ date: '2026-09-21', status: 'entah' })
    expect(day?.status).toBe('kosong')
  })

  it('mengosongkan alasan kosong menjadi null', () => {
    const day = parseDayEntry({ date: '2026-09-21', alasan: '   ' })
    expect(day?.alasan).toBeNull()
  })
})

describe('parseLogData', () => {
  it('memakai default untuk input rusak', () => {
    const { value, issues } = parseLogData(null)
    expect(value).toEqual(defaultLogData())
    expect(issues.length).toBeGreaterThan(0)
  })

  it('membuang entri rusak dan mencatat issue', () => {
    const { value, issues } = parseLogData({
      days: {
        '2026-09-21': { date: '2026-09-21', kegiatan: 'A' },
        'bukan-tanggal': { date: '2026-09-22' },
        '2026-09-23': { date: '2026-09-24' },
      },
    })
    expect(Object.keys(value.days)).toEqual(['2026-09-21'])
    expect(issues.length).toBe(2)
  })
})

describe('applyDayPatch', () => {
  it('menambah dan memperbarui entri', () => {
    const start = defaultLogData()
    const { data, changed } = applyDayPatch(start, {
      '2026-09-21': { kegiatan: 'Rapat', status: 'terisi' },
    })
    expect(changed).toEqual(['2026-09-21'])
    expect(data.days['2026-09-21']?.kegiatan).toBe('Rapat')
  })

  it('mempertahankan field lain saat update sebagian', () => {
    const withDay = applyDayPatch(defaultLogData(), {
      '2026-09-21': { masuk: '08.00', kegiatan: 'Rapat' },
    }).data
    const { data } = applyDayPatch(withDay, {
      '2026-09-21': { kegiatan: 'Rapat lanjutan' },
    })
    expect(data.days['2026-09-21']?.masuk).toBe('08.00')
    expect(data.days['2026-09-21']?.kegiatan).toBe('Rapat lanjutan')
  })

  it('menghapus entri dengan nilai null', () => {
    const withDay = applyDayPatch(defaultLogData(), {
      '2026-09-21': { kegiatan: 'Rapat' },
    }).data
    const { data, changed } = applyDayPatch(withDay, { '2026-09-21': null })
    expect(changed).toEqual(['2026-09-21'])
    expect(data.days['2026-09-21']).toBeUndefined()
  })

  it('mengabaikan tanggal tidak valid', () => {
    const { changed } = applyDayPatch(defaultLogData(), { 'bukan-tanggal': { kegiatan: 'X' } })
    expect(changed).toEqual([])
  })

  it('memperbarui updatedAt', () => {
    const start = defaultLogData()
    const { data } = applyDayPatch(start, { '2026-09-21': { kegiatan: 'A' } })
    expect(data.updatedAt).not.toBe(start.updatedAt)
  })
})
