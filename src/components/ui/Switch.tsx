import * as SwitchPrimitive from '@radix-ui/react-switch'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Toggle switch kustom (bukan checkbox bawaan). Perpindahan knob memakai `transform`,
 * bukan `left` (AGENTS.md bagian 8.2 dan 10).
 */
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'theme-t peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border',
        'border-border-light bg-bg-input',
        'data-[state=checked]:border-transparent data-[state=checked]:bg-accent',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'theme-t pointer-events-none block size-3.5 translate-x-0.5 bg-text-dim',
          'data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-accent-text',
        )}
      />
    </SwitchPrimitive.Root>
  )
}
