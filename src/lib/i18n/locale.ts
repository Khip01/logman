/**
 * Bahasa yang didukung aplikasi (AGENTS.md bagian 21).
 *
 * Nama hari dan bulan tinggal di sini, bukan di katalog pesan, karena keduanya adalah
 * DATA TANGGAL, bukan teks antarmuka. Dengan begitu logika tanggal murni di
 * `src/lib/domain/date.ts` dapat memformat tanggal untuk bahasa mana pun tanpa React.
 */

export type Locale = 'id' | 'en'

export const LOCALES: Locale[] = ['id', 'en']

/** Bahasa bawaan aplikasi. */
export const DEFAULT_LOCALE: Locale = 'id'

export function isLocale(value: unknown): value is Locale {
  return value === 'id' || value === 'en'
}

/** Nama hari panjang, indeks 0 = Minggu (sama dengan `Date.getDay`). */
export const HARI: Record<Locale, readonly string[]> = {
  id: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}

/** Nama bulan panjang, indeks 0 = Januari. */
export const BULAN: Record<Locale, readonly string[]> = {
  id: [
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
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
}

/** Nama bulan pendek tiga huruf untuk label ringkas. */
export const BULAN_SHORT: Record<Locale, readonly string[]> = {
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}
