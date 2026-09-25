import { createContext, useContext } from 'react'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale'
import type { MessageKey } from '@/lib/i18n/messages/id'
import { translate, type Vars } from '@/lib/i18n/translate'

/**
 * Terjemahan untuk komponen (AGENTS.md bagian 21).
 *
 * Bahasa dibaca dari satu tempat, yaitu `config.bahasa`, lalu dibagikan lewat konteks.
 * Komponen memanggil `useT()` dan menulis `t('nav.pengaturan')`.
 *
 * MENGAPA KONTEKS, BUKAN HOOK KE STORE LANGSUNG: dengan konteks, seluruh pohon hanya
 * berlangganan SATU nilai bahasa. Bila setiap komponen berlangganan store sendiri,
 * berganti bahasa akan memberi banyak langganan tambahan tanpa manfaat.
 * Bahasa jarang berubah, jadi biaya render ulang saat berganti bahasa tidak masalah.
 */

/** Bentuk fungsi terjemahan yang dipakai komponen. */
export type Translator = (key: MessageKey, vars?: Vars) => string

export const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

/** Bahasa aktif. */
export function useLocale(): Locale {
  return useContext(LocaleContext)
}

/**
 * Fungsi terjemahan untuk bahasa aktif.
 *
 * Pemakaian: `const t = useT()` lalu `t('validasi.belumLengkap', { count: n, n })`.
 * Untuk bentuk jamak, kirim `count` agar bahasa yang punya aturan jamak memilih bentuk
 * yang tepat. Bahasa Indonesia memakai teks sama untuk keduanya.
 */
export function useT(): Translator {
  const locale = useLocale()
  return (key, vars) => translate(locale, key, vars)
}
