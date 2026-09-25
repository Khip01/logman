import { describe, expect, it } from 'vitest'
import { APP_NAME, pageTitleFor } from './pageTitle'

/**
 * Judul dokumen per halaman (AGENTS.md bagian 21).
 *
 * Judul dibangun dari path, bukan dari teks yang tampil, supaya bahasa tidak bocor ke
 * logika routing. Halaman utama memakai nama produk saja.
 */
describe('pageTitleFor', () => {
  it('memakai nama produk saja di halaman utama', () => {
    expect(pageTitleFor('/', 'id')).toBe(APP_NAME)
    expect(pageTitleFor('/', 'en')).toBe(APP_NAME)
  })

  it('menggabungkan nama halaman dan nama produk', () => {
    expect(pageTitleFor('/settings', 'id')).toBe('Pengaturan - Log Book Manager')
    expect(pageTitleFor('/settings', 'en')).toBe('Settings - Log Book Manager')
  })

  it('menerjemahkan halaman ekspor dan log book', () => {
    expect(pageTitleFor('/export', 'en')).toBe('Export PDF - Log Book Manager')
    expect(pageTitleFor('/', 'en')).toBe('Log Book Manager')
  })

  it('memakai judul tidak ditemukan untuk path tak dikenal', () => {
    expect(pageTitleFor('/entah', 'id')).toBe('Halaman tidak ditemukan - Log Book Manager')
    expect(pageTitleFor('/entah', 'en')).toBe('Page not found - Log Book Manager')
  })
})
