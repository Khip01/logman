/**
 * Format jam untuk INPUT UI (AGENTS.md bagian 11.2).
 *
 * Nilai yang DISIMPAN selalu format titik 24 jam ("08.00"), apa pun format tampilan
 * yang dipilih user. Setelan 12/24 hanya memengaruhi cara jam ditampilkan dan
 * dimasukkan di UI. Dokumen cetak dan PDF selalu memakai 24 jam format titik, karena
 * mengikuti template resmi.
 *
 * Semua fungsi MURNI dan dapat diuji tanpa React.
 */

export type JamFormat = '24' | '12'

export function isJamFormat(value: unknown): value is JamFormat {
  return value === '24' || value === '12'
}

export type Meridiem = 'AM' | 'PM'

export interface JamParts {
  /** Jam 0 sampai 23. */
  hh: number
  /** Menit 0 sampai 59. */
  mm: number
}

/** Membaca "HH.MM" 24 jam. Null bila tidak valid. */
export function parseJam24(value: string): JamParts | null {
  const match = /^([01]\d|2[0-3])\.([0-5]\d)$/.exec(value.trim())
  if (!match) return null
  return { hh: Number(match[1]), mm: Number(match[2]) }
}

/** Menyusun "HH.MM" 24 jam. Null bila di luar rentang atau bukan bilangan bulat. */
export function toJam24(hh: number, mm: number): string | null {
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return null
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null
  return `${String(hh).padStart(2, '0')}.${String(mm).padStart(2, '0')}`
}

/** 24 jam ke 12 jam: 0 menjadi 12 AM, 12 menjadi 12 PM, 13 menjadi 1 PM. */
export function to12Hour(hh24: number): { hh: number; meridiem: Meridiem } {
  const meridiem: Meridiem = hh24 < 12 ? 'AM' : 'PM'
  const hh = hh24 % 12 === 0 ? 12 : hh24 % 12
  return { hh, meridiem }
}

/** 12 jam ke 24 jam: 12 AM menjadi 0, 12 PM menjadi 12. */
export function to24Hour(hh12: number, meridiem: Meridiem): number {
  if (meridiem === 'AM') return hh12 === 12 ? 0 : hh12
  return hh12 === 12 ? 12 : hh12 + 12
}

/**
 * Menampilkan jam tersimpan sesuai format pilihan. Nilai yang belum valid dibiarkan
 * apa adanya, sehingga input yang sedang diketik user tidak berubah di tengah jalan.
 */
export function formatJamDisplay(value: string, format: JamFormat): string {
  const parts = parseJam24(value)
  if (!parts) return value
  const mm = String(parts.mm).padStart(2, '0')
  if (format === '24') return `${String(parts.hh).padStart(2, '0')}.${mm}`
  const { hh, meridiem } = to12Hour(parts.hh)
  return `${hh}.${mm} ${meridiem}`
}

/**
 * Membaca masukan user sesuai format. Mengembalikan "HH.MM" 24 jam atau null.
 *
 * Format 24 menerima "08.00", "8.00", "08:00", dan "8", sama seperti normalizeJam.
 * Format 12 menerima "8.00 AM", "8:00 pm", "8 AM", dan "8". Bila meridiem tidak
 * disebut, dianggap AM, karena pemilih UI menyediakan toggle AM/PM terpisah.
 */
export function parseJamDisplay(input: string, format: JamFormat): string | null {
  const trimmed = input.trim()
  if (trimmed === '') return null
  return format === '24' ? parseJamLoose(trimmed) : parseJam12(trimmed)
}

function parseJamLoose(value: string): string | null {
  const withDot = value.replace(':', '.')
  const jamSaja = /^(\d{1,2})$/.exec(withDot)
  if (jamSaja) return toJam24(Number(jamSaja[1]), 0)
  const jamMenit = /^(\d{1,2})\.(\d{2})$/.exec(withDot)
  if (!jamMenit) return null
  return toJam24(Number(jamMenit[1]), Number(jamMenit[2]))
}

function parseJam12(value: string): string | null {
  const match = /^(\d{1,2})(?:[.:](\d{2}))?\s*(AM|PM)?$/i.exec(value)
  if (!match) return null
  const hh = Number(match[1])
  if (hh < 1 || hh > 12) return null
  const mm = match[2] ? Number(match[2]) : 0
  const meridiem = (match[3]?.toUpperCase() as Meridiem | undefined) ?? 'AM'
  return toJam24(to24Hour(hh, meridiem), mm)
}

/** Daftar menit untuk pemilih, kelipatan lima, ditambah menit aktif bila bukan kelipatan. */
export function minuteOptions(active: number | null): number[] {
  const base = Array.from({ length: 12 }, (_, i) => i * 5)
  if (
    active != null &&
    Number.isInteger(active) &&
    active >= 0 &&
    active <= 59 &&
    !base.includes(active)
  ) {
    return [...base, active].sort((a, b) => a - b)
  }
  return base
}
