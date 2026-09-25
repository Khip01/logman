import { DEFAULT_LOCALE, type Locale } from './locale'
import { en } from './messages/en'
import { type Catalog, id, type Message, type MessageKey } from './messages/id'

/**
 * Mesin terjemahan (AGENTS.md bagian 21). Murni, tanpa React, sehingga mudah diuji.
 *
 * Desain yang dipilih agar tahan lama:
 * 1. Key berupa ID bertitik, BUKAN kalimat. Mengubah teks tidak merusak bahasa lain.
 * 2. Katalog bertipe `Catalog`, sehingga key yang hilang atau berlebih ditolak saat
 *    compile, bukan jadi bug diam saat runtime.
 * 3. Interpolasi memakai `{nama}` dengan nilai string atau angka.
 * 4. Bentuk jamak memilih `one` atau `other` berdasarkan `count`.
 */

const CATALOGS: Record<Locale, Catalog> = { id, en }

/** Mengambil katalog sebuah bahasa. */
export function catalogFor(locale: Locale): Catalog {
  return CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE]
}

export type Vars = Record<string, string | number>

/** Mengganti placeholder `{nama}` dengan nilainya. Placeholder tanpa nilai dibiarkan. */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  )
}

/**
 * Menerjemahkan sebuah key.
 *
 * @param locale bahasa tujuan
 * @param key    key pesan, misal `nav.pengaturan`
 * @param vars   nilai placeholder, dan `count` untuk memilih bentuk jamak
 */
export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  const message: Message = catalogFor(locale)[key] ?? id[key]
  if (typeof message === 'string') return interpolate(message, vars)

  // Bentuk jamak: bahasa Indonesia memakai teks sama, bahasa Inggris memilih one/other.
  const count = typeof vars?.count === 'number' ? vars.count : undefined
  const chosen = count === 1 ? message.one : message.other
  return interpolate(chosen, vars)
}

/** Daftar key yang belum diterjemahkan pada sebuah bahasa, berguna untuk test dan audit. */
export function missingKeys(locale: Locale): MessageKey[] {
  const catalog = catalogFor(locale)
  return (Object.keys(id) as MessageKey[]).filter((key) => catalog[key] === undefined)
}
