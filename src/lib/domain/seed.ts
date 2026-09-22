import { disabledReasonFor, type MagangRange } from './calendar'
import type { DayEntry, MonthGroup } from './types'

/**
 * Mode seed/demo (AGENTS.md bagian 15). Semua fungsi MURNI dan dapat diuji tanpa
 * React.
 */

/**
 * Kegiatan contoh yang dipakai seed, diputar berurutan per hari.
 * Teks sengaja umum agar masuk akal untuk magang apa pun.
 */
export const SEED_KEGIATAN: readonly string[] = [
  'Membuat laporan harian kegiatan magang',
  'Mempelajari alur pengembangan aplikasi di tempat magang',
  'Membantu memperbaiki bug pada aplikasi internal',
  'Mengikuti rapat tim pengembangan',
  'Menyusun dokumentasi modul yang dikerjakan',
  'Menguji fitur baru sebelum rilis ke pengguna',
]

/** Patch per tanggal, sejenis DayPatch di store tapi tanpa entri penghapusan. */
export type SeedPatch = Record<string, Partial<DayEntry>>

/**
 * Membangun patch pengisian contoh untuk SATU bulan.
 *
 * Hanya hari yang bisa diisi (dalam rentang magang dan milik bulan tersebut) yang
 * diisi; hari lain tidak disentuh. Isi hari ditimpa: kegiatan diisi contoh, alasan
 * dikosongkan, jam dikembalikan ke null agar memakai jam default.
 * Deterministik: bulan dan rentang yang sama selalu menghasilkan patch yang sama.
 */
export function buildSeedPatch(month: MonthGroup, range: MagangRange): SeedPatch {
  const patch: SeedPatch = {}
  let index = 0
  for (const week of month.weeks) {
    for (const day of week.days) {
      if (disabledReasonFor(day.date, month.key, range) !== null) continue
      patch[day.date] = {
        kegiatan: SEED_KEGIATAN[index % SEED_KEGIATAN.length] ?? '',
        alasan: null,
        status: 'terisi',
        masuk: null,
        pulang: null,
      }
      index += 1
    }
  }
  return patch
}
