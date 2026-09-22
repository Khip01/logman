import type { NamaMinggu, PenandaTanganDefaults } from './types'

/**
 * Pengelolaan daftar Pembimbing Lapangan dan resolusi nama penanda tangan
 * (AGENTS.md bagian 5.1 dan 11.5).
 *
 * Pembimbing Lapangan bisa lebih dari satu dan dapat bergantian per minggu. Daftar
 * nama dikelola di Settings, sedangkan pilihan per minggu disimpan bersama data log.
 * Semua fungsi MURNI.
 */

/** Membersihkan daftar pembimbing: trim, buang kosong, buang duplikat tanpa beda huruf. */
export function sanitizePembimbing(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of input) {
    if (typeof item !== 'string') continue
    const trimmed = item.trim()
    if (trimmed === '') continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }
  return result
}

/**
 * Menambah pembimbing. Mengembalikan referensi yang sama bila kosong atau duplikat,
 * sehingga pemanggil bisa mendeteksi "tidak ada perubahan" lewat perbandingan referensi.
 */
export function tambahPembimbing(list: string[], value: string): string[] {
  const trimmed = value.trim()
  if (trimmed === '') return list
  const key = trimmed.toLowerCase()
  if (list.some((item) => item.toLowerCase() === key)) return list
  return [...list, trimmed]
}

/** Menghapus pembimbing. Perbandingan tanpa membedakan huruf besar/kecil. */
export function hapusPembimbing(list: string[], value: string): string[] {
  const key = value.trim().toLowerCase()
  return list.filter((item) => item.toLowerCase() !== key)
}

/**
 * Menandai pembimbing default. Hanya nama yang ada di daftar yang diterima, sehingga
 * default tidak pernah menunjuk nama yang sudah dihapus.
 */
export function setDefaultPembimbing(list: string[], value: string | null): string | null {
  if (value == null) return null
  const key = value.trim().toLowerCase()
  const found = list.find((item) => item.toLowerCase() === key)
  return found ?? null
}

/**
 * Menyelesaikan daftar pembimbing dengan default. Dipakai parseConfig: bila default
 * hilang atau tidak ada di daftar, jatuh ke nama pertama, atau null bila daftar kosong.
 */
export function resolvePembimbingDefault(list: string[], value: unknown): string | null {
  const explicit = typeof value === 'string' ? setDefaultPembimbing(list, value) : null
  if (explicit) return explicit
  return list[0] ?? null
}

/** Membersihkan sebuah nama: trim, dan kembalikan undefined bila kosong. */
const cleanNama = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/** Membersihkan override nama satu minggu. Field kosong dibuang agar jatuh ke default. */
export function sanitizeNamaMinggu(input: unknown): NamaMinggu {
  if (typeof input !== 'object' || input == null) return {}
  const raw = input as Record<string, unknown>
  const result: NamaMinggu = {}
  const mahasiswa = cleanNama(raw.mahasiswa)
  const dosen = cleanNama(raw.dosen)
  const pembimbing = cleanNama(raw.pembimbing)
  if (mahasiswa) result.mahasiswa = mahasiswa
  if (dosen) result.dosen = dosen
  if (pembimbing) result.pembimbing = pembimbing
  return result
}

/** Membersihkan peta override nama per minggu, membuang entri yang kosong. */
export function sanitizeNamaPenandaTangan(input: unknown): Record<string, NamaMinggu> {
  if (typeof input !== 'object' || input == null) return {}
  const raw = input as Record<string, unknown>
  const result: Record<string, NamaMinggu> = {}
  for (const [weekId, value] of Object.entries(raw)) {
    if (weekId.trim() === '') continue
    const cleaned = sanitizeNamaMinggu(value)
    if (Object.keys(cleaned).length === 0) continue
    result[weekId] = cleaned
  }
  return result
}

/** Nama penanda tangan efektif untuk satu minggu, hasil gabungan override dan default. */
export interface ResolvedNama {
  mahasiswa: string
  dosen: string
  pembimbing: string
}

/** Menggabungkan override minggu dengan default config. Semua string kosong bila kosong. */
export function resolveNamaMinggu(
  override: NamaMinggu | undefined,
  defaults: PenandaTanganDefaults,
): ResolvedNama {
  return {
    mahasiswa: override?.mahasiswa ?? defaults.mahasiswa,
    dosen: override?.dosen ?? defaults.dosen,
    pembimbing: override?.pembimbing ?? defaults.pembimbing,
  }
}
