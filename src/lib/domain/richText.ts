/**
 * Parser penanda teks sederhana untuk kolom Kegiatan (AGENTS.md bagian 11.6).
 *
 * Mendukung tiga penanda, sengaja dibatasi:
 * - `**tebal**`
 * - `*miring*`
 * - `# judul`, `## judul`, `### judul` (judul selalu memakai seluruh baris)
 *
 * Mengapa parser sendiri, bukan pustaka markdown: yang dibutuhkan hanya tiga penanda, dan
 * pustaka markdown membawa puluhan fitur yang tidak dipakai, menambah berat bundle, dan
 * membuka permukaan serangan lewat HTML mentah. Parser ini MURNI, tanpa I/O dan tanpa DOM,
 * sehingga hasilnya identik di layar, di halaman cetak, dan di PDF server.
 *
 * ATURAN PENTING: parser ini TIDAK PERNAH menghasilkan HTML. Keluarannya adalah struktur
 * data, dan perender yang mengubahnya menjadi elemen. Dengan begitu tidak ada jalan masuk
 * untuk menyisipkan skrip dari isi Log Book.
 *
 * Teks yang tidak memenuhi pola penanda dibiarkan apa adanya, jadi isi lama yang memakai
 * tanda bintang atau tanda pagar biasa tetap tampil seperti semula.
 */

/** Jenis blok pada satu baris. Judul memakai seluruh baris, paragraf selebihnya. */
export type BlockType = 'judul' | 'paragraf'

/** Gaya sebaris di dalam sebuah blok. */
export type InlineStyle = 'tebal' | 'miring'

export interface InlineNode {
  /** Jenis potongan: teks biasa atau simpul bergaya yang berisi anak. */
  kind: 'teks' | 'gaya'
  /** Isi teks. Hanya ada bila `kind === 'teks'`. */
  text?: string
  /** Gaya yang diterapkan. Hanya ada bila `kind === 'gaya'`. */
  style?: InlineStyle
  /** Anak simpul bergaya. Hanya ada bila `kind === 'gaya'`. */
  children?: InlineNode[]
}

export interface RichBlock {
  type: BlockType
  /** Tingkat judul 1 sampai 3. Hanya ada bila `type === 'judul'`. */
  level?: number
  /** Isi baris, sudah dipecah menjadi potongan bergaya. */
  nodes: InlineNode[]
}

/** Tingkat judul tertinggi yang didukung. Empat tanda pagar atau lebih bukan judul. */
const POLA_JUDUL = /^(#{1,3})\s+(.*)$/

/**
 * Memeriksa apakah sebuah baris adalah judul.
 *
 * Pola: satu sampai tiga tanda pagar, WAJIB diikuti spasi, lalu isi. Spasi wajib supaya
 * tanda pagar yang dipakai sebagai hiasan (misalnya `#Aktifitas` atau `###`) tidak
 * berubah menjadi judul. Empat tanda pagar atau lebih juga bukan judul, karena polanya
 * hanya menerima sampai tiga.
 */
export function parseJudul(baris: string): { level: number; teks: string } | null {
  const cocok = POLA_JUDUL.exec(baris)
  if (!cocok) return null
  const level = (cocok[1] ?? '').length
  const teks = (cocok[2] ?? '').trim()
  // Judul kosong (hanya penanda) tidak ada gunanya dan membingungkan, jadi bukan judul.
  if (teks === '') return null
  return { level, teks }
}

/**
 * Memeriksa apakah sebuah bintang menutup gaya miring.
 *
 * Bintang pembuka miring dianggap sah hanya bila diikuti karakter non-spasi. Aturan ini
 * mencegah teks seperti "2 * 3 * 4" berubah menjadi miring, karena bintang di situ
 * diapit spasi dan memang bermakna perkalian.
 */
function bolehBukaMiring(teks: string, i: number): boolean {
  const sesudah = teks[i + 1]
  return sesudah !== undefined && sesudah !== ' ' && sesudah !== '\t'
}

function bolehTutupMiring(teks: string, i: number): boolean {
  const sebelum = teks[i - 1]
  return sebelum !== undefined && sebelum !== ' ' && sebelum !== '\t'
}

/**
 * Memecah satu baris menjadi potongan bertanda gaya.
 *
 * Diproses kiri ke kanan dalam satu lintasan. Penanda yang tidak lengkap (misalnya cuma
 * ada `**` tanpa penutup) dibiarkan sebagai teks biasa, supaya saat user masih mengetik
 * teksnya tidak berkedip berubah bentuk.
 */
export function parseInline(teks: string): InlineNode[] {
  const hasil: InlineNode[] = []
  let buffer = ''
  let i = 0

  /** Menutup buffer teks biasa menjadi simpul, bila berisi. */
  function flush(): void {
    if (buffer !== '') {
      hasil.push({ kind: 'teks', text: buffer })
      buffer = ''
    }
  }

  while (i < teks.length) {
    /*
     * Tebal DAN miring: `***...***`.
     *
     * Diperiksa SEBELUM `**`, karena `***teks***` juga cocok dengan pola tebal. Tanpa
     * urutan ini, tiga bintang dirender sebagai tebal yang berisi bintang lepas, dan
     * hasilnya berantakan. Tiga bintang muncul secara alami saat user menekan Ctrl+I pada
     * teks yang sudah tebal, jadi kasus ini memang harus didukung.
     */
    if (teks.startsWith('***', i)) {
      const tutup = teks.indexOf('***', i + 3)
      const isi = tutup === -1 ? '' : teks.slice(i + 3, tutup)
      if (tutup !== -1 && isi !== '') {
        flush()
        hasil.push({
          kind: 'gaya',
          style: 'tebal',
          children: [{ kind: 'gaya', style: 'miring', children: parseInline(isi) }],
        })
        i = tutup + 3
        continue
      }
    }

    // Tebal: `**...**` dengan isi tidak kosong.
    if (teks.startsWith('**', i)) {
      const tutup = teks.indexOf('**', i + 2)
      const isi = tutup === -1 ? '' : teks.slice(i + 2, tutup)
      if (tutup !== -1 && isi !== '' && bolehBukaMiring(teks, i)) {
        flush()
        hasil.push({ kind: 'gaya', style: 'tebal', children: parseInline(isi) })
        i = tutup + 2
        continue
      }
    }

    // Miring: `*...*` dengan isi tidak kosong dan tidak diapit spasi sembarangan.
    if (teks[i] === '*' && bolehBukaMiring(teks, i)) {
      const tutup = teks.indexOf('*', i + 1)
      const isi = tutup === -1 ? '' : teks.slice(i + 1, tutup)
      if (tutup !== -1 && isi !== '' && bolehTutupMiring(teks, tutup)) {
        flush()
        hasil.push({ kind: 'gaya', style: 'miring', children: parseInline(isi) })
        i = tutup + 1
        continue
      }
    }

    buffer += teks[i]
    i += 1
  }

  flush()
  return hasil
}

/**
 * Mengubah teks multi-baris menjadi daftar blok siap render.
 *
 * Baris kosong dipertahankan sebagai paragraf kosong supaya jarak antar paragraf yang
 * sengaja dibuat user tidak hilang. Baris dengan spasi saja juga dianggap kosong.
 */
export function parseBlocks(teks: string): RichBlock[] {
  if (teks === '') return []

  return teks.split('\n').map((baris): RichBlock => {
    const judul = parseJudul(baris)
    if (judul) {
      return { type: 'judul', level: judul.level, nodes: parseInline(judul.teks) }
    }
    return { type: 'paragraf', nodes: parseInline(baris) }
  })
}

/**
 * Mengambil teks polos dari daftar blok, tanpa penanda.
 *
 * Dipakai untuk ringkasan dan pencarian teks, bukan untuk menampilkan.
 */
export function blocksToPlainText(blok: RichBlock[]): string {
  function tukar(nodes: InlineNode[]): string {
    return nodes.map((n) => (n.kind === 'teks' ? (n.text ?? '') : tukar(n.children ?? []))).join('')
  }
  return blok.map((b) => tukar(b.nodes)).join('\n')
}
