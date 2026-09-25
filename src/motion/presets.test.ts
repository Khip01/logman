import { describe, expect, it } from 'vitest'
import { MOTION_TIERS } from '@/stores/ui'
import {
  buildRowFlashVariants,
  buildSectionBorderVariants,
  buildSectionGlintLayerVariants,
  buildSectionShineVariants,
  rowFlashDurationSeconds,
  sectionGlintDurationSeconds,
  sectionGlintEase,
  sectionGlintFadeInSeconds,
  sectionGlintFadeOutSeconds,
  sectionGlintHoldSeconds,
  sectionGlintTotalSeconds,
} from './presets'
import { MOTION_TIER_PROFILE } from './tiers'

/**
 * Kilatan baris dari banner validasi (AGENTS.md bagian 11.3).
 *
 * Yang diuji di sini: tiap tier benar-benar berbeda, dan properti yang dilarang
 * (border-width, box-shadow, properti tata letak) tidak pernah muncul (bagian 8.2).
 */

/** Bentuk mentah varian, agar test bisa membaca keyframe dan transisinya. */
interface RawVariant {
  opacity?: number[]
  transition?: { duration?: number }
}

function flashOf(tier: keyof typeof MOTION_TIER_PROFILE): RawVariant | undefined {
  return buildRowFlashVariants(MOTION_TIER_PROFILE[tier]).flash as RawVariant | undefined
}

function opacityOf(tier: keyof typeof MOTION_TIER_PROFILE): number[] {
  return flashOf(tier)?.opacity ?? []
}

/** Mengambil kunci properti dari satu keadaan varian. */
function keysOf(value: unknown): string[] {
  return value && typeof value === 'object' ? Object.keys(value as Record<string, unknown>) : []
}

const TERLARANG = [
  'width',
  'height',
  'top',
  'left',
  'right',
  'bottom',
  'margin',
  'marginTop',
  'marginLeft',
  'padding',
  'paddingTop',
  'borderWidth',
  'borderColor',
  'borderTopWidth',
  'boxShadow',
  'fontSize',
]

describe('buildRowFlashVariants', () => {
  it('tier mati tidak punya kilatan sama sekali', () => {
    const variants = buildRowFlashVariants(MOTION_TIER_PROFILE.mati)
    expect(variants.flash).toBeUndefined()
    expect(variants.rest).toEqual({ opacity: 0 })
  })

  it('tiap tier beranimasi punya denyut opacity yang berbeda jumlah gelombangnya', () => {
    const penuh = opacityOf('penuh')
    const seimbang = opacityOf('seimbang')
    const minimal = opacityOf('minimal')
    const mati = opacityOf('mati')
    expect(penuh.length).toBeGreaterThan(seimbang.length)
    expect(seimbang.length).toBeGreaterThan(minimal.length)
    expect(minimal.length).toBeGreaterThan(0)
    expect(mati).toEqual([])
  })

  it('setiap pola denyut mulai dan berakhir di nol', () => {
    for (const tier of MOTION_TIERS) {
      const opacity = opacityOf(tier)
      if (opacity.length === 0) continue
      expect(opacity[0]).toBe(0)
      expect(opacity[opacity.length - 1]).toBe(0)
    }
  })

  it('denyut mencapai satu dan tetap di rentang nol sampai satu', () => {
    for (const tier of MOTION_TIERS) {
      const opacity = opacityOf(tier)
      if (opacity.length === 0) continue
      expect(Math.max(...opacity)).toBe(1)
      expect(Math.min(...opacity)).toBeGreaterThanOrEqual(0)
    }
  })

  it('tidak memakai properti yang dilarang pada aturan animasi', () => {
    for (const tier of MOTION_TIERS) {
      const variants = buildRowFlashVariants(MOTION_TIER_PROFILE[tier])
      for (const state of Object.values(variants)) {
        for (const key of keysOf(state)) {
          expect(TERLARANG).not.toContain(key)
        }
      }
    }
  })

  it('durasi kilatan bertambah seiring jumlah gelombang', () => {
    const durasi = (tier: keyof typeof MOTION_TIER_PROFILE) =>
      rowFlashDurationSeconds(MOTION_TIER_PROFILE[tier])
    expect(durasi('penuh')).toBeGreaterThan(durasi('seimbang'))
    expect(durasi('seimbang')).toBeGreaterThan(durasi('minimal'))
    expect(durasi('minimal')).toBeGreaterThan(0)
    expect(durasi('mati')).toBe(0)
  })

  it('durasi varian sama dengan durasi resmi tier', () => {
    for (const tier of MOTION_TIERS) {
      const transition = flashOf(tier)?.transition
      if (!transition) continue
      expect(transition.duration).toBe(rowFlashDurationSeconds(MOTION_TIER_PROFILE[tier]))
    }
  })
})

/** Bentuk mentah varian kilau seksi, agar test bisa membaca keyframe dan transisinya. */
interface RawGlintVariant {
  y?: string | string[]
  scaleY?: number | string
  opacity?: number | number[]
  transition?: {
    delay?: number
    duration?: number
    times?: number[]
    ease?: unknown
    y?: { duration?: number; ease?: unknown }
    opacity?: { duration?: number; times?: number[] }
  }
}

function shineOf(tier: keyof typeof MOTION_TIER_PROFILE): RawGlintVariant | undefined {
  return buildSectionShineVariants(MOTION_TIER_PROFILE[tier]).sweep as RawGlintVariant | undefined
}

function borderOf(tier: keyof typeof MOTION_TIER_PROFILE): RawGlintVariant | undefined {
  return buildSectionBorderVariants(MOTION_TIER_PROFILE[tier]).sweep as RawGlintVariant | undefined
}

/**
 * Kilau seksi Pengaturan saat dipilih dari kotak pencarian (AGENTS.md bagian 22).
 *
 * Yang diuji: tiap tier benar-benar berbeda, isian body dan border memakai waktu serta
 * kurva yang SAMA sehingga tidak mungkin berjalan sendiri-sendiri, dan tidak ada properti
 * terlarang (bagian 8.2).
 */
describe('buildSectionShineVariants dan buildSectionBorderVariants', () => {
  it('tier mati tidak punya kilau sama sekali', () => {
    const profile = MOTION_TIER_PROFILE.mati
    expect(buildSectionShineVariants(profile).sweep).toBeUndefined()
    expect(buildSectionBorderVariants(profile).sweep).toBeUndefined()
    expect(buildSectionGlintLayerVariants(profile).run).toBeUndefined()
    expect(sectionGlintDurationSeconds(profile)).toBe(0)
  })

  it('hanya tier penuh yang memakai sapuan cahaya pada body', () => {
    for (const tier of MOTION_TIERS) {
      const shine = buildSectionShineVariants(MOTION_TIER_PROFILE[tier])
      if (tier === 'penuh') {
        expect(shine.sweep).toBeDefined()
      } else {
        expect(shine.sweep).toBeUndefined()
      }
    }
  })

  it('setiap tier beranimasi punya border, dan hanya tier penuh serta seimbang yang penuh', () => {
    expect(MOTION_TIER_PROFILE.penuh.sectionBorder).toBe(2)
    expect(MOTION_TIER_PROFILE.seimbang.sectionBorder).toBe(2)
    expect(MOTION_TIER_PROFILE.minimal.sectionBorder).toBe(1)
    expect(MOTION_TIER_PROFILE.mati.sectionBorder).toBe(0)
  })

  it('isian body dan border memakai waktu, kurva, dan penundaan yang sama sehingga seiring', () => {
    // Isian body hanya ada di tier penuh, jadi bandingkan dengan border di tier yang sama.
    const shine = shineOf('penuh')
    const border = borderOf('penuh')
    expect(shine?.transition?.duration).toBe(border?.transition?.duration)
    expect(shine?.transition?.ease).toEqual(border?.transition?.ease)
    expect(shine?.transition?.delay).toBe(border?.transition?.delay)
  })

  it('border bergerak dari menutupi penuh menuju tersingkap penuh', () => {
    const border = borderOf('penuh')
    expect(border?.y).toBe('100%')
    expect(buildSectionBorderVariants(MOTION_TIER_PROFILE.penuh).rest).toMatchObject({ y: '0%' })
  })

  it('memakai kurva Curves.easeInOutQuint seperti di Flutter', () => {
    // Flutter mendefinisikan easeInOutQuint sebagai Cubic(0.86, 0.0, 0.07, 1.0).
    expect(sectionGlintEase).toEqual([0.86, 0, 0.07, 1])
    expect(borderOf('penuh')?.transition?.ease).toEqual(sectionGlintEase)
  })

  it('melandai di awal, cepat di tengah, melandai lagi di akhir', () => {
    const [x1, y1, x2, y2] = sectionGlintEase
    const bezierY = (x: number): number => {
      let lo = 0
      let hi = 1
      for (let i = 0; i < 60; i += 1) {
        const mid = (lo + hi) / 2
        const bx = 3 * (1 - mid) ** 2 * mid * x1 + 3 * (1 - mid) * mid ** 2 * x2 + mid ** 3
        if (bx < x) lo = mid
        else hi = mid
      }
      const t = (lo + hi) / 2
      return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3
    }

    const laju = (dari: number, ke: number) => (bezierY(ke) - bezierY(dari)) / (ke - dari)

    // Dua ujungnya lambat, tengahnya paling cepat.
    expect(bezierY(0.2)).toBeLessThan(0.05)
    expect(bezierY(0.8)).toBeGreaterThan(0.95)

    const lajuTengah = laju(0.45, 0.55)
    expect(lajuTengah).toBeGreaterThan(laju(0.05, 0.15) * 4)
    expect(lajuTengah).toBeGreaterThan(laju(0.85, 0.95) * 4)
  })

  it('isian body NGE-FILL dari atas, bukan pita yang melintas lewat', () => {
    const shine = shineOf('penuh')
    const rest = buildSectionShineVariants(MOTION_TIER_PROFILE.penuh).rest as RawGlintVariant
    // Tumbuh dari nol tinggi ke penuh: hanya `scaleY`, tidak ada translasi.
    expect(rest.scaleY).toBe(0)
    expect(shine?.scaleY).toBe(1)
    expect(shine?.y).toBeUndefined()
    expect(shine?.transition?.ease).toEqual(sectionGlintEase)
    expect(shine?.transition?.duration).toBe(sectionGlintDurationSeconds(MOTION_TIER_PROFILE.penuh))
    expect(shine?.transition?.delay).toBe(sectionGlintFadeInSeconds)
  })

  it('durasi kilau mengikuti durasi dasar tier', () => {
    const durasi = (tier: keyof typeof MOTION_TIER_PROFILE) =>
      sectionGlintDurationSeconds(MOTION_TIER_PROFILE[tier])
    expect(durasi('penuh')).toBeGreaterThan(durasi('seimbang'))
    expect(durasi('seimbang')).toBeGreaterThan(durasi('minimal'))
    expect(durasi('minimal')).toBeGreaterThan(0)
    expect(durasi('mati')).toBe(0)
  })

  it('durasi varian sama dengan durasi resmi tier', () => {
    for (const tier of MOTION_TIERS) {
      const profile = MOTION_TIER_PROFILE[tier]
      const expected = sectionGlintDurationSeconds(profile)
      if (expected === 0) continue
      expect(shineOf(tier)?.transition?.duration ?? expected).toBe(expected)
      expect(borderOf(tier)?.transition?.duration).toBe(expected)
    }
  })

  it('tidak memakai properti yang dilarang pada aturan animasi', () => {
    for (const tier of MOTION_TIERS) {
      const profile = MOTION_TIER_PROFILE[tier]
      const kumpulan = [
        buildSectionShineVariants(profile),
        buildSectionBorderVariants(profile),
        buildSectionGlintLayerVariants(profile),
      ]
      for (const variants of kumpulan) {
        for (const state of Object.values(variants)) {
          for (const key of keysOf(state)) {
            expect(TERLARANG).not.toContain(key)
          }
        }
      }
    }
  })

  it('hanya memakai transform dan opacity sebagai properti yang bergerak', () => {
    const DIIZINKAN = ['y', 'scaleY', 'opacity', 'transition']
    for (const tier of MOTION_TIERS) {
      const profile = MOTION_TIER_PROFILE[tier]
      for (const variants of [
        buildSectionShineVariants(profile),
        buildSectionBorderVariants(profile),
        buildSectionGlintLayerVariants(profile),
      ]) {
        for (const state of Object.values(variants)) {
          for (const key of keysOf(state)) {
            expect(DIIZINKAN).toContain(key)
          }
        }
      }
    }
  })
})

/**
 * Rangkaian pembuka dan penutup kilau (AGENTS.md bagian 22).
 *
 * Urutannya: fade in memperlihatkan keadaan awal, sapuan berjalan, keadaan akhir ditahan,
 * lalu memudar. Yang diuji: fase-fasenya benar-benar ada, urutannya benar, dan penutup
 * border mulai bergerak SETELAH fade in selesai.
 */
describe('buildSectionGlintLayerVariants', () => {
  function layerOf(tier: keyof typeof MOTION_TIER_PROFILE): {
    opacity?: number[]
    transition?: { duration?: number; times?: number[] }
  } {
    return (buildSectionGlintLayerVariants(MOTION_TIER_PROFILE[tier]).run ?? {}) as {
      opacity?: number[]
      transition?: { duration?: number; times?: number[] }
    }
  }

  it('tier mati tidak punya rangkaian kilau', () => {
    const variants = buildSectionGlintLayerVariants(MOTION_TIER_PROFILE.mati)
    expect(variants.run).toBeUndefined()
    expect(sectionGlintTotalSeconds(MOTION_TIER_PROFILE.mati)).toBe(0)
  })

  it('memulai dari transparan lalu berakhir transparan lagi', () => {
    for (const tier of MOTION_TIERS) {
      const opacity = layerOf(tier).opacity
      if (!opacity) continue
      expect(opacity[0]).toBe(0)
      expect(opacity[opacity.length - 1]).toBe(0)
      // Ada fase terlihat penuh di tengah.
      expect(Math.max(...opacity)).toBe(1)
    }
  })

  it('urutan fasenya fade in, sapuan, tahan, lalu fade out', () => {
    const opacity = layerOf('penuh').opacity ?? []
    const times = layerOf('penuh').transition?.times ?? []
    expect(opacity).toHaveLength(5)
    expect(times).toHaveLength(5)

    // times menaik, dan fase sapuan serta tahan punya rentang waktu.
    for (let i = 1; i < times.length; i += 1) {
      expect(times[i]).toBeGreaterThan(times[i - 1] ?? 0)
    }
    // Nilai opacity: 0 -> 1 (fade in), 1 (sapuan), 1 (tahan), 0 (fade out).
    expect(opacity).toEqual([0, 1, 1, 1, 0])
  })

  it('lama fase mengikuti konstanta yang dideklarasikan', () => {
    const profile = MOTION_TIER_PROFILE.penuh
    const total = sectionGlintTotalSeconds(profile)
    expect(total).toBeCloseTo(
      sectionGlintFadeInSeconds +
        sectionGlintDurationSeconds(profile) +
        sectionGlintHoldSeconds +
        sectionGlintFadeOutSeconds,
      5,
    )
    expect(layerOf('penuh').transition?.duration).toBe(total)

    const times = layerOf('penuh').transition?.times ?? []
    expect(times[1]).toBeCloseTo(sectionGlintFadeInSeconds / total, 5)
    expect(times[3]).toBeCloseTo(
      (sectionGlintFadeInSeconds + sectionGlintDurationSeconds(profile) + sectionGlintHoldSeconds) /
        total,
      5,
    )
  })

  it('sapuan dan border baru bergerak setelah fade in selesai', () => {
    const profile = MOTION_TIER_PROFILE.penuh
    expect(borderOf('penuh')?.transition?.duration).toBe(sectionGlintDurationSeconds(profile))
    const delay = (buildSectionBorderVariants(profile).sweep as { transition?: { delay?: number } })
      ?.transition?.delay
    expect(delay).toBe(sectionGlintFadeInSeconds)
    expect(delay).toBeGreaterThan(0)
  })

  it('total rangkaian lebih lama daripada sapuannya saja', () => {
    for (const tier of MOTION_TIERS) {
      const profile = MOTION_TIER_PROFILE[tier]
      const sapuan = sectionGlintDurationSeconds(profile)
      if (sapuan === 0) continue
      expect(sectionGlintTotalSeconds(profile)).toBeGreaterThan(sapuan)
    }
  })
})
