import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Checkbox kustom dengan ikon Lucide (tanpa emoji, AGENTS.md bagian 9).
 * Ikon dipilih lewat `data-state` pada Indicator memakai pola group.
 */
export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'theme-t peer grid size-4 shrink-0 place-items-center border border-border-light bg-bg-input',
        'data-[state=checked]:border-transparent data-[state=checked]:bg-accent',
        'data-[state=indeterminate]:border-transparent data-[state=indeterminate]:bg-accent',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="group grid place-items-center text-accent-text"
      >
        <Check className="hidden size-3 group-data-[state=checked]:block" strokeWidth={3} />
        <Minus className="hidden size-3 group-data-[state=indeterminate]:block" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
