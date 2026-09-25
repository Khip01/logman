import { describe, expect, it } from 'vitest'
import { blocksToPlainText, parseBlocks, parseInline, parseJudul } from './richText'

describe('parseJudul', () => {
  it('menerima satu sampai tiga tanda pagar yang diikuti spasi', () => {
    expect(parseJudul('# Judul')).toEqual({ level: 1, teks: 'Judul' })
    expect(parseJudul('## Judul')).toEqual({ level: 2, teks: 'Judul' })
    expect(parseJudul('### Judul')).toEqual({ level: 3, teks: 'Judul' })
  })

  it('memangkas spasi berlebih di dalam judul', () => {
    expect(parseJudul('#    Judul   ')).toEqual({ level: 1, teks: 'Judul' })
  })

  /*
   * Spasi wajib. Tanpa aturan ini, tanda pagar yang dipakai sebagai hiasan biasa akan
   * berubah menjadi judul dan mengubah tampilan data lama secara tak terduga.
   */
  it('menolak tanda pagar tanpa spasi', () => {
    expect(parseJudul('#Aktifitas')).toBeNull()
    expect(parseJudul('###')).toBeNull()
    expect(parseJudul('#### Judul')).toBeNull()
  })

  it('menolak judul kosong', () => {
    expect(parseJudul('# ')).toBeNull()
    expect(parseJudul('##   ')).toBeNull()
  })

  it('menolak baris biasa', () => {
    expect(parseJudul('Kegiatan hari ini')).toBeNull()
    expect(parseJudul('')).toBeNull()
  })
})

describe('parseInline', () => {
  it('mengubah teks biasa menjadi satu simpul teks', () => {
    expect(parseInline('Kegiatan biasa')).toEqual([{ kind: 'teks', text: 'Kegiatan biasa' }])
  })

  it('mengenali tebal', () => {
    expect(parseInline('a **tebal** b')).toEqual([
      { kind: 'teks', text: 'a ' },
      { kind: 'gaya', style: 'tebal', children: [{ kind: 'teks', text: 'tebal' }] },
      { kind: 'teks', text: ' b' },
    ])
  })

  it('mengenali miring', () => {
    expect(parseInline('a *miring* b')).toEqual([
      { kind: 'teks', text: 'a ' },
      { kind: 'gaya', style: 'miring', children: [{ kind: 'teks', text: 'miring' }] },
      { kind: 'teks', text: ' b' },
    ])
  })

  it('mengenali miring di dalam tebal', () => {
    const hasil = parseInline('**tebal *miring* tebal**')
    expect(hasil).toHaveLength(1)
    expect(hasil[0]?.style).toBe('tebal')
    expect(hasil[0]?.children).toContainEqual({
      kind: 'gaya',
      style: 'miring',
      children: [{ kind: 'teks', text: 'miring' }],
    })
  })

  /*
   * Regresi: tanda bintang yang dipakai sebagai perkalian atau hiasan tidak boleh menjadi
   * miring. Pembuka miring wajib diikuti karakter non-spasi.
   */
  it('membiarkan bintang yang diapit spasi sebagai teks biasa', () => {
    expect(parseInline('2 * 3 * 4')).toEqual([{ kind: 'teks', text: '2 * 3 * 4' }])
  })

  it('membiarkan penanda yang belum ditutup sebagai teks biasa', () => {
    expect(parseInline('**belum ditutup')).toEqual([{ kind: 'teks', text: '**belum ditutup' }])
    expect(parseInline('*belum ditutup')).toEqual([{ kind: 'teks', text: '*belum ditutup' }])
  })

  it('membiarkan penanda kosong sebagai teks biasa', () => {
    expect(parseInline('****')).toEqual([{ kind: 'teks', text: '****' }])
    expect(parseInline('**')).toEqual([{ kind: 'teks', text: '**' }])
  })

  it('memperlakukan teks kosong sebagai tanpa simpul', () => {
    expect(parseInline('')).toEqual([])
  })

  it('mengenali lebih dari satu penanda dalam satu baris', () => {
    const hasil = parseInline('**satu** lalu *dua*')
    const gaya = hasil.filter((n) => n.kind === 'gaya').map((n) => n.style)
    expect(gaya).toEqual(['tebal', 'miring'])
  })
})

describe('parseBlocks', () => {
  it('memisahkan judul dan paragraf per baris', () => {
    const blok = parseBlocks('# Judul\nIsi paragraf')
    expect(blok).toHaveLength(2)
    expect(blok[0]).toMatchObject({ type: 'judul', level: 1 })
    expect(blok[1]?.type).toBe('paragraf')
  })

  it('mempertahankan baris kosong sebagai paragraf kosong', () => {
    const blok = parseBlocks('satu\n\ndua')
    expect(blok).toHaveLength(3)
    expect(blok[1]?.nodes).toEqual([])
  })

  it('mengembalikan daftar kosong untuk teks kosong', () => {
    expect(parseBlocks('')).toEqual([])
  })

  /*
   * Data lama memakai pemisah seperti `=== Teks ===` dan `# Aktifitas:`. Yang pertama
   * harus tetap teks biasa, yang kedua memang menjadi judul sesuai keputusan pemilik.
   */
  it('memperlakukan pemisah sama-dengan sebagai teks biasa', () => {
    const blok = parseBlocks('=== Text/Text+Image to Video ===')
    expect(blok[0]?.type).toBe('paragraf')
    expect(blok[0]?.nodes).toEqual([{ kind: 'teks', text: '=== Text/Text+Image to Video ===' }])
  })
})

describe('blocksToPlainText', () => {
  it('membuang penanda dan menyatukan baris', () => {
    const teks = '# Judul\n**tebal** dan *miring*'
    expect(blocksToPlainText(parseBlocks(teks))).toBe('Judul\ntebal dan miring')
  })
})

/*
 * Regresi: tiga bintang muncul saat user menekan Ctrl+I pada teks yang sudah tebal.
 * Tanpa dukungan `***`, hasilnya dirender sebagai tebal berisi bintang lepas dan rusak.
 */
describe('parseInline dengan tiga bintang', () => {
  it('mengenali tebal dan miring sekaligus', () => {
    const hasil = parseInline('***penting***')
    expect(hasil).toHaveLength(1)
    expect(hasil[0]?.style).toBe('tebal')
    expect(hasil[0]?.children).toEqual([
      { kind: 'gaya', style: 'miring', children: [{ kind: 'teks', text: 'penting' }] },
    ])
  })

  it('mengenali tiga bintang di tengah kalimat', () => {
    const hasil = parseInline('Perlu ***caching*** di klien')
    expect(hasil[0]).toEqual({ kind: 'teks', text: 'Perlu ' })
    expect(hasil[1]?.style).toBe('tebal')
    expect(hasil[2]).toEqual({ kind: 'teks', text: ' di klien' })
  })

  it('membiarkan tiga bintang yang tidak ditutup sebagai teks biasa', () => {
    expect(parseInline('***belum ditutup')).toEqual([{ kind: 'teks', text: '***belum ditutup' }])
  })
})
