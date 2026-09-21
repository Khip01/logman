import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Label } from './Label'

interface FieldProps {
  /** Id kontrol, dipakai untuk menghubungkan label dan pesan error. */
  htmlFor?: string
  label?: ReactNode
  description?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  children: ReactNode
}

/**
 * Pembungkus field: label, deskripsi, kontrol, dan pesan error. Menyatukan pola
 * aksesibilitas agar tidak diulang di setiap form.
 */
export function Field({
  htmlFor,
  label,
  description,
  error,
  required,
  className,
  children,
}: FieldProps) {
  const descriptionId = htmlFor ? `${htmlFor}-description` : undefined
  const errorId = htmlFor ? `${htmlFor}-error` : undefined

  return (
    <div data-slot="field" className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className="ml-1 text-status-error-text">*</span> : null}
        </Label>
      ) : null}

      {children}

      {description && !error ? (
        <p id={descriptionId} className="text-[11px] leading-relaxed text-text-dim">
          {description}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-[11px] leading-relaxed text-status-error-text">
          {error}
        </p>
      ) : null}
    </div>
  )
}
