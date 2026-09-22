import { domAnimation, LazyMotion } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Membungkus aplikasi dengan LazyMotion agar fitur animasi dimuat terpisah dari
 * bundle awal.
 *
 * CATATAN: mode `strict` SENGAJA tidak dipakai. Strict menghalangi fitur `layout`
 * yang dipakai tombol buka/tutup sidebar untuk memindahkan tingginya secara mulus
 * (AGENTS.md bagian 8.3.2), dan gejalanya diam tanpa error. Penggantinya adalah audit
 * statis `scripts/audit-motion.mjs` yang menolak impor Motion global, menolak animasi
 * properti tata letak, dan membatasi prop `layout` hanya di Sidebar.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
