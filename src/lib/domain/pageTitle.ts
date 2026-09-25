import type { Locale } from '@/lib/i18n/locale'
import type { MessageKey } from '@/lib/i18n/messages/id'
import { translate } from '@/lib/i18n/translate'

/**
 * Judul dokumen per halaman (AGENTS.md bagian 21).
 *
 * Dipisah dari komponen agar dapat diuji tanpa React. Judul dibangun dari path route,
 * bukan dari breadcrumb, supaya tidak bergantung pada teks yang sudah diterjemahkan.
 */

/** Nama produk yang tampil di judul tab. */
export const APP_NAME = 'Log Book Manager'

/** Key judul untuk setiap route yang punya halaman. */
const TITLE_KEY: Record<string, MessageKey> = {
  '/': 'logbook.judul',
  '/settings': 'settings.judul',
  '/export': 'ekspor.judul',
  '/dev/components': 'dev.komponen.judul',
  '/dev/motion': 'dev.motion.judul',
  '/dev/perf': 'dev.perf.judul',
  '/dev/seed': 'dev.seed.judul',
}

/**
 * Judul dokumen untuk sebuah path.
 *
 * Halaman utama memakai nama produk saja, halaman lain memakai pola
 * `<nama halaman> - <nama produk>`. Path yang tidak dikenal memakai judul "tidak
 * ditemukan", sehingga tab tidak pernah kosong.
 */
export function pageTitleFor(path: string, locale: Locale): string {
  if (path === '/') return APP_NAME
  const key = TITLE_KEY[path]
  const name = translate(locale, key ?? 'error.tidakDitemukan')
  return `${name} - ${APP_NAME}`
}
