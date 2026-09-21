import { isWithin } from './date'
import type { DayEntry, DayStatus } from './types'

/**
 * Logika editor Log Book (AGENTS.md bagian 11.2 dan 11.3). Semua fungsi MURNI dan
 * dapat diuji tanpa React.
 */

/** Status yang menampilkan jam sebagai strip, bukan angka (AGENTS.md bagian 11.3). */
const STRIP_STATUSES: DayStatus[] = ['sakit', 'izin']

/** Karakter strip untuk jam pada status Sakit dan Izin. Bukan em dash. */
export const JAM_STRIP = '-'

export function isStripStatus(status: DayStatus): boolean {
  return STRIP_STATUSES.includes(status)
}

/**
 * Menentukan status dari alasan yang dipilih.
 *
 * Sakit dan Izin punya status khusus karena jamnya menjadi strip. Alasan lain
 * (Libur Nasional, Cuti Bersama, teks bebas) dianggap libur.
 */
export function statusFromAlasan(alasan: string): DayStatus {
  const key = alasan.trim().toLowerCase()
  if (key === 'sakit') return 'sakit'
  if (key === 'izin') return 'izin'
  return 'libur'
}

/**
 * Status efektif sebuah hari, diturunkan dari isinya.
 *
 * Isi kegiatan menang atas alasan: bila user mengetik kegiatan, hari itu terisi dan
 * alasan lama tidak lagi relevan. Bila kegiatan kosong dan ada alasan, status mengikuti
 * alasan. Bila keduanya kosong, hari dianggap kosong.
 */
export function effectiveStatus(day: DayEntry): DayStatus {
  if (day.kegiatan.trim() !== '') return 'terisi'
  if (day.alasan && day.alasan.trim() !== '') return statusFromAlasan(day.alasan)
  return 'kosong'
}

/** Benar bila jam hari ini harus tampil sebagai strip. */
export function showsJamStrip(day: DayEntry): boolean {
  return isStripStatus(effectiveStatus(day))
}

/**
 * Label jam untuk ditampilkan. Mengembalikan strip untuk status Sakit dan Izin, atau
 * nilai jam bila ada. Bila kosong, pemanggil yang memutuskan memakai jam default.
 */
export function displayJam(day: DayEntry, field: 'masuk' | 'pulang'): string {
  if (showsJamStrip(day)) return JAM_STRIP
  return day[field] ?? ''
}

export interface DayIssue {
  date: string
  /** Kode masalah, dipakai UI untuk memilih pesan. */
  code: 'tanpa-alasan'
}

/**
 * Memeriksa kelengkapan satu hari (AGENTS.md bagian 11.3).
 *
 * Hanya hari kosong tanpa alasan yang dianggap belum lengkap. Jam yang dikosongkan
 * BUKAN masalah, karena jam default per hari akan dipakai saat ekspor.
 */
export function validateDay(day: DayEntry): DayIssue[] {
  if (effectiveStatus(day) !== 'kosong') return []
  return [{ date: day.date, code: 'tanpa-alasan' }]
}

/**
 * Mengumpulkan tanggal yang belum lengkap dari sekumpulan hari.
 *
 * `isEditable` menyaring baris yang memang tidak dapat diisi (bulan lain atau di luar
 * rentang magang), supaya banner validasi tidak menyalahkan hari yang tidak bisa diisi.
 */
export function collectIncompleteDates(
  days: DayEntry[],
  isEditable: (date: string) => boolean,
): string[] {
  const result: string[] = []
  for (const day of days) {
    if (!isEditable(day.date)) continue
    if (validateDay(day).length > 0) result.push(day.date)
  }
  return result
}

/**
 * Membangun patch untuk menetapkan alasan sebuah hari.
 *
 * Saat alasan diisi, kegiatan dikosongkan karena alasan mewakili isi hari tersebut.
 * Status ikut disimpan agar data di disk tetap eksplisit (AGENTS.md bagian 5.2).
 */
export function patchAlasan(alasan: string): Partial<DayEntry> {
  const trimmed = alasan.trim()
  if (trimmed === '') {
    return { alasan: null, status: 'kosong' }
  }
  return { alasan: trimmed, status: statusFromAlasan(trimmed), kegiatan: '' }
}

/**
 * Membangun patch saat user mengetik kegiatan.
 *
 * Mengetik kegiatan membatalkan alasan lama dan menjadikan hari terisi, sehingga status
 * tidak pernah bertentangan dengan isi.
 */
export function patchKegiatan(kegiatan: string): Partial<DayEntry> {
  if (kegiatan.trim() === '') {
    return { kegiatan, status: 'kosong' }
  }
  return { kegiatan, status: 'terisi', alasan: null }
}

/** Benar bila tanggal berada di dalam rentang dan tidak disabled untuk bulan aktif. */
export function isDateEditable(iso: string, mulai: string, selesai: string): boolean {
  return isWithin(iso, mulai, selesai)
}
