import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor

/**
 * Isi popover.
 *
 * WAJIB memakai portal. Konten popover yang di-render di tempat akan berada di dalam
 * elemen ber-`zoom` (skala tampilan konten, AGENTS.md bagian 11.2). Perhitungan posisi
 * `position: fixed` mengabaikan zoom, jadi popover akan tampil jauh dari pemicunya saat
 * skala bukan 1. Portal memindahkannya keluar dari konteks zoom tersebut.
 */
export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 4,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'theme-t no-print z-50 w-72 border border-border-base bg-bg-card p-3',
          'focus:outline-none',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
