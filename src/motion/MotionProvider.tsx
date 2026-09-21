import { domAnimation, LazyMotion } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Membungkus aplikasi dengan LazyMotion agar fitur animasi dimuat terpisah dari
 * bundle awal. Mode `strict` memaksa komponen memakai `m.*` dan bukan `motion.*`,
 * sehingga tidak ada impor Motion global (AGENTS.md bagian 8.3 dan 13).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}
