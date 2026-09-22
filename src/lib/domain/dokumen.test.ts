import { describe, expect, it } from 'vitest'
import {
  CONTENT_SCALES,
  docFontSizePx,
  FONT_DOKUMEN_STACK,
  isContentScale,
  isFontDokumen,
  parseContentScale,
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
