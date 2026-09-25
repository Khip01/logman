import { isLocale } from '@/lib/i18n/locale'
import { sanitizeAlasan } from './alasan'
import { isIsoDate } from './date'
import { isContentScale, isFontDokumen, parseContentScale } from './dokumen'
import { isJamFormat } from './jamFormat'
import {
  resolvePembimbingDefault,
  sanitizeNamaMinggu,
  sanitizeNamaPenandaTangan,
  sanitizePembimbing,
} from './pembimbing'
import type {
  AppConfig,
  DayEntry,
  DayOfWeek,
  DayStatus,
  JamDefault,
  JamDefaultHarian,
  LogData,
  NamaMinggu,
  Profil,
  RentangMagang,
  UkuranKertas,
} from './types'

/**
 * Skema dan validasi data (AGENTS.md bagian 5). Semua fungsi MURNI.
 *
 * Prinsip: validasi TIDAK melempar untuk data yang bisa dipulihkan. Fungsi
 * mengembalikan hasil dengan daftar masalah, sehingga pemanggil bisa memutuskan
 * memakai nilai default atau menolak. Data yang rusak tidak boleh membuat aplikasi
 * gagal total.
 */

export const CONFIG_VERSION = 1
export const LOGS_VERSION = 1

export const DEFAULT_PROGRAM_STUDI = 'Sarjana Terapan Teknik Informatika'
export const DEFAULT_MITRA = 'PT Naraya Telematika'

export const UKURAN_KERTAS: UkuranKertas[] = ['A4', 'F4', 'Letter']
export const DAY_STATUSES: DayStatus[] = ['terisi', 'kosong', 'libur', 'sakit', 'izin']
export const HARI_KEYS: DayOfWeek[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']

/** Format jam titik, misal "08.00". Boleh kosong hanya lewat null. */
const JAM_PATTERN = /^([01]\d|2[0-3])\.([0-5]\d)$/

export function isJamValid(value: unknown): value is string {
  return typeof value === 'string' && JAM_PATTERN.test(value)
}

/**
 * Menormalkan jam dari berbagai bentuk ke format titik. Null bila tidak valid.
 *
 * Bentuk yang diterima, semuanya dinormalkan ke `HH.MM`:
 * - "08.00", "8.00" (jam satu digit dipad)
 * - "08:00", "8:00" (titik dua diterima dari input mesin)
 * - "8" (jam bulat, dianggap "08.00")
 *
 * Menit wajib dua digit, karena "8.5" ambigu antara 08.05 dan 08.50.
 */
export function normalizeJam(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed === '') return null

  const withDot = trimmed.replace(':', '.')

  // Jam saja, misal "8" atau "16".
  const jamSaja = /^(\d{1,2})$/.exec(withDot)
  if (jamSaja) {
    const candidate = `${jamSaja[1]?.padStart(2, '0')}.00`
    return isJamValid(candidate) ? candidate : null
  }

  // Jam dan menit, misal "8.05" atau "16.30".
  const jamMenit = /^(\d{1,2})\.(\d{2})$/.exec(withDot)
  if (!jamMenit) return null
  const candidate = `${jamMenit[1]?.padStart(2, '0')}.${jamMenit[2]}`
  return isJamValid(candidate) ? candidate : null
}

export function defaultJamDefault(): JamDefault {
  const hari = (masuk: string, pulang: string): JamDefaultHarian => ({ masuk, pulang })
  return {
    senin: hari('08.00', '16.00'),
    selasa: hari('08.00', '16.00'),
    rabu: hari('08.00', '16.00'),
    kamis: hari('08.00', '16.00'),
    jumat: hari('08.00', '16.00'),
    sabtu: hari('08.00', '16.00'),
  }
}

export const DEFAULT_ALASAN = [
  'Libur Nasional',
  'Cuti Bersama',
  'Izin',
  'Sakit',
  'Tanpa Keterangan',
]

export function defaultProfil(): Profil {
  return {
    nama: '',
    nim: '',
    programStudi: DEFAULT_PROGRAM_STUDI,
    mitraIndustri: DEFAULT_MITRA,
  }
}

export function defaultConfig(): AppConfig {
  return {
    profil: defaultProfil(),
    magang: { mulai: null, selesai: null },
    jamDefault: defaultJamDefault(),
    alasan: [...DEFAULT_ALASAN],
    tema: 'hitam-pekat',
    tierAnimasi: 'penuh',
    ukuranKertas: 'A4',
    folderExport: '',
    formatJam: '24',
    fontDokumen: 'times',
    contentScale: 1,
    bahasa: 'id',
    tampilkanDevUi: false,
    dosenPembimbing: '',
    pembimbingLapangan: [],
    pembimbingLapanganDefault: null,
  }
}

export function defaultLogData(): LogData {
  return {
    version: LOGS_VERSION,
    updatedAt: new Date(0).toISOString(),
    days: {},
    namaPenandaTangan: {},
  }
}

export interface ValidationResult<T> {
  value: T
  issues: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/**
 * Memvalidasi dan menormalkan konfigurasi. Field yang rusak diganti default dan
 * dicatat sebagai issue, sehingga konfigurasi yang sebagian rusak tetap bisa dipakai.
 */
export function parseConfig(input: unknown): ValidationResult<AppConfig> {
  const base = defaultConfig()
  const issues: string[] = []

  if (!isRecord(input)) {
    return { value: base, issues: ['Konfigurasi bukan objek, memakai default.'] }
  }

  const profilInput = isRecord(input.profil) ? input.profil : {}
  const profil: Profil = {
    nama: asString(profilInput.nama, base.profil.nama),
    nim: asString(profilInput.nim, base.profil.nim),
    programStudi: asString(profilInput.programStudi, base.profil.programStudi),
    mitraIndustri: asString(profilInput.mitraIndustri, base.profil.mitraIndustri),
  }

  const magangInput = isRecord(input.magang) ? input.magang : {}
  const mulaiRaw = magangInput.mulai
  const selesaiRaw = magangInput.selesai
  let mulai: string | null = isIsoDate(mulaiRaw) ? mulaiRaw : null
  let selesai: string | null = isIsoDate(selesaiRaw) ? selesaiRaw : null
  if (mulaiRaw != null && mulai === null) issues.push('Tanggal mulai magang tidak valid.')
  if (selesaiRaw != null && selesai === null) issues.push('Tanggal selesai magang tidak valid.')
  if (mulai && selesai && mulai > selesai) {
    issues.push('Tanggal mulai magang melebihi tanggal selesai.')
    // Tukar agar tetap bisa dipakai.
    ;[mulai, selesai] = [selesai, mulai]
  }

  const jamInput = isRecord(input.jamDefault) ? input.jamDefault : {}
  const jamDefault = { ...base.jamDefault }
  for (const key of HARI_KEYS) {
    const item = jamInput[key]
    if (!isRecord(item)) continue
    const masuk = normalizeJam(item.masuk)
    const pulang = normalizeJam(item.pulang)
    if (masuk) jamDefault[key] = { ...jamDefault[key], masuk }
    if (pulang) jamDefault[key] = { ...jamDefault[key], pulang }
    if (!masuk && item.masuk != null) issues.push(`Jam masuk ${key} tidak valid.`)
    if (!pulang && item.pulang != null) issues.push(`Jam pulang ${key} tidak valid.`)
  }

  const ukuranKertas: UkuranKertas = UKURAN_KERTAS.includes(input.ukuranKertas as UkuranKertas)
    ? (input.ukuranKertas as UkuranKertas)
    : base.ukuranKertas

  const formatJam = isJamFormat(input.formatJam) ? input.formatJam : base.formatJam
  const fontDokumen = isFontDokumen(input.fontDokumen) ? input.fontDokumen : base.fontDokumen
  const contentScale = isContentScale(input.contentScale)
    ? input.contentScale
    : parseContentScale(input.contentScale, base.contentScale)
  const bahasa = isLocale(input.bahasa) ? input.bahasa : base.bahasa

  const pembimbingLapangan = Array.isArray(input.pembimbingLapangan)
    ? sanitizePembimbing(input.pembimbingLapangan)
    : base.pembimbingLapangan
  const pembimbingLapanganDefault = resolvePembimbingDefault(
    pembimbingLapangan,
    input.pembimbingLapanganDefault,
  )

  const config: AppConfig = {
    profil,
    magang: { mulai, selesai } as RentangMagang,
    jamDefault,
    // Alasan dikelola user. Daftar kosong dibiarkan kosong (user boleh menghapus
    // semua), hanya input yang bukan array yang jatuh ke default.
    alasan: Array.isArray(input.alasan) ? sanitizeAlasan(input.alasan) : base.alasan,
    tema: asString(input.tema, base.tema),
    tierAnimasi: asString(input.tierAnimasi, base.tierAnimasi),
    ukuranKertas,
    folderExport: asString(input.folderExport, base.folderExport),
    formatJam,
    fontDokumen,
    contentScale,
    bahasa,
    tampilkanDevUi: asBoolean(input.tampilkanDevUi, base.tampilkanDevUi),
    dosenPembimbing: asString(input.dosenPembimbing, base.dosenPembimbing),
    pembimbingLapangan,
    pembimbingLapanganDefault,
  }

  return { value: config, issues }
}

/** Memvalidasi satu entri hari. Entri rusak dibuang oleh pemanggil. */
export function parseDayEntry(input: unknown): DayEntry | null {
  if (!isRecord(input)) return null
  if (!isIsoDate(input.date)) return null

  const status = DAY_STATUSES.includes(input.status as DayStatus)
    ? (input.status as DayStatus)
    : 'kosong'

  const alasanRaw = input.alasan
  const alasan = typeof alasanRaw === 'string' && alasanRaw.trim() !== '' ? alasanRaw : null

  return {
    date: input.date,
    masuk: normalizeJam(input.masuk),
    pulang: normalizeJam(input.pulang),
    kegiatan: asString(input.kegiatan),
    alasan,
    status,
  }
}

/** Memvalidasi seluruh data log. Entri yang rusak dibuang dan dicatat. */
export function parseLogData(input: unknown): ValidationResult<LogData> {
  const issues: string[] = []
  if (!isRecord(input)) {
    return { value: defaultLogData(), issues: ['Data log bukan objek, memakai kosong.'] }
  }

  const daysInput = isRecord(input.days) ? input.days : {}
  const days: Record<string, DayEntry> = {}

  for (const [key, raw] of Object.entries(daysInput)) {
    if (!isIsoDate(key)) {
      issues.push(`Kunci tanggal tidak valid: ${key}`)
      continue
    }
    const parsed = parseDayEntry(raw)
    if (!parsed) {
      issues.push(`Entri hari rusak dan dibuang: ${key}`)
      continue
    }
    if (parsed.date !== key) {
      issues.push(`Tanggal entri tidak cocok dengan kuncinya: ${key}`)
      continue
    }
    days[key] = parsed
  }

  const updatedAt =
    typeof input.updatedAt === 'string' ? input.updatedAt : new Date(0).toISOString()

  const namaPenandaTangan = sanitizeNamaPenandaTangan(input.namaPenandaTangan)

  return {
    value: { version: LOGS_VERSION, updatedAt, days, namaPenandaTangan },
    issues,
  }
}

/**
 * Memperbarui override nama penanda tangan satu minggu. Field yang diberikan `null`
 * atau string kosong dihapus, sehingga minggu itu kembali memakai default config.
 * Mengembalikan `changed` berisi weekId bila benar-benar berubah.
 */
export function applyNamaMingguPatch(
  current: LogData,
  weekId: string,
  patch: Partial<Record<keyof NamaMinggu, string | null>>,
): { data: LogData; changed: string[] } {
  if (weekId.trim() === '') return { data: current, changed: [] }

  const merged: Record<string, unknown> = { ...(current.namaPenandaTangan[weekId] ?? {}) }
  for (const [field, value] of Object.entries(patch)) {
    if (value == null || value.trim() === '') {
      delete merged[field]
    } else {
      merged[field] = value
    }
  }

  const cleaned = sanitizeNamaMinggu(merged)
  const namaPenandaTangan = { ...current.namaPenandaTangan }

  if (Object.keys(cleaned).length === 0) {
    if (!(weekId in namaPenandaTangan)) return { data: current, changed: [] }
    delete namaPenandaTangan[weekId]
  } else {
    namaPenandaTangan[weekId] = cleaned
  }

  return {
    data: { ...current, namaPenandaTangan, updatedAt: new Date().toISOString() },
    changed: [weekId],
  }
}

/**
 * Memperbarui sebagian entri hari. Hanya kunci yang dikirim yang berubah, sesuai
 * AGENTS.md bagian 7: "hanya menyerialkan bagian yang berubah".
 */
export function applyDayPatch(
  current: LogData,
  patch: Record<string, Partial<DayEntry> | null>,
): { data: LogData; changed: string[] } {
  const days = { ...current.days }
  const changed: string[] = []

  for (const [date, value] of Object.entries(patch)) {
    if (!isIsoDate(date)) continue
    if (value === null) {
      if (days[date]) {
        delete days[date]
        changed.push(date)
      }
      continue
    }
    const existing = days[date] ?? {
      date,
      masuk: null,
      pulang: null,
      kegiatan: '',
      alasan: null,
      status: 'kosong' as DayStatus,
    }
    const merged = parseDayEntry({ ...existing, ...value, date })
    if (!merged) continue
    days[date] = merged
    changed.push(date)
  }

  return {
    data: { ...current, days, updatedAt: new Date().toISOString() },
    changed,
  }
}
