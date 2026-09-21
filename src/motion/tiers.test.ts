import { describe, expect, it } from 'vitest'
import { MOTION_TIERS } from '@/stores/ui'
import { MOTION_TIER_PROFILE } from './tiers'

describe('profil tier animasi', () => {
  it('memiliki profil untuk setiap tier', () => {
    for (const tier of MOTION_TIERS) {
      expect(MOTION_TIER_PROFILE[tier]).toBeDefined()
    }
  })

  it('tier penuh mengaktifkan gerakan sekunder, gelombang, dan reveal', () => {
    const profile = MOTION_TIER_PROFILE.penuh
    expect(profile.secondaryMotion).toBe(true)
    expect(profile.pulse).toBe(true)
    expect(profile.stagger).toBeGreaterThan(0)
    expect(profile.revealDuration).toBeGreaterThan(0)
  })

  it('tier minimal mematikan stagger dan gerakan sekunder', () => {
    const profile = MOTION_TIER_PROFILE.minimal
    expect(profile.secondaryMotion).toBe(false)
    expect(profile.stagger).toBe(0)
    expect(profile.pulse).toBe(false)
  })

  it('tier mati mematikan semua durasi animasi', () => {
    const profile = MOTION_TIER_PROFILE.mati
    expect(profile.duration).toBe(0)
    expect(profile.revealDuration).toBe(0)
  })

  it('kadar animasi menurun dari penuh ke mati', () => {
    expect(MOTION_TIER_PROFILE.penuh.stagger).toBeGreaterThan(MOTION_TIER_PROFILE.seimbang.stagger)
    expect(MOTION_TIER_PROFILE.seimbang.stagger).toBeGreaterThan(
      MOTION_TIER_PROFILE.minimal.stagger,
    )
  })
})
