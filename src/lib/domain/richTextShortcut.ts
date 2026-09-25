/**
 * Logika pintasan format teks di editor Kegiatan (AGENTS.md bagian 11.6).
 *
 * Murni dan tanpa DOM, sehingga perilakunya dapat diuji tanpa browser. Komponen hanya
 * bertugas meneruskan posisi kursor dan memakai hasilnya.
 */

export type Penanda = '**' | '*'

export interface HasilBungkus {
  /** Teks baru setelah penanda ditambahkan atau dilepas. */
  teks: string
  /** Posisi kursor awal setelah perubahan. */
  mulai: number
  /** Posisi kursor akhir setelah perubahan. */
  akhir: number
}

/**
 * Membungkus teks terpilih dengan penanda, atau melepasnya bila sudah terbungkus.
 *
 * Perilaku:
 * - Ada teks terpilih dan belum terbungkus: bungkus pilihan, lalu seleksi tetap pada teks
 *   aslinya supaya user bisa langsung melanjutkan.
 * - Ada teks terpilih dan sudah terbungkus (termasuk penanda tepat di luar pilihan):
 *   lepas penandanya.
 * - Tidak ada pilihan: sisipkan sepasang penanda dan letakkan kursor di antaranya, supaya
 *   user bisa langsung mengetik isinya.
 *
 * Penanda tebal diperiksa lebih dulu, karena `*miring*` juga cocok dengan pola `**`.
 */
export function toggleInlineWrap(
  teks: string,
  mulai: number,
  akhir: number,
  penanda: Penanda,
): HasilBungkus {
  const awal = Math.max(0, Math.min(mulai, akhir))
  const akhirSehat = Math.min(teks.length, Math.max(mulai, akhir))
  const len = penanda.length
  const terpilih = teks.slice(awal, akhirSehat)

  // Kasus tanpa pilihan: sisipkan penanda kosong dan taruh kursor di tengahnya.
  if (terpilih === '') {
    const isi = penanda + penanda
    return {
      teks: teks.slice(0, awal) + isi + teks.slice(awal),
      mulai: awal + len,
      akhir: awal + len,
    }
  }

  const sebelum = teks.slice(awal - len, awal)
  const sesudah = teks.slice(akhirSehat, akhirSehat + len)

  /*
   * Penanda tebal dan miring sama-sama memakai bintang, jadi satu bintang tidak boleh
   * dianggap penanda miring bila ia sebenarnya bagian dari pasangan tebal. Tanpa penjagaan
   * ini, menekan Ctrl+I pada teks yang sudah tebal akan MELEPAS satu bintang dan
   * mengubahnya menjadi miring, padahal yang diinginkan adalah menambah miring.
   */
  const bukanBagianPenandaPanjang = (posisi: number): boolean =>
    penanda === '**' || teks[posisi] !== '*'

  const terpilihSudahTerbungkus =
    terpilih.length >= len * 2 &&
    terpilih.startsWith(penanda) &&
    terpilih.endsWith(penanda) &&
    bukanBagianPenandaPanjang(1) &&
    bukanBagianPenandaPanjang(terpilih.length - 2)

  const diluarSudahTerbungkus =
    sebelum === penanda &&
    sesudah === penanda &&
    bukanBagianPenandaPanjang(awal - 2) &&
    bukanBagianPenandaPanjang(akhirSehat + 1)

  if (diluarSudahTerbungkus) {
    // Penanda berada tepat di luar pilihan: buang penandanya.
    return {
      teks: teks.slice(0, awal - len) + terpilih + teks.slice(akhirSehat + len),
      mulai: awal - len,
      akhir: akhirSehat - len,
    }
  }

  if (terpilihSudahTerbungkus) {
    // Penanda ikut tersorot: buang penanda di dalam pilihan.
    const dalam = terpilih.slice(len, terpilih.length - len)
    return {
      teks: teks.slice(0, awal) + dalam + teks.slice(akhirSehat),
      mulai: awal,
      akhir: awal + dalam.length,
    }
  }

  return {
    teks: teks.slice(0, awal) + penanda + terpilih + penanda + teks.slice(akhirSehat),
    mulai: awal + len,
    akhir: akhirSehat + len,
  }
}

/**
 * Penanda yang cocok untuk tombol pintasan.
 *
 * `b` untuk tebal dan `i` untuk miring, mengikuti kebiasaan editor teks pada umumnya.
 * Mengembalikan null bila tombolnya bukan pintasan format.
 */
export function penandaUntukTombol(tombol: string): Penanda | null {
  const kunci = tombol.toLowerCase()
  if (kunci === 'b') return '**'
  if (kunci === 'i') return '*'
  return null
}
