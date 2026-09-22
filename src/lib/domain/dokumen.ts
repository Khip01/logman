/**
 * Setelan tampilan dokumen: font dokumen dan skala tampilan konten
 * (AGENTS.md bagian 10 dan 11.2).
 *
 * Font dokumen hanya memengaruhi layer DOKUMEN: tabel cetak, kop surat, blok tanda
 * tangan, preview cetak, dan PDF ekspor. UI aplikasi tetap memakai font sans sendiri.
 *
 * Skala konten hanya memengaruhi UKURAN TAMPILAN di layar. Dokumen cetak dan PDF
 * selalu memakai ukuran resmi template (Times 12 pt), apa pun skala layar yang dipilih,
 * supaya hasil cetak tetap sesuai format kampus.
 *
 * Semua fungsi MURNI dan dapat diuji tanpa React.
 */

export type FontDokumen = 'times' | 'arial'

export const FONT_DOKUMEN_LIST: FontDokumen[] = ['times', 'arial']

export const FONT_DOKUMEN_LABEL: Record<FontDokumen, string> = {
  times: 'Times New Roman',
  arial: 'Arial',
}

/**
 * Rangkaian font CSS untuk tiap pilihan. Dipakai server PDF dan (lewat salinan yang
 * sama di tokens.css) browser, sehingga layar dan PDF selalu memakai font yang sama.
 */
export const FONT_DOKUMEN_STACK: Record<FontDokumen, string> = {
  times: '"Times New Roman", Times, serif',
  arial: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
}

export function isFontDokumen(value: unknown): value is FontDokumen {
  return value === 'times' || value === 'arial'
}

/** Skala tampilan konten Log Book di layar. Nilai 1 berarti ukuran bawaan. */
export type ContentScale = 0.9 | 1 | 1.15 | 1.3

export const CONTENT_SCALES: ContentScale[] = [0.9, 1, 1.15, 1.3]

export const CONTENT_SCALE_LABEL: Record<ContentScale, string> = {
  0.9: 'Kecil',
  1: 'Normal',
  1.15: 'Besar',
  1.3: 'Sangat besar',
}

export function isContentScale(value: unknown): value is ContentScale {
  return value === 0.9 || value === 1 || value === 1.15 || value === 1.3
}

/**
 * Menormalkan skala konten dari data yang mungkin rusak. Nilai angka di luar daftar
 * tetap diterima bila masuk rentang wajar, agar konfigurasi lama tidak langsung jatuh
 * ke default. Selain itu memakai `fallback`.
 */
export function parseContentScale(value: unknown, fallback: ContentScale = 1): ContentScale {
  if (isContentScale(value)) return value
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0.5 && value <= 2) {
    return value as ContentScale
  }
  return fallback
}

/**
 * Ukuran font dasar dokumen di layar, dalam piksel, untuk skala tertentu. Ukuran cetak
 * resmi tetap 12 pt (sekitar 16 px); skala hanya memperbesar tampilan layar.
 */
export function docFontSizePx(scale: ContentScale): number {
  return Math.round(16 * scale * 100) / 100
}
