import { beforeEach, describe, expect, it } from 'vitest'
import { clearScrollMemory, readScroll, saveScroll } from './scrollMemory'

/**
 * Ingatan posisi scroll per halaman (AGENTS.md bagian 11.4).
 *
 * Yang penting diuji: halaman baru selalu mulai dari atas, dan posisi antar path tidak
 * saling bocor.
 */

beforeEach(() => {
  clearScrollMemory()
})

describe('readScroll', () => {
  it('mengembalikan 0 untuk path yang belum pernah dikunjungi', () => {
    expect(readScroll('/')).toBe(0)
    expect(readScroll('/settings')).toBe(0)
  })

  it('mengembalikan posisi tersimpan setelah saveScroll', () => {
    saveScroll('/settings', 640)
    expect(readScroll('/settings')).toBe(640)
  })
})

describe('saveScroll', () => {
  it('membulatkan nilai', () => {
    saveScroll('/settings', 640.6)
    expect(readScroll('/settings')).toBe(641)
  })

  it('menjepit nilai negatif ke nol', () => {
    saveScroll('/settings', -120)
    expect(readScroll('/settings')).toBe(0)
  })

  it('menyimpan nol secara eksplisit, bukan menganggapnya tidak ada', () => {
    saveScroll('/settings', 500)
    saveScroll('/settings', 0)
    expect(readScroll('/settings')).toBe(0)
  })

  it('memakai 0 untuk nilai yang bukan angka wajar', () => {
    saveScroll('/settings', Number.NaN)
    expect(readScroll('/settings')).toBe(0)
    saveScroll('/settings', Number.POSITIVE_INFINITY)
    expect(readScroll('/settings')).toBe(0)
  })
})

describe('pemisahan antar path', () => {
  it('posisi satu halaman tidak bocor ke halaman lain', () => {
    saveScroll('/settings', 900)
    saveScroll('/', 250)

    expect(readScroll('/settings')).toBe(900)
    expect(readScroll('/')).toBe(250)
    expect(readScroll('/export')).toBe(0)
  })

  it('menimpa posisi path yang sama', () => {
    saveScroll('/', 100)
    saveScroll('/', 300)
    expect(readScroll('/')).toBe(300)
  })
})

describe('clearScrollMemory', () => {
  it('mengosongkan semua posisi', () => {
    saveScroll('/', 100)
    saveScroll('/settings', 200)
    clearScrollMemory()
    expect(readScroll('/')).toBe(0)
    expect(readScroll('/settings')).toBe(0)
  })
})
