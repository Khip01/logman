import { describe, expect, it } from 'vitest'
import { escapeHtml, richTextToHtml } from './richTextHtml'

describe('escapeHtml', () => {
  it('meloloskan karakter yang bermakna di HTML', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    )
  })

  it('meloloskan ampersand lebih dulu supaya tidak diloloskan dua kali', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })

  it('meloloskan kutip tunggal', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s')
  })
})

describe('richTextToHtml', () => {
  it('membungkus baris biasa dalam blok', () => {
    expect(richTextToHtml('Kegiatan')).toBe('<div class="rt-baris">Kegiatan</div>')
  })

  it('mengubah penanda tebal dan miring menjadi tag semantik', () => {
    expect(richTextToHtml('**tebal** dan *miring*')).toBe(
      '<div class="rt-baris"><strong>tebal</strong> dan <em>miring</em></div>',
    )
  })

  it('memberi kelas judul sesuai tingkatnya', () => {
    expect(richTextToHtml('# Satu')).toBe('<div class="rt-judul rt-judul-1">Satu</div>')
    expect(richTextToHtml('## Dua')).toBe('<div class="rt-judul rt-judul-2">Dua</div>')
    expect(richTextToHtml('### Tiga')).toBe('<div class="rt-judul rt-judul-3">Tiga</div>')
  })

  it('memberi tinggi pada baris kosong agar jarak paragraf tidak hilang', () => {
    expect(richTextToHtml('satu\n\ndua')).toBe(
      '<div class="rt-baris">satu</div><div class="rt-kosong">&nbsp;</div><div class="rt-baris">dua</div>',
    )
  })

  it('mengembalikan string kosong untuk teks kosong', () => {
    expect(richTextToHtml('')).toBe('')
  })

  /*
   * KEAMANAN: isi Log Book berasal dari ketikan user dan ikut tercetak. Teks yang menyerupai
   * tag HTML WAJIB keluar sebagai teks, bukan sebagai elemen.
   */
  it('tidak pernah meloloskan tag HTML dari isi user', () => {
    const hasil = richTextToHtml('<img src=x onerror=alert(1)>')
    expect(hasil).not.toContain('<img')
    expect(hasil).toContain('&lt;img')
  })

  it('tidak meloloskan tag di dalam penanda tebal', () => {
    const hasil = richTextToHtml('**<b>nakal</b>**')
    expect(hasil).toContain('<strong>&lt;b&gt;nakal&lt;/b&gt;</strong>')
  })

  it('menerapkan penanda pada baris judul juga', () => {
    expect(richTextToHtml('# Judul **tebal**')).toBe(
      '<div class="rt-judul rt-judul-1">Judul <strong>tebal</strong></div>',
    )
  })
})
