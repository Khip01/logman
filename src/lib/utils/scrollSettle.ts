/**
 * Menunggu gulir mendarat, lalu menjalankan callback (AGENTS.md bagian 22).
 *
 * Dipakai kilau seksi Pengaturan: kilau TIDAK boleh mulai saat halaman masih bergulir,
 * karena animasinya akan selesai sebelum seksi tujuannya terlihat. Kilau baru dijalankan
 * setelah gulir benar-benar berhenti.
 *
 * Cara kerjanya:
 * - `scrollend` dipakai sebagai jalur cepat bila browser mendukungnya.
 * - Diperiksa juga kestabilan posisi gulir lewat beberapa frame berturut-turut. Ini yang
 *   menangani dua kasus yang tidak tertangkap `scrollend`: seksi sudah terlihat sehingga
 *   TIDAK ada gulir sama sekali, dan browser yang belum punya `scrollend`.
 * - Batas waktu pengaman memastikan callback tetap jalan, apa pun yang terjadi.
 *
 * Pemeriksaan posisi hanya berjalan selama transisi (sekitar satu detik), bukan
 * pendengar gulir permanen. Untuk ingatan posisi gulir antar halaman, aturan "tanpa
 * pendengar gulir" di bagian 11.4 tetap berlaku dan TIDAK memakai modul ini.
 *
 * Mengembalikan fungsi pembatalan. Selalu panggil di pembersihan efek React, supaya
 * permintaan yang sudah digantikan tidak ikut menjalankan callback-nya.
 */

/** Jumlah frame berturut-turut dengan posisi tetap sebelum dianggap mendarat. */
const FRAME_STABIL = 3

/** Batas waktu pengaman, dalam milidetik. */
const BATAS_WAKTU_MS = 1200

export function onScrollSettle(container: HTMLElement, callback: () => void): () => void {
  let selesai = false
  let frameId: number | undefined
  let fallbackTimer: number | undefined
  let frameTenang = 0
  let posisiTerakhir = container.scrollTop

  function bersihkan() {
    container.removeEventListener('scrollend', jalankan)
    if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer)
    if (frameId !== undefined) window.cancelAnimationFrame(frameId)
  }

  function jalankan() {
    if (selesai) return
    selesai = true
    bersihkan()
    callback()
  }

  // Jalur cepat: event bawaan Chromium untuk "gulir selesai".
  if ('onscrollend' in container) {
    container.addEventListener('scrollend', jalankan, { once: true })
  }

  // Jalur utama: tunggu posisi gulir diam beberapa frame berturut-turut.
  function periksa() {
    const posisi = container.scrollTop
    if (Math.abs(posisi - posisiTerakhir) < 0.5) {
      frameTenang += 1
      if (frameTenang >= FRAME_STABIL) {
        jalankan()
        return
      }
    } else {
      frameTenang = 0
    }
    posisiTerakhir = posisi
    frameId = window.requestAnimationFrame(periksa)
  }

  frameId = window.requestAnimationFrame(periksa)
  fallbackTimer = window.setTimeout(jalankan, BATAS_WAKTU_MS)

  return bersihkan
}
