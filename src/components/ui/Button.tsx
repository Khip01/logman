import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Tombol. Varian lewat CVA, sudut tegas, aksen monokrom (AGENTS.md bagian 10 dan 17).
 */
export const buttonVariants = cva(
  cn(
    'theme-t inline-flex select-none items-center justify-center gap-2 border',
    'font-medium whitespace-nowrap',
    'disabled:pointer-events-none disabled:opacity-45',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ),
  {
    variants: {
      variant: {
        primary: 'border-transparent bg-accent text-accent-text hover:bg-accent-hover',
        outline: 'border-border-base bg-transparent text-text-main hover:bg-bg-card',
        ghost:
          'border-transparent bg-transparent text-text-muted hover:bg-bg-card hover:text-text-primary',
        danger:
          'border-status-error bg-transparent text-status-error-text hover:bg-status-error-bg',
      },
      size: {
        sm: 'h-7 px-2.5 text-[12px] [&_svg]:size-3.5',
        md: 'h-9 px-3.5 text-[13px] [&_svg]:size-4',
        lg: 'h-10 px-5 text-[14px] [&_svg]:size-4',
        icon: 'size-9 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render sebagai elemen anak (misal tautan), memakai Radix Slot. */
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
