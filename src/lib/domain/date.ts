/**
 * Utilitas tanggal. Semua fungsi MURNI, tanpa I/O dan tanpa React
 * (AGENTS.md bagian 4 dan 14).
 *
 * Konvensi internal:
 * - Tanggal selalu diwakili string ISO `YYYY-MM-DD`.
 * - Semua perhitungan memakai waktu lokal tengah hari untuk menghindari pergeseran
 *   zona waktu yang bisa menggeser hari.
 */

export const DAY_MS = 24 * 60 * 60 * 1000

/** Nama hari dalam bahasa Indonesia, indeks 0 = Minggu (sama dengan Date.getDay). */
export const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const

/** Nama bulan dalam bahasa Indonesia, indeks 0 = Januari. */
export const BULAN_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

/** Label pendek 3 huruf untuk rail sidebar. Tidak ambigu antar bulan. */
export const BULAN_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Memeriksa apakah string adalah tanggal ISO yang valid. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = ISO_DATE.exec(value)
  if (!match) return false
  const [, y, m, d] = match
  const year = Number(y)
  const month = Number(m)
  const day = Number(d)
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  // Tanggal yang tidak ada (misal 31 Februari) ditolak.
  const date = new Date(year, month - 1, day, 12)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/** Membuat Date lokal pada tengah hari, aman dari pergeseran zona waktu. */
export function parseIsoDate(iso: string): Date {
  if (!isIsoDate(iso)) {
    throw new Error(`Tanggal ISO tidak valid: ${iso}`)
  }
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0)
}

/** Mengubah Date menjadi string ISO `YYYY-MM-DD` memakai komponen lokal. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Menambah jumlah hari pada tanggal ISO. Nilai negatif mengurangi. */
export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** Selisih hari antara dua tanggal ISO (b - a). */
export function diffDays(a: string, b: string): number {
  const start = parseIsoDate(a).getTime()
  const end = parseIsoDate(b).getTime()
  return Math.round((end - start) / DAY_MS)
}

/** Indeks hari dalam minggu, 0 = Minggu, 1 = Senin, sampai 6 = Sabtu. */
export function dayOfWeek(iso: string): number {
  return parseIsoDate(iso).getDay()
}

/** Nama hari bahasa Indonesia. */
export function dayNameId(iso: string): string {
  return HARI_ID[dayOfWeek(iso)] ?? ''
}

/** Tanggal Senin dari minggu yang memuat tanggal tersebut. */
export function mondayOf(iso: string): string {
  const dow = dayOfWeek(iso)
  // Minggu (0) dihitung sebagai hari terakhir minggu sebelumnya, jadi mundur 6 hari.
  const back = dow === 0 ? 6 : dow - 1
  return addDays(iso, -back)
}

/** Tanggal Sabtu dari minggu yang memuat tanggal tersebut. */
export function saturdayOf(iso: string): string {
  return addDays(mondayOf(iso), 5)
}

/** Kunci bulan `YYYY-MM` dari sebuah tanggal. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

/** Label panjang bulan, misal "September 2026", dari kunci `YYYY-MM`. */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) {
    throw new Error(`Kunci bulan tidak valid: ${key}`)
  }
  return `${BULAN_ID[m - 1]} ${y}`
}

/** Label pendek 3 huruf dari kunci `YYYY-MM`. */
export function monthShort(key: string): string {
  const [, m] = key.split('-').map(Number)
  if (!m || m < 1 || m > 12) {
    throw new Error(`Kunci bulan tidak valid: ${key}`)
  }
  return BULAN_SHORT[m - 1] ?? ''
}

/**
 * Format tanggal lengkap bahasa Indonesia, misal "Senin, 5 Januari 2026".
 * Sesuai AGENTS.md bagian 11.2.
 */
export function formatTanggalId(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) {
    throw new Error(`Tanggal tidak valid: ${iso}`)
  }
  return `${dayNameId(iso)}, ${d} ${BULAN_ID[m - 1] ?? ''} ${y}`
}

/**
 * Tanggal bahasa Indonesia TANPA nama hari, misal "5 Januari 2026".
 *
 * Dipakai bersama nama hari yang terpisah, agar tabel dokumen tidak mengulang nama
 * hari (kolom sudah punya baris nama hari sendiri).
 */
export function formatTanggalTanpaHari(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) {
    throw new Error(`Tanggal tidak valid: ${iso}`)
  }
  return `${d} ${BULAN_ID[m - 1] ?? ''} ${y}`
}

/** Format tanggal pendek, misal "5 Jan 2026". */
export function formatTanggalPendek(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) {
    throw new Error(`Tanggal tidak valid: ${iso}`)
  }
  return `${d} ${BULAN_SHORT[m - 1] ?? ''} ${y}`
}

/** Benar bila tanggal berada di dalam rentang inklusif. */
export function isWithin(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end
}

/** Benar bila tanggal adalah hari Sabtu atau Minggu. */
export function isWeekend(iso: string): boolean {
  const dow = dayOfWeek(iso)
  return dow === 0 || dow === 6
}
