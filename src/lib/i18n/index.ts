/**
 * Titik masuk modul i18n (AGENTS.md bagian 21).
 *
 * Pemakaian di komponen:
 * ```tsx
 * const t = useT()
 * return <h1>{t('settings.judul')}</h1>
 * ```
 *
 * Menambah bahasa baru:
 * 1. Salin `messages/en.ts`, ganti isinya, dan jaga tipe `Catalog`.
 * 2. Daftarkan di `CATALOGS` pada `translate.ts`.
 * 3. Tambahkan kodenya di `locale.ts` beserta nama hari dan bulannya.
 */
export { BULAN, BULAN_SHORT, DEFAULT_LOCALE, HARI, isLocale, LOCALES, type Locale } from './locale'
export type { Catalog, Message, MessageKey } from './messages/id'
export { catalogFor, interpolate, missingKeys, translate, type Vars } from './translate'
export { LocaleContext, type Translator, useLocale, useT } from './useT'
