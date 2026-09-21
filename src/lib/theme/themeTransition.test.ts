import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUiStore } from '@/stores/ui'
import { setThemeAnimated } from './themeTransition'

describe('transisi tema', () => {
  beforeEach(() => {
    useUiStore.setState({ theme: 'hitam-pekat', motion: 'penuh' })
    document.documentElement.dataset.theme = 'hitam-pekat'
    document.documentElement.classList.remove('theme-transitioning')
    // jsdom tidak menyediakan View Transitions, jadi jalur langsung yang dipakai.
    vi.restoreAllMocks()
  })

  it('menerapkan tema ke elemen html dan store', () => {
    setThemeAnimated('putih-bersih')
    expect(document.documentElement.dataset.theme).toBe('putih-bersih')
    expect(useUiStore.getState().theme).toBe('putih-bersih')
  })

  it('memakai jalur langsung bila View Transitions tidak tersedia', () => {
    setThemeAnimated('word-dark')
    expect(document.documentElement.dataset.theme).toBe('word-dark')
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false)
  })
})
