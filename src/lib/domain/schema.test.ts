import { describe, expect, it } from 'vitest'
import {
  applyDayPatch,
  applyNamaMingguPatch,
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

  it('memad jam satu digit', () => {
    expect(normalizeJam('8.00')).toBe('08.00')
    expect(normalizeJam('7:05')).toBe('07.05')
    expect(normalizeJam('9.30')).toBe('09.30')
  })

  it('menerima jam bulat tanpa menit', () => {
    expect(normalizeJam('8')).toBe('08.00')
    expect(normalizeJam('16')).toBe('16.00')
    expect(normalizeJam('0')).toBe('00.00')
  })

  it('menolak menit satu digit karena ambigu', () => {
    expect(normalizeJam('8.5')).toBeNull()
    expect(normalizeJam('16.3')).toBeNull()
  })

  it('menolak jam di luar 00 sampai 23', () => {
    expect(normalizeJam('24.00')).toBeNull()
    expect(normalizeJam('99.00')).toBeNull()
    expect(normalizeJam('8.99')).toBeNull()
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
    expect(value.alasan).toEqual([{ label: 'Izin', stripJam: true }])
    expect(value.ukuranKertas).toBe('F4')
    expect(issues).toEqual([])
  })

  it('default format jam 24, dev UI mati, dan penanda tangan kosong', () => {
    const { value } = parseConfig({})
    expect(value.formatJam).toBe('24')
    expect(value.tampilkanDevUi).toBe(false)
    expect(value.dosenPembimbing).toBe('')
    expect(value.pembimbingLapangan).toEqual([])
    expect(value.pembimbingLapanganDefault).toBeNull()
  })

  describe('bahasaDokumen', () => {
    it('default ke bahasa Indonesia', () => {
      expect(parseConfig({}).value.bahasaDokumen).toBe('id')
    })

    it('mempertahankan nilai valid', () => {
      expect(parseConfig({ bahasaDokumen: 'en' }).value.bahasaDokumen).toBe('en')
      expect(parseConfig({ bahasaDokumen: 'id' }).value.bahasaDokumen).toBe('id')
    })

    it('key yang tidak ada pada config lama tetap dapat default tanpa migrasi', () => {
      // Config lama tidak punya key ini sama sekali. Tidak boleh gagal parse.
      const { value, issues } = parseConfig({ magang: { mulai: '2026-07-01' } })
      expect(value.bahasaDokumen).toBe('id')
      expect(issues).toEqual([])
    })

    it('nilai asing jatuh ke default, bukan membuat parse gagal', () => {
      expect(parseConfig({ bahasaDokumen: 'fr' }).value.bahasaDokumen).toBe('id')
      expect(parseConfig({ bahasaDokumen: true }).value.bahasaDokumen).toBe('id')
      expect(parseConfig({ bahasaDokumen: null }).value.bahasaDokumen).toBe('id')
    })

    it('terpisah dari bahasa antarmuka', () => {
      // Dua field ini tidak boleh saling memengaruhi: bahasa antarmuka Inggris tidak
      // boleh otomatis mengubah isi dokumen.
      const { value } = parseConfig({ bahasa: 'en' })
      expect(value.bahasa).toBe('en')
      expect(value.bahasaDokumen).toBe('id')
    })
  })

  describe('hariLuarBulan', () => {
    it('default ke samarkan', () => {
      const { value } = parseConfig({})
      expect(value.hariLuarBulan).toBe('samarkan')
    })

    it('mempertahankan nilai valid', () => {
      expect(parseConfig({ hariLuarBulan: 'hapus' }).value.hariLuarBulan).toBe('hapus')
      expect(parseConfig({ hariLuarBulan: 'samarkan' }).value.hariLuarBulan).toBe('samarkan')
    })

    it('key yang tidak ada pada config lama tetap dapat default tanpa migrasi', () => {
      // Config lama tidak punya key ini sama sekali. Tidak boleh gagal parse.
      const { value, issues } = parseConfig({ magang: { mulai: '2026-07-01' } })
      expect(value.hariLuarBulan).toBe('samarkan')
      expect(issues).toEqual([])
    })

    it('nilai asing jatuh ke default, bukan membuat parse gagal', () => {
      expect(parseConfig({ hariLuarBulan: 'hilang' }).value.hariLuarBulan).toBe('samarkan')
      expect(parseConfig({ hariLuarBulan: true }).value.hariLuarBulan).toBe('samarkan')
      expect(parseConfig({ hariLuarBulan: null }).value.hariLuarBulan).toBe('samarkan')
      expect(parseConfig({ hariLuarBulan: 1 }).value.hariLuarBulan).toBe('samarkan')
    })
  })

  /*
   * Hari kerja dan alasan. Keduanya punya bentuk config yang berubah, jadi test ini
   * mengunci bahwa config lama milik user tetap terbaca dan tidak kehilangan makna.
   */
  describe('hariKerja', () => {
    const BAWAAN = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']

    it('bawaannya enam hari, Senin sampai Sabtu, tanpa Minggu', () => {
      expect(parseConfig({}).value.hariKerja).toEqual(BAWAAN)
    })

    it('mempertahankan daftar yang lebih pendek', () => {
      const { value } = parseConfig({ hariKerja: ['senin', 'selasa', 'rabu', 'kamis', 'jumat'] })
      expect(value.hariKerja).toEqual(['senin', 'selasa', 'rabu', 'kamis', 'jumat'])
    })

    it('mengurutkan ulang sesuai urutan Senin sampai Minggu', () => {
      const { value } = parseConfig({ hariKerja: ['jumat', 'senin'] })
      expect(value.hariKerja).toEqual(['senin', 'jumat'])
    })

    it('membuang key yang tidak dikenal', () => {
      const { value } = parseConfig({ hariKerja: ['senin', 'rab', 42, 'jumat'] })
      expect(value.hariKerja).toEqual(['senin', 'jumat'])
    })

    it('Minggu bisa diaktifkan dan urutannya paling akhir', () => {
      // Ada magang yang kerja hari Minggu, jadi Minggu harus bisa dinyalakan. Bawaannya
      // tetap mati supaya config lama tidak ikut berubah barisnya.
      const { value } = parseConfig({ hariKerja: ['minggu', 'senin'] })
      expect(value.hariKerja).toEqual(['senin', 'minggu'])
      expect(parseConfig({}).value.hariKerja).not.toContain('minggu')
    })

    it('daftar kosong dikembalikan menjadi bawaan, karena tabel butuh minimal satu baris', () => {
      expect(parseConfig({ hariKerja: [] }).value.hariKerja).toEqual(BAWAAN)
      expect(parseConfig({ hariKerja: ['rab', 42] }).value.hariKerja).toEqual(BAWAAN)
    })

    it('input yang bukan array jatuh ke default', () => {
      expect(parseConfig({ hariKerja: 'senin' }).value.hariKerja).toEqual(BAWAAN)
      expect(parseConfig({ hariKerja: null }).value.hariKerja).toEqual(BAWAAN)
    })
  })

  describe('alasan config', () => {
    it('config lama berupa string[] tetap terbaca dan strip tidak berubah', () => {
      const { value } = parseConfig({ alasan: ['Libur Nasional', 'Izin', 'Sakit'] })
      expect(value.alasan).toEqual([
        { label: 'Libur Nasional', stripJam: false },
        { label: 'Izin', stripJam: true },
        { label: 'Sakit', stripJam: true },
      ])
    })

    it('bentuk baru dipakai apa adanya', () => {
      const { value } = parseConfig({ alasan: [{ label: 'Sakit Gigi', stripJam: true }] })
      expect(value.alasan).toEqual([{ label: 'Sakit Gigi', stripJam: true }])
    })

    it('daftar kosong dibiarkan kosong karena user boleh menghapus semua', () => {
      expect(parseConfig({ alasan: [] }).value.alasan).toEqual([])
    })

    it('input bukan array jatuh ke default', () => {
      expect(parseConfig({ alasan: 'Izin' }).value.alasan).toHaveLength(5)
    })
  })

  it('default font dokumen times dan skala konten normal', () => {
    const { value } = parseConfig({})
    expect(value.fontDokumen).toBe('times')
    expect(value.contentScale).toBe(1)
  })

  it('membaca font dokumen dan skala konten', () => {
    const { value } = parseConfig({ fontDokumen: 'arial', contentScale: 1.3 })
    expect(value.fontDokumen).toBe('arial')
    expect(value.contentScale).toBe(1.3)
  })

  it('menolak font dokumen tidak dikenal dan skala di luar rentang', () => {
    const { value } = parseConfig({ fontDokumen: 'comic', contentScale: 9 })
    expect(value.fontDokumen).toBe('times')
    expect(value.contentScale).toBe(1)
  })

  it('mempertahankan skala angka wajar di luar daftar preset', () => {
    const { value } = parseConfig({ contentScale: 1.1 })
    expect(value.contentScale).toBe(1.1)
  })

  it('membaca setelan format jam dan dev UI', () => {
    const { value } = parseConfig({ formatJam: '12', tampilkanDevUi: true })
    expect(value.formatJam).toBe('12')
    expect(value.tampilkanDevUi).toBe(true)
  })

  it('menolak format jam tidak dikenal dan dev UI bukan boolean', () => {
    const { value } = parseConfig({ formatJam: '13', tampilkanDevUi: 'ya' })
    expect(value.formatJam).toBe('24')
    expect(value.tampilkanDevUi).toBe(false)
  })

  it('membersihkan daftar pembimbing dan menyelesaikan default', () => {
    const { value } = parseConfig({
      pembimbingLapangan: ['  Budi ', 'budi', '', 'Siti'],
      pembimbingLapanganDefault: 'Siti',
    })
    expect(value.pembimbingLapangan).toEqual(['Budi', 'Siti'])
    expect(value.pembimbingLapanganDefault).toBe('Siti')
  })

  it('jatuh ke pembimbing pertama bila default tidak ada di daftar', () => {
    const { value } = parseConfig({
      pembimbingLapangan: ['Budi', 'Siti'],
      pembimbingLapanganDefault: 'Andi',
    })
    expect(value.pembimbingLapanganDefault).toBe('Budi')
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

  it('membaca override nama penanda tangan per minggu', () => {
    const { value } = parseLogData({
      days: {},
      namaPenandaTangan: {
        '2026-W36': { mahasiswa: 'Ani', pembimbing: 'Siti' },
        '2026-W37': { mahasiswa: '' },
      },
    })
    expect(value.namaPenandaTangan).toEqual({
      '2026-W36': { mahasiswa: 'Ani', pembimbing: 'Siti' },
    })
  })

  it('memberi peta kosong bila field tidak ada', () => {
    const { value } = parseLogData({ days: {} })
    expect(value.namaPenandaTangan).toEqual({})
  })
})

describe('applyNamaMingguPatch', () => {
  it('menambah override baru', () => {
    const { data, changed } = applyNamaMingguPatch(defaultLogData(), '2026-W36', {
      mahasiswa: 'Ani',
    })
    expect(changed).toEqual(['2026-W36'])
    expect(data.namaPenandaTangan['2026-W36']).toEqual({ mahasiswa: 'Ani' })
  })

  it('menggabungkan field pada minggu yang sama', () => {
    const first = applyNamaMingguPatch(defaultLogData(), '2026-W36', { mahasiswa: 'Ani' }).data
    const { data } = applyNamaMingguPatch(first, '2026-W36', { pembimbing: 'Siti' })
    expect(data.namaPenandaTangan['2026-W36']).toEqual({ mahasiswa: 'Ani', pembimbing: 'Siti' })
  })

  it('menghapus field dengan null atau string kosong', () => {
    const first = applyNamaMingguPatch(defaultLogData(), '2026-W36', {
      mahasiswa: 'Ani',
      pembimbing: 'Siti',
    }).data
    const { data } = applyNamaMingguPatch(first, '2026-W36', { pembimbing: '' })
    expect(data.namaPenandaTangan['2026-W36']).toEqual({ mahasiswa: 'Ani' })
  })

  it('membuang minggu bila seluruh field kosong', () => {
    const first = applyNamaMingguPatch(defaultLogData(), '2026-W36', { mahasiswa: 'Ani' }).data
    const { data } = applyNamaMingguPatch(first, '2026-W36', { mahasiswa: null })
    expect(data.namaPenandaTangan['2026-W36']).toBeUndefined()
  })

  it('mengabaikan weekId kosong', () => {
    const { changed } = applyNamaMingguPatch(defaultLogData(), '   ', { mahasiswa: 'Ani' })
    expect(changed).toEqual([])
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
