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

import type { HariLuarBulan } from '@/lib/domain/types'
import type { MessageKey } from '@/lib/i18n/messages/id'

export type FontDokumen = 'times' | 'arial'

export const FONT_DOKUMEN_LIST: FontDokumen[] = ['times', 'arial']

/**
 * Key pesan nama font. Nama font resmi tetap sama di semua bahasa, tetapi disimpan
 * sebagai key agar tidak ada teks antarmuka yang keras di kode dan agar dapat dicari
 * dari kotak pencarian Pengaturan (AGENTS.md bagian 21 dan 22).
 */
export const FONT_DOKUMEN_LABEL_KEY: Record<FontDokumen, MessageKey> = {
  times: 'settings.font.times',
  arial: 'settings.font.arial',
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

/**
 * Perlakuan baris yang tidak relevan terhadap bulan halaman pada dokumen.
 * Daftar ini juga menjadi sumber urutan kartu di Pengaturan.
 */
export const HARI_LUAR_BULAN_LIST: HariLuarBulan[] = ['samarkan', 'hapus']

/**
 * Key pesan untuk nama perlakuan. Nama ikut bahasa antarmuka, jadi disimpan sebagai key
 * agar dapat dicari dari kotak pencarian Pengaturan (AGENTS.md bagian 21 dan 22).
 */
export const HARI_LUAR_BULAN_LABEL_KEY: Record<HariLuarBulan, MessageKey> = {
  samarkan: 'settings.hariLuarBulan.samarkan',
  hapus: 'settings.hariLuarBulan.hapus',
}

/** Benar bila nilai adalah perlakuan baris luar bulan yang dikenal. */
export function isHariLuarBulan(value: unknown): value is HariLuarBulan {
  return value === 'samarkan' || value === 'hapus'
}

/**
 * Menormalkan nilai dari data yang mungkin rusak. Nilai yang tidak dikenal jatuh ke
 * `fallback` supaya file konfigurasi yang rusak tidak membuat aplikasi gagal start.
 */
export function parseHariLuarBulan(value: unknown, fallback: HariLuarBulan): HariLuarBulan {
  return isHariLuarBulan(value) ? value : fallback
}

/** Skala tampilan konten Log Book di layar. Nilai 1 berarti ukuran bawaan. */
export type ContentScale = 0.9 | 1 | 1.15 | 1.3

export const CONTENT_SCALES: ContentScale[] = [0.9, 1, 1.15, 1.3]

/**
 * Key pesan untuk label skala konten. Labelnya ikut bahasa antarmuka, jadi disimpan
 * sebagai key, bukan teks siap pakai (AGENTS.md bagian 21).
 */
export const CONTENT_SCALE_LABEL_KEY: Record<ContentScale, MessageKey> = {
  0.9: 'settings.skala.kecil',
  1: 'settings.skala.normal',
  1.15: 'settings.skala.besar',
  1.3: 'settings.skala.sangatBesar',
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
