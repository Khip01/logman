import { describe, expect, it } from 'vitest'
import {
  CONTENT_SCALES,
  docFontSizePx,
  FONT_DOKUMEN_STACK,
  HARI_LUAR_BULAN_LABEL_KEY,
  HARI_LUAR_BULAN_LIST,
  isContentScale,
  isFontDokumen,
  isHariLuarBulan,
  parseContentScale,
  parseHariLuarBulan,
} from './dokumen'

describe('isFontDokumen', () => {
  it('hanya menerima times dan arial', () => {
    expect(isFontDokumen('times')).toBe(true)
    expect(isFontDokumen('arial')).toBe(true)
    expect(isFontDokumen('calibri')).toBe(false)
    expect(isFontDokumen(null)).toBe(false)
  })
})

describe('FONT_DOKUMEN_STACK', () => {
  it('memuat Times untuk times dan sans untuk arial', () => {
    expect(FONT_DOKUMEN_STACK.times).toContain('Times New Roman')
    expect(FONT_DOKUMEN_STACK.arial).toContain('Arial')
    expect(FONT_DOKUMEN_STACK.arial).toContain('sans-serif')
  })
})

describe('isContentScale', () => {
  it('menerima nilai yang terdaftar saja', () => {
    for (const value of CONTENT_SCALES) expect(isContentScale(value)).toBe(true)
    expect(isContentScale(1.2)).toBe(false)
    expect(isContentScale('1')).toBe(false)
  })
})

describe('parseContentScale', () => {
  it('menerima nilai terdaftar', () => {
    expect(parseContentScale(1.15)).toBe(1.15)
  })

  it('menerima angka wajar di luar daftar agar konfigurasi lama tidak hilang', () => {
    expect(parseContentScale(1.1)).toBe(1.1)
  })

  it('jatuh ke fallback untuk nilai di luar rentang atau bukan angka', () => {
    expect(parseContentScale(3)).toBe(1)
    expect(parseContentScale(0.1)).toBe(1)
    expect(parseContentScale('besar')).toBe(1)
    expect(parseContentScale(null, 1.15)).toBe(1.15)
  })
})

describe('docFontSizePx', () => {
  it('16 px pada skala 1 dan membesar proporsional', () => {
    expect(docFontSizePx(1)).toBe(16)
    expect(docFontSizePx(1.15)).toBe(18.4)
    expect(docFontSizePx(1.3)).toBe(20.8)
    expect(docFontSizePx(0.9)).toBe(14.4)
  })
})

describe('isHariLuarBulan', () => {
  it('hanya menerima samarkan dan hapus', () => {
    expect(isHariLuarBulan('samarkan')).toBe(true)
    expect(isHariLuarBulan('hapus')).toBe(true)
    expect(isHariLuarBulan('SAMARKAN')).toBe(false)
    expect(isHariLuarBulan('abu')).toBe(false)
    expect(isHariLuarBulan(null)).toBe(false)
    expect(isHariLuarBulan(0)).toBe(false)
  })
})

describe('parseHariLuarBulan', () => {
  it('mempertahankan nilai yang dikenal', () => {
    expect(parseHariLuarBulan('samarkan', 'hapus')).toBe('samarkan')
    expect(parseHariLuarBulan('hapus', 'samarkan')).toBe('hapus')
  })

  it('jatuh ke fallback untuk data rusak', () => {
    // Fallback wajib dipakai, bukan default tetap, supaya default config tetap punya
    // satu sumber kebenaran.
    expect(parseHariLuarBulan('entah', 'samarkan')).toBe('samarkan')
    expect(parseHariLuarBulan(undefined, 'hapus')).toBe('hapus')
    expect(parseHariLuarBulan('', 'hapus')).toBe('hapus')
  })
})

describe('daftar hari luar bulan', () => {
  it('urutan daftar dipakai untuk urutan kartu di Pengaturan', () => {
    expect(HARI_LUAR_BULAN_LIST).toEqual(['samarkan', 'hapus'])
  })

  it('setiap nilai punya key pesan, dan key-nya ada di katalog', () => {
    for (const mode of HARI_LUAR_BULAN_LIST) {
      expect(HARI_LUAR_BULAN_LABEL_KEY[mode]).toBe(`settings.hariLuarBulan.${mode}`)
    }
  })
})
