import { describe, expect, it } from 'vitest'
import { penandaUntukTombol, toggleInlineWrap } from './richTextShortcut'

describe('toggleInlineWrap', () => {
  it('membungkus teks terpilih', () => {
    // "Kegiatan rapat" dengan "rapat" terpilih (indeks 9 sampai 14).
    const hasil = toggleInlineWrap('Kegiatan rapat', 9, 14, '**')
    expect(hasil.teks).toBe('Kegiatan **rapat**')
    expect(hasil.teks.slice(hasil.mulai, hasil.akhir)).toBe('rapat')
  })

  it('membungkus dengan penanda miring', () => {
    const hasil = toggleInlineWrap('Kegiatan rapat', 9, 14, '*')
    expect(hasil.teks).toBe('Kegiatan *rapat*')
  })

  it('melepas penanda bila pilihan sudah terbungkus di dalam', () => {
    const hasil = toggleInlineWrap('Kegiatan **rapat**', 11, 16, '**')
    expect(hasil.teks).toBe('Kegiatan rapat')
  })

  it('melepas penanda bila pilihan ikut menyorot penandanya', () => {
    const hasil = toggleInlineWrap('Kegiatan **rapat**', 9, 18, '**')
    expect(hasil.teks).toBe('Kegiatan rapat')
    expect(hasil.teks.slice(hasil.mulai, hasil.akhir)).toBe('rapat')
  })

  it('menyisipkan penanda kosong dan menaruh kursor di tengah saat tanpa pilihan', () => {
    const hasil = toggleInlineWrap('Kegiatan ', 9, 9, '**')
    expect(hasil.teks).toBe('Kegiatan ****')
    expect(hasil.mulai).toBe(11)
    expect(hasil.akhir).toBe(11)
  })

  it('membungkus pilihan di awal dan akhir teks', () => {
    expect(toggleInlineWrap('rapat', 0, 5, '**').teks).toBe('**rapat**')
  })

  /*
   * Pilihan yang dibalik (akhir sebelum mulai) tetap harus ditangani, karena beberapa
   * browser melaporkan posisi seleksi dari kanan ke kiri saat user menyorot ke belakang.
   */
  it('menormalkan pilihan yang dibalik', () => {
    const hasil = toggleInlineWrap('Kegiatan rapat', 14, 9, '**')
    expect(hasil.teks).toBe('Kegiatan **rapat**')
  })

  it('menjepit posisi di luar batas teks', () => {
    const hasil = toggleInlineWrap('abc', -5, 99, '**')
    expect(hasil.teks).toBe('**abc**')
  })

  it('mengembalikan teks yang sama bila rentangnya kosong di ujung', () => {
    const hasil = toggleInlineWrap('abc', 3, 3, '*')
    expect(hasil.teks).toBe('abc**')
    expect(hasil.mulai).toBe(4)
  })

  /*
   * Penanda tebal dan miring sama-sama memakai bintang, jadi pelepasan harus memakai
   * panjang penanda yang benar. Miring tidak boleh salah melepas satu bintang dari tebal.
   */
  it('tidak salah melepas penanda tebal memakai penanda miring', () => {
    const hasil = toggleInlineWrap('**rapat**', 2, 7, '*')
    expect(hasil.teks).toBe('***rapat***')
  })
})

describe('penandaUntukTombol', () => {
  it('memetakan b ke tebal dan i ke miring', () => {
    expect(penandaUntukTombol('b')).toBe('**')
    expect(penandaUntukTombol('i')).toBe('*')
    expect(penandaUntukTombol('B')).toBe('**')
    expect(penandaUntukTombol('I')).toBe('*')
  })

  it('mengembalikan null untuk tombol lain', () => {
    expect(penandaUntukTombol('u')).toBeNull()
    expect(penandaUntukTombol('Enter')).toBeNull()
  })
})
