import { describe, expect, it } from 'vitest'
import { BULAN, BULAN_SHORT, HARI, isLocale, LOCALES } from './locale'
import { en } from './messages/en'
import { id } from './messages/id'
import { catalogFor, interpolate, missingKeys, translate } from './translate'

/**
 * Mesin terjemahan (AGENTS.md bagian 21).
 *
 * Yang paling penting diuji: kedua katalog punya key yang persis sama, sehingga tidak ada
 * pesan yang tertinggal saat menambah bahasa.
 */

describe('katalog pesan', () => {
  it('bahasa Indonesia dan Inggris punya key yang persis sama', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(id).sort())
  })

  it('tidak ada key yang kosong pada kedua katalog', () => {
    for (const catalog of [id, en]) {
      for (const [key, message] of Object.entries(catalog)) {
        const texts = typeof message === 'string' ? [message] : [message.one, message.other]
        for (const text of texts) {
          expect(`${key}=${text}`.endsWith('=')).toBe(false)
        }
      }
    }
  })

  it('tidak ada key yang belum diterjemahkan', () => {
    for (const locale of LOCALES) {
      expect(missingKeys(locale)).toEqual([])
    }
  })

  it('setiap pesan jamak punya bentuk one dan other', () => {
    for (const catalog of [id, en]) {
      for (const message of Object.values(catalog)) {
        if (typeof message === 'string') continue
        expect(message.one).toBeTruthy()
        expect(message.other).toBeTruthy()
      }
    }
  })
})

describe('translate', () => {
  it('menerjemahkan key sederhana sesuai bahasa', () => {
    expect(translate('id', 'nav.pengaturan')).toBe('Pengaturan')
    expect(translate('en', 'nav.pengaturan')).toBe('Settings')
  })

  it('mengganti placeholder bernama', () => {
    expect(translate('id', 'status.versi', { versi: '1.2.3' })).toBe('logman v1.2.3')
    expect(translate('en', 'validasi.lompatKe', { tanggal: '5 Jan 2026' })).toBe(
      'Jump to row 5 Jan 2026',
    )
  })

  it('membiarkan placeholder yang tidak punya nilai', () => {
    expect(translate('en', 'logbook.gagalMemuat')).toContain('{pesan}')
  })

  it('memilih bentuk jamak bahasa Inggris berdasarkan count', () => {
    expect(translate('en', 'validasi.belumLengkap', { count: 1, n: 1 })).toBe(
      '1 day is missing an activity or a reason',
    )
    expect(translate('en', 'validasi.belumLengkap', { count: 3, n: 3 })).toBe(
      '3 days are missing an activity or a reason',
    )
  })

  it('bahasa Indonesia memakai teks yang sama untuk kedua bentuk jamak', () => {
    const satu = translate('id', 'validasi.belumLengkap', { count: 1, n: 1 })
    const banyak = translate('id', 'validasi.belumLengkap', { count: 5, n: 5 })
    expect(satu).toBe('1 hari belum punya kegiatan atau alasan')
    expect(banyak).toBe('5 hari belum punya kegiatan atau alasan')
  })
})

describe('interpolate', () => {
  it('mengganti beberapa placeholder sekaligus', () => {
    expect(interpolate('{a} dan {b}', { a: 'satu', b: 'dua' })).toBe('satu dan dua')
  })

  it('mengembalikan template apa adanya tanpa vars', () => {
    expect(interpolate('{a}')).toBe('{a}')
  })
})

describe('catalogFor', () => {
  it('mengembalikan katalog sesuai bahasa', () => {
    expect(catalogFor('id')).toBe(id)
    expect(catalogFor('en')).toBe(en)
  })
})

describe('data tanggal per bahasa', () => {
  it('menyediakan tujuh nama hari untuk setiap bahasa', () => {
    for (const locale of LOCALES) {
      expect(HARI[locale]).toHaveLength(7)
      expect(BULAN[locale]).toHaveLength(12)
      expect(BULAN_SHORT[locale]).toHaveLength(12)
    }
  })

  it('memakai nama berbeda antara Indonesia dan Inggris', () => {
    expect(HARI.id[1]).toBe('Senin')
    expect(HARI.en[1]).toBe('Monday')
    expect(BULAN.en[8]).toBe('September')
    expect(BULAN.id[8]).toBe('September')
    expect(BULAN_SHORT.en[7]).toBe('Aug')
    expect(BULAN_SHORT.id[7]).toBe('Agu')
  })
})

describe('isLocale', () => {
  it('hanya menerima kode bahasa yang didaftarkan', () => {
    expect(isLocale('id')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('jp')).toBe(false)
    expect(isLocale(null)).toBe(false)
  })
})
