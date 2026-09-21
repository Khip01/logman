import {
  addDays,
  dayNameId,
  formatTanggalId,
  isIsoDate,
  isWithin,
  mondayOf,
  monthKey,
  monthLabel,
  monthShort,
  saturdayOf,
  toIsoDate,
} from './date'
import type { DayEntry, DayOfWeek, DayStatus, MonthGroup, WeekEntry } from './types'

/**
 * Logika kalender Log Book (AGENTS.md bagian 6). SEMUA fungsi di sini MURNI dan
 * menjadi sumber kebenaran untuk:
 *
 * 1. Minggu adalah wadah, isinya boleh berasal dari dua bulan berbeda.
 * 2. Kepemilikan baris hari mengikuti BULAN DARI TANGGAL hari itu, bukan bulan minggu.
 * 3. Baris milik bulan lain tetap tampil tetapi disabled dan redup.
 * 4. Minggu lintas bulan muncul di DUA bulan.
 * 5. Nomor minggu di-reset per bulan (M1, M2, ... per grup bulan).
 * 6. Hari di luar rentang magang diperlakukan sama seperti baris milik bulan lain.
 *
 * Semua fungsi wajib punya unit test, termasuk kasus lintas bulan, lintas tahun, dan
 * rentang partial di kedua ujung.
 */

const HARI_KERJA: DayOfWeek[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']

/** Memetakan sebuah tanggal ke nama hari kerja, atau null bila Sabtu/Minggu. */
export function dayOfWeekKey(iso: string): DayOfWeek | null {
  const lower = dayNameId(iso).toLowerCase()
  return (HARI_KERJA as string[]).includes(lower) ? (lower as DayOfWeek) : null
}

/** Status default untuk sebuah hari: kosong bila belum diisi. */
export function defaultDayStatus(): DayStatus {
  return 'kosong'
}

/**
 * Alasan mengapa sebuah baris disabled. `null` berarti baris aktif dan bisa diisi.
 * Dipakai UI untuk memberi gaya redup dan pesan.
 */
export type DisabledReason = 'bulan-lain' | 'sebelum-magang' | 'setelah-magang'

export interface MagangRange {
  mulai: string | null
  selesai: string | null
}

/**
 * Menentukan apakah sebuah tanggal bisa diisi pada bulan yang sedang dibuka.
 * Ini fungsi inti dari aturan kepemilikan baris.
 *
 * @param iso tanggal baris
 * @param activeMonth kunci bulan yang sedang dibuka, format `YYYY-MM`
 * @param range rentang magang, boleh null bila belum diatur
 */
export function disabledReasonFor(
  iso: string,
  activeMonth: string,
  range: MagangRange,
): DisabledReason | null {
  if (range.mulai && iso < range.mulai) return 'sebelum-magang'
  if (range.selesai && iso > range.selesai) return 'setelah-magang'
  if (monthKey(iso) !== activeMonth) return 'bulan-lain'
  return null
}

/** Benar bila baris aktif (bisa diisi) pada bulan yang sedang dibuka. */
export function isDayActive(iso: string, activeMonth: string, range: MagangRange): boolean {
  return disabledReasonFor(iso, activeMonth, range) === null
}

/** Membuat entri hari kosong untuk sebuah tanggal. */
export function createEmptyDay(iso: string): DayEntry {
  return {
    date: iso,
    masuk: null,
    pulang: null,
    kegiatan: '',
    alasan: null,
    status: defaultDayStatus(),
  }
}

/**
 * Membangun daftar hari untuk sebuah minggu, selalu enam baris Senin sampai Sabtu.
 * Baris tetap ada walau di luar rentang; UI yang men-disable lewat `disabledReasonFor`.
 */
export function buildWeekDays(mondayIso: string): DayEntry[] {
  return Array.from({ length: 6 }, (_, index) => createEmptyDay(addDays(mondayIso, index)))
}

/**
 * Menghasilkan semua Senin dari minggu yang menyentuh rentang magang, inklusif.
 * Senin pertama bisa berada sebelum `mulai` bila rentang tidak mulai hari Senin.
 */
export function mondaysInRange(mulai: string, selesai: string): string[] {
  const result: string[] = []
  let cursor = mondayOf(mulai)
  const last = mondayOf(selesai)
  while (cursor <= last) {
    result.push(cursor)
    cursor = addDays(cursor, 7)
  }
  return result
}

/**
 * Membangun grup bulan beserta minggu-minggunya dari rentang magang.
 *
 * Aturan: sebuah minggu dimasukkan ke SETIAP bulan yang punya minimal satu hari
 * di dalam minggu itu DAN berada dalam rentang magang. Karena itu minggu lintas bulan
 * bisa muncul di dua grup (AGENTS.md bagian 6 poin 6).
 *
 * Nomor minggu dihitung berurutan di dalam grup, mulai 1. Karena minggu dalam satu
 * grup selalu berurutan, ini ekuivalen dengan "minggu pertama bulan itu adalah M1".
 */
export function buildMonthGroups(mulai: string, selesai: string): MonthGroup[] {
  if (!isIsoDate(mulai) || !isIsoDate(selesai) || mulai > selesai) {
    return []
  }

  const allMondays = mondaysInRange(mulai, selesai)

  // Kumpulkan kunci bulan unik yang tersentuh rentang, terurut.
  const keys = new Set<string>()
  for (const monday of allMondays) {
    for (let i = 0; i < 6; i += 1) {
      const iso = addDays(monday, i)
      if (isWithin(iso, mulai, selesai)) keys.add(monthKey(iso))
    }
  }
  const sortedKeys = [...keys].sort()

  return sortedKeys.map((key) => {
    const weeks: WeekEntry[] = []

    for (const monday of allMondays) {
      const days = buildWeekDays(monday)
      const belongs = days.some(
        (day) => monthKey(day.date) === key && isWithin(day.date, mulai, selesai),
      )
      if (!belongs) continue

      weeks.push({
        id: monday,
        startDate: monday,
        endDate: saturdayOf(monday),
        weekOfMonth: weeks.length + 1,
        days,
      })
    }

    return {
      key,
      label: monthLabel(key),
      short: monthShort(key),
      weeks,
    }
  })
}

/** Tanggal-tanggal dalam sebuah minggu, Senin sampai Sabtu. */
export function weekDates(mondayIso: string): string[] {
  return Array.from({ length: 6 }, (_, index) => addDays(mondayIso, index))
}

/** Label rentang minggu untuk sidebar, misal "31 Agu - 5 Sep". */
export function formatWeekRange(mondayIso: string): string {
  const short = (iso: string) => {
    const [, m, d] = iso.split('-').map(Number)
    const bulan = [
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
    ]
    return `${d} ${bulan[(m ?? 1) - 1]}`
  }
  return `${short(mondayIso)} - ${short(saturdayOf(mondayIso))}`
}

/** Tanggal hari ini sebagai ISO. Dipakai untuk menandai hari ini di UI. */
export function todayIso(): string {
  return toIsoDate(new Date())
}

/** Format tanggal lengkap untuk header dokumen. */
export function documentDateLabel(iso: string): string {
  return formatTanggalId(iso)
}
