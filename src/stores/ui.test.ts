import { describe, expect, it } from 'vitest'
import { isMotionTier, isThemeId, MOTION_TIERS, THEMES, useUiStore } from './ui'

describe('ui store', () => {
  it('menyediakan tepat 9 tema', () => {
    expect(THEMES).toHaveLength(9)
  })

  it('memvalidasi id tema dengan benar', () => {
    expect(isThemeId('hitam-pekat')).toBe(true)
    expect(isThemeId('tema-yang-tidak-ada')).toBe(false)
    expect(isThemeId(123)).toBe(false)
  })

  it('memvalidasi tier animasi dengan benar', () => {
    expect(MOTION_TIERS).toEqual(['penuh', 'seimbang', 'minimal', 'mati'])
    expect(isMotionTier('penuh')).toBe(true)
    expect(isMotionTier('kencang')).toBe(false)
  })

  it('default tier animasi adalah penuh', () => {
    expect(useUiStore.getState().motion).toBe('penuh')
  })

  it('toggle sidebar membalik nilai', () => {
    const before = useUiStore.getState().sidebarCollapsed
    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarCollapsed).toBe(!before)
    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarCollapsed).toBe(before)
  })
})
