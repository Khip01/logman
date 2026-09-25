/**
 * Perender HTML dari blok rich text, untuk PDF di server (AGENTS.md bagian 11.6).
 *
 * Murni dan tanpa DOM, sehingga hasilnya sama persis dengan yang dilihat di layar dan
 * dapat diuji tanpa browser.
 *
 * KEAMANAN: SELURUH teks keluar melalui `escapeHtml` sebelum masuk ke markup. Isi Log Book
 * berasal dari ketikan user, jadi tanpa pelolosan, teks seperti `<script>` akan ikut
 * terkirim ke halaman cetak. Parser tidak pernah menghasilkan HTML mentah; perender inilah
 * satu-satunya tempat yang menyusun markup, dan ia selalu meloloskan teksnya lebih dulu.
 */
import { type InlineNode, parseBlocks, type RichBlock } from './richText'

/** Meloloskan karakter yang bermakna di HTML. Urutan penggantian penting: `&` lebih dulu. */
export function escapeHtml(teks: string): string {
  return teks
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function nodesToHtml(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.kind === 'teks') return escapeHtml(node.text ?? '')
      const isi = nodesToHtml(node.children ?? [])
      return node.style === 'tebal' ? `<strong>${isi}</strong>` : `<em>${isi}</em>`
    })
    .join('')
}

function blockToHtml(block: RichBlock): string {
  const isi = nodesToHtml(block.nodes)
  if (block.type === 'judul') {
    return `<div class="rt-judul rt-judul-${block.level}">${isi}</div>`
  }
  // Baris kosong tetap diberi tinggi supaya jarak antar paragraf yang disengaja tidak
  // hilang. Tanpa ini, baris kosong runtuh dan seluruh paragraf menempel.
  if (isi === '') return '<div class="rt-kosong">&nbsp;</div>'
  return `<div class="rt-baris">${isi}</div>`
}

/**
 * Mengubah teks berpenanda menjadi HTML siap tempel di dokumen cetak.
 *
 * Selalu mengembalikan satu atau lebih elemen blok; tidak pernah teks telanjang, supaya
 * pemanggil tidak perlu memikirkan pembungkusnya.
 */
export function richTextToHtml(teks: string): string {
  if (teks === '') return ''
  return parseBlocks(teks).map(blockToHtml).join('')
}
