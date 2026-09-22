import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { log } from '@/lib/log'
import { FeatureErrorBoundary } from './FeatureErrorBoundary'

vi.mock('@/lib/log', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    newTrace: () => 'trace-uji',
  },
}))

function Boom(): ReactNode {
  throw new Error('ledakan uji')
}

describe('FeatureErrorBoundary', () => {
  it('me-render anak normal tanpa fallback', () => {
    render(
      <FeatureErrorBoundary name="uji">
        <p>konten sehat</p>
      </FeatureErrorBoundary>,
    )
    expect(screen.getByText('konten sehat')).toBeVisible()
  })

  it('menampilkan fallback dan melaporkan lewat logger dengan traceId', () => {
    // React sendiri ikut menulis ke console saat boundary menangkap error.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      render(
        <FeatureErrorBoundary name="uji">
          <Boom />
        </FeatureErrorBoundary>,
      )
      expect(screen.getByText('Fitur "uji" gagal dimuat')).toBeVisible()
      expect(screen.getByText(/ledakan uji/)).toBeVisible()
      expect(log.error).toHaveBeenCalledWith(
        'fitur.gagal',
        expect.stringContaining('"uji"'),
        expect.objectContaining({
          traceId: 'trace-uji',
          data: expect.objectContaining({ fitur: 'uji' }),
        }),
      )
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('tombol coba lagi me-reset boundary', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      render(
        <FeatureErrorBoundary name="uji">
          <Boom />
        </FeatureErrorBoundary>,
      )
      // Anak masih melempar, jadi boundary langsung menangkap ulang setelah reset.
      fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
      expect(screen.getByText('Fitur "uji" gagal dimuat')).toBeVisible()
    } finally {
      errorSpy.mockRestore()
    }
  })
})
