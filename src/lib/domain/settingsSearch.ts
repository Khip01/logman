import type { Locale } from '@/lib/i18n/locale'
import type { MessageKey } from '@/lib/i18n/messages/id'
import { translate } from '@/lib/i18n/translate'

/**
 * Katalog pencarian halaman Pengaturan (AGENTS.md bagian 22).
 *
 * Halaman Pengaturan punya sembilan seksi. Mencarinya dengan menggulir manual melelahkan,
 * jadi halaman ini punya kotak pencarian. Modul ini MURNI: tanpa React dan tanpa DOM,
 * sehingga daftar saran dapat diuji tanpa browser. Komponen hanya merender hasilnya.
 *
 * DUA LAPIS HASIL:
 * 1. Lapis judul: query dicocokkan ke nama seksi, misal "jam" menemukan "Jam Default".
 *    Barisnya menampilkan ikon dan nama seksi.
 * 2. Lapis konten: query dicocokkan ke teks DI DALAM seksi, misal "PDF" menemukan
 *    deskripsi font dokumen. Barisnya menampilkan ikon, nama seksi, lalu potongan teks
 *    yang memuat kata itu, sehingga user tahu kenapa hasilnya muncul.
 *
 * SEMUA hasil lapis judul selalu mendahului seluruh hasil lapis konten. Urutan di dalam
 * tiap lapis mengikuti urutan seksi di halaman.
 *
 * Bahasa mengikuti locale aktif: teks yang dicocokkan dan yang ditampilkan diterjemahkan
 * lebih dulu, sehingga user Inggris mencari dengan kata Inggris.
 */

/** Id seksi Pengaturan. Dipakai sebagai key registry dan bagian dari id DOM. */
export type SettingsSectionId =
  | 'profil'
  | 'tema'
  | 'tier'
  | 'bahasa'
  | 'jam-default'
  | 'alasan'
  | 'penanda-tangan'
  | 'dokumen'
  | 'tampilan-dev'

/**
 * Nama ikon seksi.
 *
 * Sengaja berupa string, BUKAN komponen Lucide, supaya modul ini tetap murni dan bebas
 * dari React. Komponen `SettingsSection` yang memetakan nama ini ke komponen ikon.
 */
export type SettingsSectionIcon =
  | 'user'
  | 'palette'
  | 'sparkles'
  | 'languages'
  | 'clock'
  | 'list-checks'
  | 'pen-line'
  | 'file-text'
  | 'wrench'

interface SettingsSectionDef {
  id: SettingsSectionId
  /** Key pesan judul seksi, HANYA dipakai di lapis judul dan label konteks baris konten. */
  titleKey: MessageKey
  icon: SettingsSectionIcon
  /**
   * Key pesan teks yang TAMPIL di dalam seksi ini.
   *
   * ATURAN (AGENTS.md bagian 22): hanya key tanpa placeholder yang boleh masuk daftar ini,
   * karena potongan hasil ditampilkan apa adanya. Key ber-interpolasi seperti
   * `settings.hapusPembimbing` dilewati supaya snippet tidak menampilkan `{nama}`.
   */
  contentKeys: readonly MessageKey[]
}

/**
 * Sembilan seksi Pengaturan, dalam urutan tampil di halaman.
 *
 * Menambah seksi baru berarti: tambahkan entri di sini, pindahkan `<h2>`-nya ke
 * `SettingsSection`, lalu tambahkan key teks yang ingin dapat dicari.
 */
export const SETTINGS_SECTIONS: readonly SettingsSectionDef[] = [
  {
    id: 'profil',
    titleKey: 'settings.profil',
    icon: 'user',
    contentKeys: [
      'settings.namaMahasiswa',
      'settings.namaLengkap',
      'settings.nim',
      'settings.nimPanjang',
      'settings.programStudi',
      'settings.mitraIndustri',
      'settings.tanggalMulai',
      'settings.tanggalMulaiDeskripsi',
      'settings.tanggalSelesai',
    ],
  },
  {
    id: 'tema',
    titleKey: 'settings.tema',
    icon: 'palette',
    contentKeys: [
      'settings.temaDeskripsi',
      'tema.hitamPekat',
      'tema.hitamAbu',
      'tema.hitamPastel',
      'tema.putihBersih',
      'tema.putihPastel',
      'tema.putihTulang',
      'tema.putihGDocs',
      'tema.putihWord',
      'tema.wordDark',
    ],
  },
  {
    id: 'tier',
    titleKey: 'settings.tierAnimasi',
    icon: 'sparkles',
    contentKeys: [
      'settings.tierAnimasiDeskripsi',
      'settings.putarUlang',
      'settings.pratinjau',
      'motion.penuh',
      'motion.seimbang',
      'motion.minimal',
      'motion.mati',
      'motion.penuhDeskripsi',
      'motion.seimbangDeskripsi',
      'motion.minimalDeskripsi',
      'motion.matiDeskripsi',
    ],
  },
  {
    id: 'bahasa',
    titleKey: 'settings.bahasa',
    icon: 'languages',
    contentKeys: ['settings.bahasaDeskripsi', 'settings.bahasa.id', 'settings.bahasa.en'],
  },
  {
    id: 'jam-default',
    titleKey: 'settings.jamDefault',
    icon: 'clock',
    contentKeys: [
      'settings.jamDefaultDeskripsi',
      'settings.formatJam',
      'settings.format24',
      'settings.format12',
      'settings.hariKerja',
      'settings.hariKerjaDeskripsi',
      'settings.hariKerjaMinimal',
      'settings.hari',
      'settings.resetJamDefault',
    ],
  },
  {
    id: 'alasan',
    titleKey: 'alasan.judulPanjang',
    icon: 'list-checks',
    contentKeys: [
      'alasan.deskripsiPanjang',
      'alasan.stripPetunjuk',
      'alasan.toggleStripJudul',
      'alasan.belumAda',
      'alasan.belumAdaDeskripsi',
      'alasan.tambah',
      'alasan.misal',
      'alasan.kembalikan',
    ],
  },
  {
    id: 'penanda-tangan',
    titleKey: 'settings.penandaTangan',
    icon: 'pen-line',
    contentKeys: [
      'settings.penandaTanganDeskripsi',
      'settings.dosenPembimbing',
      'settings.dosenPembimbingDeskripsi',
      'settings.pembimbingLapangan',
      'settings.belumAdaPembimbing',
      'settings.belumAdaPembimbingDeskripsi',
      'settings.tambahPembimbing',
      'settings.misalNama',
      'settings.jadikanDefault',
      'settings.defaultSaatIni',
      'settings.default',
      'settings.misalDosen',
    ],
  },
  {
    id: 'dokumen',
    titleKey: 'settings.dokumenEkspor',
    icon: 'file-text',
    contentKeys: [
      'settings.ukuranKertas',
      'settings.kertas.A4',
      'settings.kertas.F4',
      'settings.kertas.Letter',
      'settings.fontDokumen',
      'settings.fontDokumenDeskripsi',
      'settings.font.times',
      'settings.font.arial',
      'settings.skalaKonten',
      'settings.skalaKontenDeskripsi',
      'settings.skala.kecil',
      'settings.skala.normal',
      'settings.skala.besar',
      'settings.skala.sangatBesar',
      'settings.folderEkspor',
      'settings.folderEksporDeskripsi',
      'settings.telusuriFolder',
      'settings.telusuriFolderJudul',
      'settings.resetFolder',
      'settings.resetFolderJudul',
      'settings.polaNamaFile',
    ],
  },
  {
    id: 'tampilan-dev',
    titleKey: 'settings.tampilan',
    icon: 'wrench',
    contentKeys: ['settings.tampilkanDev', 'settings.tampilkanDevDeskripsi'],
  },
]

/** Lapis asal sebuah saran. `title` = kecocokan nama menu, `content` = kecocokan isi menu. */
export type SettingsMatchKind = 'title' | 'content'

/** Satu saran pencarian. */
export interface SettingsSearchResult {
  /**
   * Identitas stabil dan UNIK untuk saran ini, dipakai sebagai key React.
   *
   * WAJIB ada dan wajib unik. Sebelumnya komponen menyusun key dari `sectionId` dan
   * `match.start`, dan itu BUG: beberapa saran bisa punya posisi cocok yang sama, misalnya
   * "Nama mahasiswa", "Nama lengkap", dan "Nama Mitra Industri" semuanya mulai di indeks
   * 0. Key duplikat membuat rekonsiliasi React salah, sehingga saran lama tidak dibuang
   * dan menyantol di atas hasil baru saat user mengetik atau menghapus ketikan.
   */
  key: string
  kind: SettingsMatchKind
  sectionId: SettingsSectionId
  icon: SettingsSectionIcon
  /** Judul seksi, sudah diterjemahkan. Dipakai sebagai konteks pada baris lapis konten. */
  sectionTitle: string
  /**
   * Teks yang ditampilkan setelah judul pada baris lapis konten. Selalu string kosong
   * untuk lapis judul, karena barisnya hanya menampilkan nama menu.
   */
  snippet: string
  /** Kata yang dicocokkan, sebagai rentang di dalam `sectionTitle` atau `snippet`. */
  match: { start: number; length: number }
}

/** Jumlah potongan yang diambil di sekitar kata yang cocok pada lapis konten. */
const SNIPPET_PADDING = 60

/**
 * Mencari seksi Pengaturan yang cocok dengan query.
 *
 * Query kosong (atau hanya spasi) mengembalikan SELURUH menu pada lapis judul tanpa
 * highlight. Ini disengaja: saat user memfokuskan kotak pencarian, seluruh menu langsung
 * terlihat sehingga user tahu apa saja yang bisa dicari, dan menekan Enter tanpa mengetik
 * membawa ke menu pertama.
 *
 * Pencocokan bersifat case-insensitive dan memakai `includes`, bukan regex, supaya query
 * dengan karakter khusus tidak pernah melempar error dan hasilnya mudah diprediksi.
 */
export function searchSettings(query: string, locale: Locale): SettingsSearchResult[] {
  const q = query.trim().toLowerCase()

  if (q === '') {
    return SETTINGS_SECTIONS.map((section) => ({
      key: `title:${section.id}`,
      kind: 'title',
      sectionId: section.id,
      icon: section.icon,
      sectionTitle: translate(locale, section.titleKey),
      snippet: '',
      match: { start: 0, length: 0 },
    }))
  }

  const titleHits: SettingsSearchResult[] = []
  const contentHits: SettingsSearchResult[] = []

  for (const section of SETTINGS_SECTIONS) {
    const title = translate(locale, section.titleKey)
    const inTitle = title.toLowerCase().indexOf(q)

    if (inTitle >= 0) {
      titleHits.push({
        key: `title:${section.id}`,
        kind: 'title',
        sectionId: section.id,
        icon: section.icon,
        sectionTitle: title,
        snippet: '',
        match: { start: inTitle, length: q.length },
      })
      // Seksi ini sudah muncul di lapis judul. Isinya tidak perlu diulang, karena hasil
      // judul sudah membawa user ke seksi yang sama.
      continue
    }

    for (const key of section.contentKeys) {
      const text = translate(locale, key)
      const found = text.toLowerCase().indexOf(q)
      if (found < 0) continue

      const snippet = snippetAround(text, found, q.length)
      contentHits.push({
        // Key pesan membuat identitas ini unik walau posisi cocoknya sama dengan saran lain.
        key: `content:${section.id}:${key}`,
        kind: 'content',
        sectionId: section.id,
        icon: section.icon,
        sectionTitle: title,
        snippet: snippet.text,
        match: { start: snippet.matchStart, length: q.length },
      })
    }
  }

  return [...titleHits, ...contentHits]
}

/**
 * Memotong teks agar kata yang cocok berada di tengah dan terlihat.
 *
 * Mengembalikan teks potongan beserta posisi kata di dalam POTONGAN itu, karena UI
 * menyorot berdasarkan posisi pada teks yang benar-benar dirender.
 */
function snippetAround(
  text: string,
  matchStart: number,
  matchLength: number,
): { text: string; matchStart: number } {
  const start = Math.max(0, matchStart - SNIPPET_PADDING)
  const end = Math.min(text.length, matchStart + matchLength + SNIPPET_PADDING)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < text.length ? '...' : ''

  return {
    text: `${prefix}${text.slice(start, end)}${suffix}`,
    matchStart: matchStart - start + prefix.length,
  }
}

/** Id DOM elemen seksi, dipakai pencarian untuk menggulir ke sasarannya. */
export function settingsSectionDomId(id: SettingsSectionId): string {
  return `settings-section-${id}`
}

/**
 * Ikon sebuah seksi.
 *
 * Dipakai `SettingsSection` untuk menggambar judul, sehingga judul dan saran pencarian
 * selalu memakai ikon yang sama tanpa daftar ganda.
 */
export function settingsSectionIcon(id: SettingsSectionId): SettingsSectionIcon {
  const section = SETTINGS_SECTIONS.find((item) => item.id === id)
  if (!section) throw new Error(`Seksi Pengaturan tidak dikenal: ${id}`)
  return section.icon
}
