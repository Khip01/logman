import { useEffect } from 'react'
import { useUiStore } from '@/stores/ui'

/**
 * Menerapkan tema dan tier animasi ke elemen <html> sebagai atribut data.
 * CSS yang menangani sisanya, jadi pergantian tema tidak memicu re-render React.
 * Lihat AGENTS.md bagian 8.1 dan 10.
 *
 * Pergantian tema oleh user dilakukan lewat `setThemeAnimated` agar ada animasi.
 * Efek ini hanya menyinkronkan keadaan awal dan perubahan dari sumber lain.
 */
export function useThemeEffect(): void {
  const theme = useUiStore((state) => state.theme)
  const motion = useUiStore((state) => state.motion)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.motion = motion
  }, [motion])
}
