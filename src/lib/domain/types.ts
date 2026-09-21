/**
 * Tipe domain Log Book. Semua logika yang memakai tipe ini harus murni dan dapat
 * diuji tanpa React (AGENTS.md bagian 4 dan 14).
 */

export type DayOfWeek = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu'

/** Status pengisian sebuah hari. Lihat AGENTS.md bagian 11.3. */
export type DayStatus = 'terisi' | 'kosong' | 'libur' | 'sakit' | 'izin'

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

export interface AppConfig {
  profil: Profil
  magang: RentangMagang
  jamDefault: JamDefault
  alasan: string[]
  tema: string
  tierAnimasi: string
  ukuranKertas: 'A4' | 'F4' | 'Letter'
  folderExport: string
}
