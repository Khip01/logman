import { m } from 'motion/react'
import {
  buildSectionBorderVariants,
  buildSectionGlintLayerVariants,
  buildSectionShineVariants,
} from '@/motion/presets'
import { MOTION_TIER_PROFILE } from '@/motion/tiers'
import { useUiStore } from '@/stores/ui'

/**
 * Kilau seksi Pengaturan saat dipilih dari kotak pencarian (AGENTS.md bagian 22).
 *
 * Dua lapisan, dan pembagiannya disengaja:
 *
 * 1. `GlintBorder` (BELAKANG konten, `z-0`): garis border yang merembet turun. Ditaruh
 *    di belakang supaya penutupnya boleh menutupi area panel tanpa pernah menutupi teks,
 *    dan supaya garisnya tampak berada di tepi panel.
 * 2. `GlintShine` (PALING DEPAN, `z-20`): sapuan cahaya pada body. Harus di depan supaya
 *    cahaya terasa melintas di permukaan seksi, bukan membelakangi komponen di dalamnya.
 *    Warnanya tembus pandang, jadi teks tetap terbaca; `pointer-events: none` menjamin
 *    seluruh kontrol di seksi tetap bisa diklik.
 *
 * Efek border dibuat TANPA menganimasikan properti border (aturan bagian 8.2):
 * - `.glint-ring` adalah garis border statis pada tepi seksi, tanpa sisi bawah.
 * - `.glint-cover` adalah kotak opaque sewarna latar yang MENUTUPI garis itu, lalu
 *   meluncur turun. Karena tergeser setebal garis, pada keadaan awal hanya sisi atas yang
 *   terlihat; saat penutup turun, sisi kiri dan kanan tumbuh mengikutinya dari atas.
 *
 * URUTAN RANGKAIAN, sesuai permintaan:
 * 1. Fade in memperlihatkan keadaan awal, jadi cahaya tidak muncul mendadak.
 * 2. Sapuan berjalan dari keadaan awal ke keadaan akhir.
 * 3. Keadaan akhir ditahan sebentar, lalu memudar.
 *
 * `key` pada elemen memakai token permintaan, sehingga memilih saran yang sama dua kali
 * tetap memutar ulang kilaunya.
 */

interface GlintProps {
  token: number
}

/** Garis border yang merembet melingkari seksi. Dirender DI BELAKANG konten. */
export function GlintBorder({ token }: GlintProps) {
  const motionTier = useUiStore((s) => s.motion)
  const profile = MOTION_TIER_PROFILE[motionTier]

  if (profile.sectionBorder === 0) return null

  const layerVariants = buildSectionGlintLayerVariants(profile)
  const borderVariants = buildSectionBorderVariants(profile)

  return (
    <m.div
      key={`glint-border-${token}`}
      aria-hidden
      data-testid="section-glint"
      variants={layerVariants}
      initial="rest"
      animate="run"
      className="glint-layer"
    >
      <span
        data-testid="section-glint-ring"
        className="glint-ring block"
        data-level={profile.sectionBorder}
      />
      <m.span
        key={`cover-${token}`}
        data-testid="section-glint-cover"
        variants={borderVariants}
        initial="rest"
        animate="sweep"
        className="glint-cover block"
      />
    </m.div>
  )
}

/** Sapuan cahaya pada body seksi. Dirender DI PALING DEPAN, di atas konten. */
export function GlintShine({ token }: GlintProps) {
  const motionTier = useUiStore((s) => s.motion)
  const profile = MOTION_TIER_PROFILE[motionTier]

  if (profile.sectionShine === 0) return null

  const layerVariants = buildSectionGlintLayerVariants(profile)
  const shineVariants = buildSectionShineVariants(profile)

  return (
    <m.div
      key={`glint-shine-${token}`}
      aria-hidden
      data-testid="section-glint-front"
      variants={layerVariants}
      initial="rest"
      animate="run"
      className="glint-front"
    >
      <m.span
        key={`shine-${token}`}
        data-testid="section-glint-shine"
        variants={shineVariants}
        initial="rest"
        animate="sweep"
        className="glint-shine block"
      />
    </m.div>
  )
}
