/**
 * Ingatan posisi scroll per halaman (AGENTS.md bagian 11.4).
 *
 * Setiap path menyimpan posisi scroll terakhirnya SELAMA SESI. Halaman yang belum pernah
 * dikunjungi mulai dari atas. Ingatan ini sengaja hanya di memori, bukan `sessionStorage`,
 * sehingga refresh atau tab baru selalu mulai dari atas.
 *
 * PERFORMA: modul ini TIDAK punya scroll listener. Pemanggil hanya menulis sekali saat
 * berpindah halaman, jadi menggulir tidak menimbulkan biaya apa pun. Lihat `Shell.tsx`.
 *
 * Fungsi di sini murni dan tidak menyentuh DOM, sehingga mudah diuji.
 */

const positions = new Map<string, number>()

/** Posisi scroll tersimpan untuk sebuah path. Halaman baru mengembalikan 0 (paling atas). */
export function readScroll(path: string): number {
  return positions.get(path) ?? 0
}

/** Menyimpan posisi scroll sebuah path. Nilai dibulatkan dan tidak pernah negatif. */
export function saveScroll(path: string, top: number): void {
  const normalized = Number.isFinite(top) ? Math.max(0, Math.round(top)) : 0
  positions.set(path, normalized)
}

/** Mengosongkan seluruh ingatan. Dipakai test agar tidak bocor antar kasus. */
export function clearScrollMemory(): void {
  positions.clear()
}
