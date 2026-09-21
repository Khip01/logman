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
  label: string
  /** Deskripsi singkat. */
  description: string
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
}

export const MOTION_TIER_PROFILE: Record<MotionTier, MotionTierProfile> = {
  penuh: {
    label: 'Penuh',
    description: 'Semua animasi aktif, termasuk stagger, gelombang, dan gerakan sekunder.',
    previewItems: 5,
    stagger: 0.09,
    secondaryMotion: true,
    pulse: true,
    duration: 0.42,
    revealDuration: 0.5,
  },
  seimbang: {
    label: 'Seimbang',
    description: 'Stagger dan gerakan sekunder dikurangi, gelombang tetap ada.',
    previewItems: 5,
    stagger: 0.045,
    secondaryMotion: true,
    pulse: true,
    duration: 0.32,
    revealDuration: 0.36,
  },
  minimal: {
    label: 'Minimal',
    description: 'Hanya transisi opacity. Tidak ada stagger, gerakan, atau gelombang.',
    previewItems: 5,
    stagger: 0,
    secondaryMotion: false,
    pulse: false,
    duration: 0.2,
    revealDuration: 0.22,
  },
  mati: {
    label: 'Mati',
    description: 'Semua transisi non-esensial dimatikan. Perubahan tampil seketika.',
    previewItems: 5,
    stagger: 0,
    secondaryMotion: false,
    pulse: false,
    duration: 0,
    revealDuration: 0,
  },
}
