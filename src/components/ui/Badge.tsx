import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export const badgeVariants = cva(
  'theme-t inline-flex items-center gap-1 border px-1.5 py-0.5 text-[11px] font-medium',
  {
    variants: {
      tone: {
        neutral: 'border-border-base bg-bg-card text-text-muted',
        accent: 'border-transparent bg-accent text-accent-text',
        ok: 'border-transparent bg-status-ok-bg text-status-ok-text',
        warn: 'border-transparent bg-status-warn-bg text-status-warn-text',
        error: 'border-transparent bg-status-error-bg text-status-error-text',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />
}
