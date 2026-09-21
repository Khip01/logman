/**
 * Pengelolaan daftar alasan hari kosong (AGENTS.md bagian 5.1 dan 11.3).
 *
 * Daftar ini bisa dikelola user di Settings. Semua fungsi MURNI, mengembalikan array
 * baru, dan tidak bergantung React.
 */

/**
 * Membersihkan daftar: trim spasi, buang entri kosong, dan buang duplikat
 * (perbandingan tanpa membedakan huruf besar/kecil) sambil menjaga urutan asli.
 */
export function sanitizeAlasan(input: unknown): string[] {
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
 * Menambahkan alasan baru. Mengembalikan array lama (referensi sama) bila nilai
 * kosong atau sudah ada, sehingga pemanggil bisa mendeteksi "tidak ada perubahan"
 * cukup dengan perbandingan referensi.
 */
export function addAlasan(list: string[], value: string): string[] {
  const trimmed = value.trim()
  if (trimmed === '') return list
  const key = trimmed.toLowerCase()
  if (list.some((item) => item.toLowerCase() === key)) return list
  return [...list, trimmed]
}

/** Menghapus alasan dari daftar. Perbandingan tanpa membedakan huruf besar/kecil. */
export function removeAlasan(list: string[], value: string): string[] {
  const key = value.trim().toLowerCase()
  return list.filter((item) => item.toLowerCase() !== key)
}
