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
