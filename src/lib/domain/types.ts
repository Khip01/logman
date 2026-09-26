/**
 * Tipe domain Log Book. Semua logika yang memakai tipe ini harus murni dan dapat
 * diuji tanpa React (AGENTS.md bagian 4 dan 14).
 */

import type { Locale } from '@/lib/i18n/locale'
import type { ContentScale, FontDokumen } from './dokumen'
import type { JamFormat } from './jamFormat'

export type DayOfWeek = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu'

/**
 * Urutan hari kerja, Senin sampai Minggu.
 *
 * Minggu ada di daftar ini supaya bisa dinyalakan, karena ada magang yang Donnerstags
 * bekerja hari Minggu. Bawaannya MATI, jadi daftar bawaan `DEFAULT_HARI_KERJA` hanya
 * berisi enam hari Senin sampai Sabtu (lihat `schema.ts`).
 *
 * Urutannya mengikuti kebiasaan kerja Indonesia, bukan urutan `Date.getDay()` yang
 * dimulai dari Minggu. Baris tabel dimulai dari Senin, dan Minggu menjadi baris
 * terakhir bila dinyalakan.
 */
export const DAY_OF_WEEK_ORDER: readonly DayOfWeek[] = [
  'senin',
  'selasa',
  'rabu',
  'kamis',
  'jumat',
  'sabtu',
  'minggu',
]

/** Status pengisian sebuah hari. Lihat AGENTS.md bagian 11.3. */
export type DayStatus = 'terisi' | 'kosong' | 'libur' | 'sakit' | 'izin'

/**
 * Satu alasan hari kosong yang bisa dikelola user di Settings.
 *
 * Dulu daftar alasan disimpan sebagai `string[]`. Sekarang setiap alasan membawa
 * `stripJam`, yaitu apakah kolom jam pada hari beralasan ini ditampilkan sebagai strip.
 * Sebelumnya perilaku itu ditentukan dari nama alasan secara hardcode, sehingga alasan
 * kustom seperti "Sakit Gigi" tidak bisa membuat jam jadi strip. Bentuk lamanya tetap
 * diterima saat dibaca dan dimigrasi otomatis (lihat `sanitizeAlasan`).
 */
export interface Alasan {
  /** Teks alasan yang tampil di dropdown dan tercetak di dokumen. */
  label: string
  /** Bila true, kolom jam masuk dan jam pulang tampil sebagai strip pada hari ini. */
  stripJam: boolean
}

export interface DayEntry {
  /** Tanggal dalam format ISO YYYY-MM-DD. Ini identitas baris. */
  date: string
  /** Jam masuk format titik, misal "08.00". Null bila memakai default atau strip. */
  masuk: string | null
  /** Jam pulang format titik, misal "16.00". Null bila memakai default atau strip. */
  pulang: string | null
  /** Isi kolom Kegiatan. */
  kegiatan: string
  /** Alasan bila hari tidak diisi kegiatan normal. */
  alasan: string | null
  status: DayStatus
}

export interface WeekEntry {
  /** Identitas minggu, diturunkan dari tanggal Senin, misal "2026-W36". */
  id: string
  /** Tanggal Senin minggu tersebut, ISO YYYY-MM-DD. */
  startDate: string
  /** Tanggal Sabtu minggu tersebut, ISO YYYY-MM-DD. */
  endDate: string
  /** Nomor minggu di dalam bulannya, mulai dari 1. Reset per bulan (AGENTS.md bagian 6). */
  weekOfMonth: number
  days: DayEntry[]
}

export interface MonthGroup {
  /** Kunci bulan, format YYYY-MM. */
  key: string
  /** Label panjang, misal "Agustus 2026". */
  label: string
  /** Label pendek 3 huruf untuk rail sidebar, misal "Agu". */
  short: string
  weeks: WeekEntry[]
}

export interface Profil {
  nama: string
  nim: string
  programStudi: string
  mitraIndustri: string
}

export interface RentangMagang {
  mulai: string | null
  selesai: string | null
}

export interface JamDefaultHarian {
  masuk: string
  pulang: string
}

export type JamDefault = Record<DayOfWeek, JamDefaultHarian>

export type UkuranKertas = 'A4' | 'F4' | 'Letter'

/**
 * Cara baris yang tidak relevan terhadap bulan halaman ditampilkan pada dokumen.
 *
 * `samarkan` (bawaan) tetap mencetak barisnya, dengan tulisan miring dan redup supaya
 * jelas bahwa baris itu milik bulan lain. `hapus` tidak mencetaknya sama sekali.
 *
 * Lihat AGENTS.md bagian 11.9.
 */
export type HariLuarBulan = 'samarkan' | 'hapus'

export interface AppConfig {
  profil: Profil
  magang: RentangMagang
  jamDefault: JamDefault
  /**
   * Hari kerja yang punya baris di tabel dokumen, urut Senin sampai Sabtu.
   *
   * Nilai kosong TIDAK mungkin: bila semua hari dimatikan, tabel tidak punya baris
   * sama sekali dan Log Book tidak bisa diisi. Karena itu `sanitizeHariKerja`
   * mengembalikan daftar lengkap saat tidak ada satu pun hari yang menyala.
   *
   * Hari yang dimatikan TIDAK menghapus data. Isi hari itu tetap di `logs.json`,
   * hanya tidak tampil di tabel, dan kembali tampil begitu hari tersebut dinyalakan
   * lagi. Lihat AGENTS.md bagian 11.7.
   */
  hariKerja: DayOfWeek[]
  /**
   * Daftar alasan hari kosong. Setiap alasan menentukan sendiri apakah jamnya
   * menjadi strip. Lihat `Alasan`.
   */
  alasan: Alasan[]
  tema: string
  tierAnimasi: string
  ukuranKertas: UkuranKertas
  folderExport: string
  /** Format tampilan jam di UI. Nilai tersimpan tetap 24 jam format titik. */
  formatJam: JamFormat
  /** Font layer dokumen (cetak, preview, PDF). UI aplikasi tidak terpengaruh. */
  fontDokumen: FontDokumen
  /**
   * Perlakuan baris yang tidak relevan terhadap bulan halaman pada dokumen cetak
   * dan PDF. Layar TIDAK terpengaruh: tabel di layar tetap menampilkan semua baris
   * sebagai read-only. Lihat AGENTS.md bagian 11.9.
   */
  hariLuarBulan: HariLuarBulan
  /** Skala ukuran tampilan konten Log Book di layar. Cetak dan PDF tidak terpengaruh. */
  contentScale: ContentScale
  /**
   * Bahasa antarmuka aplikasi. Tidak memengaruhi dokumen cetak dan PDF, karena dokumen
   * punya bahasa sendiri lewat `bahasaDokumen` (AGENTS.md bagian 21).
   */
  bahasa: Locale
  /**
   * Bahasa isi dokumen cetak dan PDF. Default `id`.
   *
   * Yang ikut bahasa ini: label identitas, judul kolom tabel, label tanda tangan, kata
   * Minggu, nama hari, dan nama bulan. Yang TIDAK ikut: kop surat dan judul dokumen
   * "LOG BOOK MAGANG", karena keduanya bagian identitas resmi kampus
   * (AGENTS.md bagian 21).
   *
   * Tabel di LAYAR juga memakai nilai ini, bukan `bahasa`, karena preview di browser
   * adalah dokumen itu sendiri. Kelas print tidak bisa mengganti teks, jadi satu-satunya
   * cara menjaga tampilan sama dengan hasil cetak adalah memakai bahasa dokumen sejak awal.
   */
  bahasaDokumen: Locale
  /** Menampilkan menu dan route pengembangan. Default mati. */
  tampilkanDevUi: boolean
  /** Nama default Dosen Pembimbing untuk blok tanda tangan. */
  dosenPembimbing: string
  /** Daftar nama Pembimbing Lapangan yang bisa dipilih per minggu. */
  pembimbingLapangan: string[]
  /** Nama Pembimbing Lapangan yang terpilih secara default. Null bila daftar kosong. */
  pembimbingLapanganDefault: string | null
}

/**
 * Override nama penanda tangan untuk satu minggu. Field yang kosong jatuh ke default
 * config. Mahasiswa defaultnya `profil.nama`, dosen defaultnya `dosenPembimbing`, dan
 * pembimbing defaultnya `pembimbingLapanganDefault`.
 */
export interface NamaMinggu {
  mahasiswa?: string
  dosen?: string
  pembimbing?: string
}

/** Default penanda tangan dari config, dipakai saat sebuah minggu tidak punya override. */
export interface PenandaTanganDefaults {
  mahasiswa: string
  dosen: string
  pembimbing: string
}

/**
 * Seluruh data log dalam satu struktur (AGENTS.md bagian 5.2).
 *
 * Minggu dan bulan TIDAK disimpan, melainkan diturunkan dari rentang magang lewat
 * `buildMonthGroups`. Yang disimpan hanya entri hari, sehingga autosave cukup
 * mengirim hari yang berubah saja.
 */
export interface LogData {
  version: number
  updatedAt: string
  /** Entri hari, dikunci oleh tanggal ISO `YYYY-MM-DD`. */
  days: Record<string, DayEntry>
  /**
   * Override nama penanda tangan per minggu, dikunci oleh weekId. Bila sebuah minggu
   * tidak ada di sini, nama diambil dari default config. Lihat domain/pembimbing.ts.
   */
  namaPenandaTangan: Record<string, NamaMinggu>
}
