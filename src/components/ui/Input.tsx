import { cva, type VariantProps } from 'class-variance-authority'
import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Input teks. Sudut tegas, border tipis, fokus memakai border terang.
 * Transisi hanya pada warna (AGENTS.md bagian 8.2).
 */
export const inputVariants = cva(
  cn(
    'theme-t w-full border bg-bg-input text-text-main',
    'placeholder:text-text-dim',
    'border-border-base hover:border-border-light',
    'focus:border-border-focus focus:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ),
  {
    variants: {
      size: {
        sm: 'h-7 px-2 text-[12px]',
        md: 'h-9 px-2.5 text-[13px]',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  ref?: Ref<HTMLInputElement>
}

export function Input({ className, size, ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      data-slot="input"
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>
}

export function Textarea({ className, ref, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        'theme-t w-full resize-none border border-border-base bg-bg-input px-2.5 py-2',
        'text-[13px] leading-relaxed text-text-main',
        'placeholder:text-text-dim',
        'hover:border-border-light focus:border-border-focus focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
