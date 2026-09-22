import type { UkuranKertas } from './types'

/**
 * Pemetaan ukuran kertas ke nilai CSS `@page size` (AGENTS.md bagian 12).
 *
 * Dipakai oleh render PDF di server dan injeksi style cetak di browser, sehingga
 * keduanya selalu memakai sumber yang sama (satu sumber kebenaran).
 */
const PAGE_SIZE_CSS: Record<UkuranKertas, string> = {
  A4: 'A4',
  F4: '215mm 330mm',
  Letter: 'Letter',
}

/** Margin dokumen sesuai template: 2.54 cm semua sisi (AGENTS.md bagian 11.1). */
export const PAGE_MARGIN_CM = 2.54

/** Nilai CSS `@page size` untuk sebuah ukuran kertas. */
export function paperSizeCss(ukuran: UkuranKertas): string {
  return PAGE_SIZE_CSS[ukuran] ?? 'A4'
}

/** Isi tag `@page` untuk ditulis runtime di browser (lihat Shell dan bagian 12). */
export function pageStyleContent(ukuran: UkuranKertas): string {
  return `@page { size: ${paperSizeCss(ukuran)}; margin: ${PAGE_MARGIN_CM}cm; }`
}
