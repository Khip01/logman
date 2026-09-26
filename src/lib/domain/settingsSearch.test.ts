import { describe, expect, it } from 'vitest'
import { LOCALES } from '@/lib/i18n/locale'
import { id } from '@/lib/i18n/messages/id'
import { translate } from '@/lib/i18n/translate'
import {
  SETTINGS_SECTIONS,
  type SettingsSearchResult,
  type SettingsSectionId,
  searchSettings,
  settingsSectionDomId,
  settingsSectionIcon,
} from './settingsSearch'

/**
 * Pencarian Pengaturan (AGENTS.md bagian 22).
 *
 * Yang paling penting diuji: urutan dua lapis (semua hasil judul mendahului hasil
 * konten), rentang highlight yang benar, dan bahwa setiap teks di registry benar-benar
 * ada di katalog sehingga tidak ada saran yang tampil sebagai placeholder mentah.
 */

/** Mencari saran pertama yang snippetnya memenuhi syarat, atau melempar bila tidak ada. */
function cariSnippet(
  hasil: SettingsSearchResult[],
  predicate: (snippet: string) => boolean,
): SettingsSearchResult {
  const found = hasil.find((item) => predicate(item.snippet))
  if (!found) throw new Error('Saran dengan snippet yang dicari tidak ditemukan')
  return found
}

/** Semua key yang dipakai registry, judul maupun konten. */
const REGISTRY_KEYS = [
  ...SETTINGS_SECTIONS.map((section) => section.titleKey),
  ...SETTINGS_SECTIONS.flatMap((section) => [...section.contentKeys]),
]

describe('registry seksi', () => {
  it('mencakup sepuluh seksi halaman Pengaturan', () => {
    expect(SETTINGS_SECTIONS.map((section) => section.id)).toEqual([
      'profil',
      'tema',
      'tier',
      'bahasa',
      'jam-default',
      'alasan',
      'penanda-tangan',
      'hari-luar-bulan',
      'dokumen',
      'tampilan-dev',
    ])
  })

  it('tidak punya id seksi yang duplikat', () => {
    const ids = SETTINGS_SECTIONS.map((section) => section.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('memberi id DOM yang stabil dan berbeda', () => {
    const domIds = SETTINGS_SECTIONS.map((section) => settingsSectionDomId(section.id))
    expect(domIds).toContain('settings-section-jam-default')
    expect(new Set(domIds).size).toBe(domIds.length)
  })

  it('semua key registry ada di katalog bahasa Indonesia', () => {
    for (const key of REGISTRY_KEYS) {
      expect(id[key]).toBeDefined()
    }
  })

  it('semua key registry punya terjemahan di setiap bahasa', () => {
    for (const locale of LOCALES) {
      for (const key of REGISTRY_KEYS) {
        expect(translate(locale, key)).not.toBe('')
      }
    }
  })

  it('tidak memakai key bersifat jamak, karena snippet ditampilkan apa adanya', () => {
    for (const key of REGISTRY_KEYS) {
      expect(typeof id[key]).toBe('string')
    }
  })

  it('tidak ada potongan yang menyisakan placeholder kurawal', () => {
    for (const locale of LOCALES) {
      for (const key of REGISTRY_KEYS) {
        expect(translate(locale, key)).not.toContain('{')
      }
    }
  })

  it('memberi ikon untuk setiap seksi', () => {
    for (const section of SETTINGS_SECTIONS) {
      expect(settingsSectionIcon(section.id)).toBe(section.icon)
    }
  })

  it('melempar untuk seksi yang tidak dikenal', () => {
    expect(() => settingsSectionIcon('tidak-ada' as SettingsSectionId)).toThrow()
  })
})

describe('identitas saran', () => {
  /*
   * Regresi penting. Dulu komponen menyusun key React dari `sectionId` dan `match.start`,
   * dan itu menghasilkan key DUPLIKAT karena banyak saran mulai cocok di indeks yang sama
   * (mis. "Nama mahasiswa", "Nama lengkap", "Nama Mitra Industri"). Key duplikat membuat
   * React tidak membuang saran lama, sehingga hasil pencarian sebelumnya menyantol di atas
   * hasil baru saat user mengetik atau menghapus ketikan.
   */
  it('memberi key yang unik untuk setiap saran, termasuk saat banyak match mulai di indeks 0', () => {
    const queries = ['', 'a', 'aa', 'an', 'ma', 'PDF', 'template', 'dokumen', 'id']
    for (const query of queries) {
      const hasil = searchSettings(query, 'id')
      const keys = hasil.map((item) => item.key)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('memberi key yang unik pada kedua bahasa', () => {
    for (const locale of LOCALES) {
      for (const query of ['a', 'e', 'o', '']) {
        const keys = searchSettings(query, locale).map((item) => item.key)
        expect(new Set(keys).size).toBe(keys.length)
      }
    }
  })

  it('key tidak berubah saat query berubah, selama saran yang sama masih muncul', () => {
    const sebelum = searchSettings('Nama', 'id').find((item) => item.sectionId === 'profil')
    const sesudah = searchSettings('Nama m', 'id').find((item) => item.sectionId === 'profil')
    expect(sebelum?.key).toBe(sesudah?.key)
  })

  it('key memakai key pesan sebagai identitas lapis konten', () => {
    const hasil = searchSettings('PDF', 'id')
    const konten = hasil.find((item) => item.sectionId === 'dokumen')
    expect(konten?.key.startsWith('content:dokumen:')).toBe(true)
  })
})

describe('query kosong', () => {
  it('menampilkan seluruh menu tanpa highlight', () => {
    const hasil = searchSettings('', 'id')
    expect(hasil).toHaveLength(SETTINGS_SECTIONS.length)
    expect(hasil.every((item) => item.kind === 'title')).toBe(true)
    expect(hasil.every((item) => item.snippet === '')).toBe(true)
    expect(hasil.every((item) => item.match.length === 0)).toBe(true)
  })

  it('memperlakukan spasi saja seperti query kosong', () => {
    expect(searchSettings('   ', 'id')).toHaveLength(SETTINGS_SECTIONS.length)
  })

  it('memakai judul sesuai bahasa', () => {
    expect(searchSettings('', 'id')[0]?.sectionTitle).toBe('Profil')
    expect(searchSettings('', 'en')[0]?.sectionTitle).toBe('Profile')
  })
})

describe('lapis judul', () => {
  it('menemukan Jam Default dari kata jam', () => {
    const hasil = searchSettings('jam', 'id')
    const judul = hasil.filter((item) => item.kind === 'title')
    expect(judul).toHaveLength(1)
    expect(judul[0]?.sectionId).toBe('jam-default')
    expect(hasil[0]?.sectionId).toBe('jam-default')
    expect(judul[0]?.match).toEqual({ start: 0, length: 3 })
  })

  it('tidak peka huruf besar kecil', () => {
    expect(searchSettings('BAHASA', 'id')[0]?.sectionId).toBe('bahasa')
    expect(searchSettings('bahasa', 'id')[0]?.sectionId).toBe('bahasa')
  })

  it('seksi yang cocok di judul tidak diulang di lapis konten', () => {
    const hasil = searchSettings('alasan', 'id')
    expect(hasil.filter((item) => item.sectionId === 'alasan')).toHaveLength(1)
    expect(hasil[0]?.kind).toBe('title')
  })

  it('memakai judul bahasa Inggris saat locale en', () => {
    expect(searchSettings('paper', 'en')[0]?.sectionId).toBe('dokumen')
    expect(searchSettings('language', 'en')[0]?.sectionId).toBe('bahasa')
  })
})

describe('lapis konten', () => {
  it('menemukan seksi Dokumen dan Ekspor dari kata PDF', () => {
    const hasil = searchSettings('PDF', 'id')
    const konten = hasil.filter((item) => item.kind === 'content')
    expect(konten.length).toBeGreaterThan(0)
    // Beberapa seksi menyebut PDF (mis. deskripsi bahasa). Yang penting: seksi Dokumen
    // dan Ekspor ada di daftar, dengan judul yang benar.
    const dokumen = konten.find((item) => item.sectionId === 'dokumen')
    expect(dokumen).toBeDefined()
    expect(dokumen?.sectionTitle).toBe('Dokumen dan Ekspor')
    expect(dokumen?.snippet.toLowerCase()).toContain('pdf')
    // Hasil memakai urutan seksi di halaman, jadi seksi Bahasa muncul lebih dulu.
    expect(konten[0]?.sectionId).toBe('bahasa')
  })

  it('menyorot tepat kata yang cocok di dalam snippet', () => {
    const hasil = searchSettings('PDF', 'id')
    const target = cariSnippet(hasil, (snippet) => snippet.toLowerCase().includes('pdf'))
    expect(
      target.snippet
        .slice(target.match.start, target.match.start + target.match.length)
        .toLowerCase(),
    ).toBe('pdf')
  })

  it('menampilkan rentang yang tetap benar walau snippet dipotong', () => {
    const hasil = searchSettings('template', 'id')
    const target = cariSnippet(hasil, (snippet) => snippet.startsWith('...'))
    expect(target.snippet.slice(target.match.start, target.match.start + target.match.length)).toBe(
      'template',
    )
  })

  it('membedakan judul baris antara lapis judul dan lapis konten', () => {
    const judul = searchSettings('bahasa', 'id')[0]
    const konten = searchSettings('antarmuka', 'id').find((item) => item.kind === 'content')

    expect(judul?.kind).toBe('title')
    expect(judul?.snippet).toBe('')
    expect(konten?.kind).toBe('content')
    expect(konten?.sectionTitle).toBe('Bahasa')
    expect(konten?.snippet).not.toBe('')
  })
})

describe('urutan hasil', () => {
  it('seluruh hasil lapis judul mendahului seluruh hasil lapis konten', () => {
    // Kata "dokumen" muncul di judul seksi Dokumen dan Ekspor sekaligus di beberapa isi.
    const hasil = searchSettings('dokumen', 'id')
    const kindUrutan = hasil.map((item) => item.kind)
    const indeksKontenPertama = kindUrutan.indexOf('content')
    if (indeksKontenPertama >= 0) {
      expect(kindUrutan.slice(0, indeksKontenPertama).every((kind) => kind === 'title')).toBe(true)
      expect(kindUrutan.slice(indeksKontenPertama).every((kind) => kind === 'content')).toBe(true)
    }
  })

  it('mengurutkan hasil sesuai urutan seksi di halaman', () => {
    const hasil = searchSettings('', 'id')
    const urutan = SETTINGS_SECTIONS.map((section) => section.id)
    const hasilUrutan = hasil.map((item) => item.sectionId)
    expect(hasilUrutan).toEqual(urutan)
  })
})

describe('tanpa hasil', () => {
  it('mengembalikan daftar kosong untuk kata yang tidak ada', () => {
    expect(searchSettings('zzzz tidak ada', 'id')).toEqual([])
  })

  it('tidak melempar error untuk karakter khusus', () => {
    expect(() => searchSettings('([a-z]+)+$', 'id')).not.toThrow()
  })
})
