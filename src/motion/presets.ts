import type { Transition, Variants } from 'motion/react'
import type { MotionTierProfile } from './tiers'

/**
 * Layer preset animasi. SEMUA animasi aplikasi harus memakai preset di sini,
 * bukan menulis `motion.div` langsung di komponen (AGENTS.md bagian 8.3).
 *
 * Aturan properti (AGENTS.md bagian 8.2): hanya `transform` dan `opacity`.
 * Dilarang menganimasikan width/height/top/left/margin/padding.
 */

export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.7,
}

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, transition: { duration: 0.14, ease: EASE_OUT_EXPO } },
}

export const sidebarVariants: Variants = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: springSoft },
  exit: { x: '-100%', transition: { duration: 0.2, ease: EASE_OUT_EXPO } },
}

export const staggerListVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.04 } },
}

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT_EXPO } },
}

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: EASE_OUT_EXPO } },
}

/** Denyut halus untuk animasi idle. Dipakai hanya pada tier yang mengaktifkannya. */
export const pulseVariants: Variants = {
  rest: { opacity: 0.35 },
  pulse: {
    opacity: [0.35, 1, 0.35],
    transition: { duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
  },
}

/** Transisi indikator yang bergeser pada segmented control (shared layout). */
export const segmentIndicatorTransition: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 42,
  mass: 0.6,
}

/**
 * Transisi untuk animasi hentakan (misal durasi di atas tombol yang bergeser).
 *
 * CATATAN ATURAN: transisi ini TIDAK mengubah properti tata letak. Ia hanya dipakai
 * pada sumbu `y` (yang diterjemahkan Motion menjadi `transform: translateY`), sehingga
 * tetap patuh pada aturan "hanya transform dan opacity" (AGENTS.md bagian 8.2).
 */
export const popTransition: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 30,
  mass: 0.5,
}

export interface TierPreviewVariants {
  window: Variants
  panel: Variants
  list: Variants
  item: Variants
}

/**
 * Lama kilatan baris, dalam detik, untuk sebuah tier. 0 berarti tidak ada kilatan.
 *
 * Dipakai bersama oleh varian animasi dan oleh baris tabel yang perlu tahu kapan kilatan
 * selesai (untuk membersihkan permintaan fokus). Satu rumus, satu sumber kebenaran.
 */
export function rowFlashDurationSeconds(profile: MotionTierProfile): number {
  if (profile.flashWaves === 0) return 0
  return profile.duration * (1 + profile.flashWaves * 0.5)
}

/**
 * Varian kilatan baris tabel saat user menekan tombol hari di banner validasi
 * (AGENTS.md bagian 11.3).
 *
 * ATURAN PROPERTI (AGENTS.md bagian 8.2): kilatan HANYA memakai `opacity`. Efek
 * "cahaya" dibangun dari dua lapisan elemen (latar tipis dan garis aksen) yang sudah
 * punya ukuran tetap; hanya opacity-nya yang berdenyut. `border-width` dan `box-shadow`
 * DILARANG dianimasikan, dan baris tabel sengaja TIDAK digeser agar tidak menimpa baris
 * tetangganya.
 *
 * Kadar kilatan mengikuti tier, sehingga tiap tier terlihat berbeda:
 * - `penuh` (flashWaves 3): denyut tiga gelombang.
 * - `seimbang` (flashWaves 2): denyut dua gelombang.
 * - `minimal` (flashWaves 1): satu kali muncul lalu memudar.
 * - `mati` (flashWaves 0): TIDAK ada kilatan. Pemanggil cukup memfokuskan fieldnya.
 */
export function buildRowFlashVariants(profile: MotionTierProfile): Variants {
  const waves = profile.flashWaves

  if (waves === 0) {
    return { rest: { opacity: 0 } }
  }

  // Pola opacity naik-turun berulang: mulai dan berakhir di 0 agar tidak menyisakan
  // sorotan setelah selesai.
  const pulse: number[] = [0]
  for (let i = 0; i < waves; i += 1) pulse.push(1, 0.25)
  pulse.push(0)

  return {
    rest: { opacity: 0 },
    flash: {
      opacity: pulse,
      transition: {
        duration: rowFlashDurationSeconds(profile),
        ease: 'easeInOut',
      },
    },
  }
}

/**
 * Membangun variant pratinjau tier dari profilnya. Semua pergerakan memakai
 * transform dan opacity saja (AGENTS.md bagian 8.2).
 *
 * PENTING: setiap elemen WAJIB memakai `initial="hidden"`, `animate="visible"`, dan
 * `variants` dari objek ini. Jangan hanya memasang `variants` pada node anak dan
 * mengandalkan propagasi dari induk, karena elemen yang dipasang ulang (misalnya
 * karena `key` berubah saat tier berganti) akan langsung tampil pada keadaan akhir
 * dan animasinya tidak terlihat.
 */
export function buildTierPreviewVariants(profile: MotionTierProfile): TierPreviewVariants {
  const move = profile.secondaryMotion
  const base: Transition = { duration: profile.duration, ease: EASE_OUT_EXPO }

  return {
    window: {
      hidden: { opacity: 0, y: move ? -8 : 0 },
      visible: { opacity: 1, y: 0, transition: base },
    },
    panel: {
      hidden: { opacity: 0, x: move ? -12 : 0 },
      visible: { opacity: 1, x: 0, transition: base },
    },
    list: {
      hidden: {},
      visible: { transition: { staggerChildren: profile.stagger } },
    },
    item: {
      hidden: { opacity: 0, y: move ? 6 : 0 },
      visible: { opacity: 1, y: 0, transition: base },
    },
  }
}

/**
 * Kurva kilau seksi: melandai di awal, cepat di tengah, melandai lagi di akhir.
 *
 * Nilainya SAMA PERSIS dengan `Curves.easeInOutQuint` di Flutter, yang didefinisikan
 * sebagai `Cubic(0.86, 0.0, 0.07, 1.0)`. Karena hampir separuh waktu awal nyaris tidak
 * bergerak, durasi sapuan dibuat lebih panjang daripada durasi dasar tier supaya bagian
 * tengahnya terasa meluncur, bukan melompat.
 */
export const sectionGlintEase: [number, number, number, number] = [0.86, 0, 0.07, 1]

/** Lama fase fade in kilau, dalam detik. Membuka awalan sebelum sapuan berjalan. */
export const sectionGlintFadeInSeconds = 0.16

/** Lama keadaan akhir kilau ditahan sebelum memudar, dalam detik. */
export const sectionGlintHoldSeconds = 0.12

/** Lama fase fade out kilau, dalam detik. */
export const sectionGlintFadeOutSeconds = 0.2

/**
 * Lama SAPUAN kilau, dalam detik, untuk sebuah tier. 0 berarti tidak ada kilau.
 *
 * Ini hanya lama perjalanan dari atas ke bawah, belum termasuk fade in, tahan, dan
 * fade out. Totalnya dihitung `sectionGlintTotalSeconds`.
 */
export function sectionGlintDurationSeconds(profile: MotionTierProfile): number {
  if (profile.sectionShine === 0 && profile.sectionBorder === 0) return 0
  return profile.duration * 1.8
}

/**
 * Lama SELURUH rangkaian kilau, dalam detik: fade in, sapuan, tahan, lalu fade out.
 *
 * Dipakai `SettingsSection` untuk tahu kapan kilau benar-benar selesai, supaya permintaan
 * lompatan baru dibersihkan setelah rangkaiannya tuntas dan animasi berikutnya tidak
 * terpotong.
 */
export function sectionGlintTotalSeconds(profile: MotionTierProfile): number {
  const sapuan = sectionGlintDurationSeconds(profile)
  if (sapuan === 0) return 0
  return sectionGlintFadeInSeconds + sapuan + sectionGlintHoldSeconds + sectionGlintFadeOutSeconds
}

/**
 * Varian pembuka dan penutup kilau: fade in, tahan, lalu fade out.
 *
 * URUTAN YANG DIMINTA (AGENTS.md bagian 22):
 * 1. Gulir user mendarat.
 * 2. Fade in: keadaan AWAL kilau muncul perlahan, jadi cahaya tidak muncul mendadak.
 *    Pada titik ini penutup border masih di posisi awal, sehingga yang terlihat baru
 *    garis atas dan kilau body bagian atas.
 * 3. Sapuan berjalan dari keadaan awal ke keadaan akhir.
 * 4. Keadaan AKHIR ditahan sebentar, lalu memudar.
 *
 * HANYA `opacity` yang dianimasikan di sini (bagian 8.2). Waktunya dibagi memakai `times`
 * yang dihitung dari durasi tiap fase, sehingga mengubah salah satu durasi tidak membuat
 * fase lain bergeser.
 */
export function buildSectionGlintLayerVariants(profile: MotionTierProfile): Variants {
  const sapuan = sectionGlintDurationSeconds(profile)
  if (sapuan === 0) return { rest: { opacity: 0 } }

  const total = sectionGlintTotalSeconds(profile)
  const akhirFadeIn = sectionGlintFadeInSeconds / total
  const akhirSapuan = (sectionGlintFadeInSeconds + sapuan) / total
  const akhirTahan = (sectionGlintFadeInSeconds + sapuan + sectionGlintHoldSeconds) / total

  return {
    rest: { opacity: 0 },
    run: {
      opacity: [0, 1, 1, 1, 0],
      transition: {
        duration: total,
        times: [0, akhirFadeIn, akhirSapuan, akhirTahan, 1],
        ease: 'linear',
      },
    },
  }
}

/**
 * Varian isian cahaya pada body seksi Pengaturan.
 *
 * Bukan pita yang melintas lewat, melainkan ISIAN yang tumbuh dari atas: elemennya
 * setinggi seluruh seksi, `transform-origin` diatur `top` lewat CSS, lalu `scaleY`
 * berjalan dari 0 ke 1. Akibatnya tepi atasnya diam di puncak seksi dan tepi bawahnya yang
 * turun sampai penuh, seperti wadah yang terisi.
 *
 * Mulai SETELAH fade in selesai (lewat `delay`), memakai durasi dan kurva yang SAMA PERSIS
 * dengan penutup border, sehingga tepi bawah isian dan tepi atas penutup border turun
 * seirama. Hanya `transform` yang dianimasikan (AGENTS.md bagian 8.2); fade in dan fade
 * out ditangani varian lapisan di atasnya.
 */
export function buildSectionShineVariants(profile: MotionTierProfile): Variants {
  if (profile.sectionShine === 0) return { rest: { opacity: 0 } }

  return {
    rest: { scaleY: 0 },
    sweep: {
      scaleY: 1,
      transition: {
        delay: sectionGlintFadeInSeconds,
        duration: sectionGlintDurationSeconds(profile),
        ease: sectionGlintEase,
      },
    },
  }
}

/**
 * Varian penutup border.
 *
 * Memakai durasi, kurva, dan penundaan yang SAMA PERSIS dengan sapuan cahaya, sehingga
 * garis border tersingkap seiring cahaya turun dan keduanya tidak mungkin berjalan
 * sendiri-sendiri. Hanya `transform` yang dianimasikan; tidak ada properti border yang
 * disentuh.
 */
export function buildSectionBorderVariants(profile: MotionTierProfile): Variants {
  if (profile.sectionBorder === 0) return { rest: { opacity: 0 } }

  return {
    rest: { opacity: 1, y: '0%' },
    sweep: {
      opacity: 1,
      y: '100%',
      transition: {
        delay: sectionGlintFadeInSeconds,
        duration: sectionGlintDurationSeconds(profile),
        ease: sectionGlintEase,
      },
    },
  }
}
