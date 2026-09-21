import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { MotionProvider } from './MotionProvider'

/**
 * Menggabungkan seluruh provider aplikasi di satu tempat:
 * - LazyMotion agar fitur animasi dimuat terpisah dari bundle awal.
 * - TooltipProvider agar Tooltip bisa dipakai di mana saja.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
    </MotionProvider>
  )
}
