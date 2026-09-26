import type { Alasan } from './types'

/**
 * Pengelolaan daftar alasan hari kosong (AGENTS.md bagian 5.1 dan 11.8).
 *
 * Daftar ini bisa dikelola user di Settings. Semua fungsi MURNI, mengembalikan array
 * baru, dan tidak bergantung React.
 */

/**
 * Label yang pada versi lama otomatis membuat jam menjadi strip.
 *
 * Dulunya strip ditentukan dari nama alasan secara hardcode, jadi hanya dua label ini
 * yang bisa memicu. Dipakai sebagai nilai awal saat membaca `config.json` yang masih
 * menyimpan bentuk lama (`string[]`), supaya perilaku user tidak berubah setelah
 * migrasi.
 */
const LEGACY_STRIP_LABELS = ['sakit', 'izin']

/** Normalisasi kunci pembanding: trim dan huruf kecil. */
function kunci(label: string): string {
  return label.trim().toLowerCase()
}

/** Benar bila label ini adalah salah satu label yang dulu otomatis strip. */
export function isLegacyStripLabel(label: string): boolean {
  return LEGACY_STRIP_LABELS.includes(kunci(label))
}

/**
 * Membersihkan daftar alasan: trim spasi, buang entri kosong, dan buang duplikat
 * (perbandingan tanpa membedakan huruf besar/kecil) sambil menjaga urutan asli.
 *
 * Menerima DUA bentuk:
 * - bentuk lama `string[]`, misal `["Izin", "Sakit"]`. `stripJam` diambil dari aturan
 *   lama, jadi "Sakit" dan "Izin" tetap strip dan yang lain tidak.
 * - bentuk baru `Alasan[]`, misal `[{ label: "Sakit Gigi", stripJam: true }]`.
 *
 * Bentuk lain apa pun menghasilkan daftar kosong, sama seperti `sanitizeAlasan` lama,
 * supaya config yang rusak tidak membuat editor crash.
 */
export function sanitizeAlasan(input: unknown): Alasan[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const result: Alasan[] = []
  for (const item of input) {
    let label: unknown
    let stripJam: boolean
    if (typeof item === 'string') {
      label = item
      stripJam = isLegacyStripLabel(item)
    } else if (typeof item === 'object' && item !== null && 'label' in item) {
      const objek = item as { label?: unknown; stripJam?: unknown }
      label = objek.label
      stripJam = objek.stripJam === true
    } else {
      continue
    }
    if (typeof label !== 'string') continue
    const trimmed = label.trim()
    if (trimmed === '') continue
    const key = kunci(trimmed)
    if (seen.has(key)) continue
    seen.add(key)
    result.push({ label: trimmed, stripJam })
  }
  return result
}

/** Label saja, untuk dropdown dan cetak. */
export function alasanLabels(list: Alasan[]): string[] {
  return list.map((item) => item.label)
}

/**
 * Menambahkan alasan baru. Mengembalikan array lama (referensi sama) bila nilai
 * kosong atau sudah ada, sehingga pemanggil bisa mendeteksi "tidak ada perubahan"
 * cukup dengan perbandingan referensi.
 *
 * Alasan baru SELALU mulai dengan `stripJam: false`. Alasan bawaan "Sakit" dan
 * "Izin" sudah punya `true` dari definisi defaultnya, jadi tidak ada yang berubah
 * diam-diam. Setelah ditambah, user menandainya lewat toggle di Settings.
 */
export function addAlasan(list: Alasan[], value: string): Alasan[] {
  const trimmed = value.trim()
  if (trimmed === '') return list
  const key = kunci(trimmed)
  if (list.some((item) => kunci(item.label) === key)) return list
  return [...list, { label: trimmed, stripJam: false }]
}

/** Menghapus alasan dari daftar. Perbandingan tanpa membedakan huruf besar/kecil. */
export function removeAlasan(list: Alasan[], value: string): Alasan[] {
  const key = kunci(value)
  return list.filter((item) => kunci(item.label) !== key)
}

/**
 * Membalik tanda strip jam untuk satu alasan.
 *
 * Mengembalikan array baru, atau array lama (referensi sama) bila labelnya tidak ada
 * di daftar, supaya pemanggil bisa mendeteksi "tidak ada perubahan".
 */
export function toggleStripJam(list: Alasan[], value: string): Alasan[] {
  const key = kunci(value)
  let berubah = false
  const next = list.map((item) => {
    if (kunci(item.label) !== key) return item
    berubah = true
    return { ...item, stripJam: !item.stripJam }
  })
  return berubah ? next : list
}

/**
 * Menentukan apakah sebuah label alasan membuat jam menjadi strip.
 *
 * Alasan yang ada di daftar memakai `stripJam`-nya. Alasan yang DIKETIK BEBAS di
 * editor dan tidak ada di daftar memakai aturan lama, supaya mengetik "sakit" atau
 * "izin" tetap berperilaku seperti sebelumnya walau daftar sudah diubah.
 */
export function stripJamFor(list: Alasan[], label: string | null | undefined): boolean {
  const key = kunci(label ?? '')
  if (key === '') return false
  const found = list.find((item) => kunci(item.label) === key)
  if (found) return found.stripJam
  return isLegacyStripLabel(key)
}
