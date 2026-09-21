import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

/** Label tombol pintas keyboard, misal Ctrl+S. */
export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'theme-t inline-flex h-5 items-center border border-border-base bg-bg-card px-1.5',
        'font-mono text-[10px] text-text-muted',
        className,
      )}
      {...props}
    />
  )
}
