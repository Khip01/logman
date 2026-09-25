import type { MessageKey } from '@/lib/i18n/messages/id'

import type { MotionTier } from '@/stores/ui'

/**
 * Profil tiap tier animasi (AGENTS.md bagian 8.1).
 *
 * Ini sumber kebenaran tunggal untuk kadar animasi. Dipakai oleh:
 * - Pratinjau tier di Settings.
 * - Keputusan runtime kapan animasi sekunder dijalankan.
 * - Reveal transisi tema.
 *
 * Tier hanya mengurangi gerakan sekunder (stagger, gelombang, animasi idle),
 * bukan menghilangkan karakter UI.
 */
export interface MotionTierProfile {
  /** Label yang ditampilkan ke user. */
  labelKey: MessageKey
  /** Deskripsi singkat. */
  descriptionKey: MessageKey
  /** Jumlah item yang dianimasikan berurutan pada pratinjau. */
  previewItems: number
  /** Jeda antar item (stagger), dalam detik. 0 berarti tanpa stagger. */
  stagger: number
  /** Apakah ada gerakan sekunder (translasi dan stagger). */
  secondaryMotion: boolean
  /** Apakah elemen berdenyut halus (gelombang) dijalankan. */
  pulse: boolean
  /** Durasi dasar animasi, dalam detik. 0 berarti tanpa animasi. */
  duration: number
  /** Durasi reveal melingkar saat ganti tema, dalam detik. 0 berarti tanpa reveal. */
  revealDuration: number
  /**
   * Jumlah gelombang denyut kilatan baris saat banner validasi diklik (AGENTS.md
   * bagian 11.3). 0 berarti tanpa kilatan sama sekali: baris langsung difokuskan.
   */
  flashWaves: number
  /**
   * Sapuan cahaya pada body seksi Pengaturan saat seksi dipilih dari kotak pencarian
   * (AGENTS.md bagian 22). 0 berarti tanpa sapuan.
   */
  sectionShine: number
  /**
   * Garis border yang merembet melingkari seksi Pengaturan.
   *
   * 0 = tanpa garis (tier mati). 1 = garis tipis, tanpa pendinginan, untuk tier minimal.
   * 2 = garis penuh berikut pendinginan di sekelilingnya.
   */
  sectionBorder: number
}

export const MOTION_TIER_PROFILE: Record<MotionTier, MotionTierProfile> = {
  penuh: {
    labelKey: 'motion.penuh',
    descriptionKey: 'motion.penuhDeskripsi',
    previewItems: 5,
    stagger: 0.09,
    secondaryMotion: true,
    pulse: true,
    duration: 0.42,
    revealDuration: 0.5,
    flashWaves: 3,
    sectionShine: 1,
    sectionBorder: 2,
  },
  seimbang: {
    labelKey: 'motion.seimbang',
    descriptionKey: 'motion.seimbangDeskripsi',
    previewItems: 5,
    stagger: 0.045,
    secondaryMotion: true,
    pulse: true,
    duration: 0.32,
    revealDuration: 0.36,
    flashWaves: 2,
    sectionShine: 0,
    sectionBorder: 2,
  },
  minimal: {
    labelKey: 'motion.minimal',
    descriptionKey: 'motion.minimalDeskripsi',
    previewItems: 5,
    stagger: 0,
    secondaryMotion: false,
    pulse: false,
    duration: 0.2,
    revealDuration: 0.22,
    flashWaves: 1,
    sectionShine: 0,
    sectionBorder: 1,
  },
  mati: {
    labelKey: 'motion.mati',
    descriptionKey: 'motion.matiDeskripsi',
    previewItems: 5,
    stagger: 0,
    secondaryMotion: false,
    pulse: false,
    duration: 0,
    revealDuration: 0,
    flashWaves: 0,
    sectionShine: 0,
    sectionBorder: 0,
  },
}
