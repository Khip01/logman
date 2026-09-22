import { Calendar } from 'lucide-react'
import { type InputHTMLAttributes, type Ref, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { inputVariants } from './Input'

export interface DateInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  ref?: Ref<HTMLInputElement>
}

/**
 * Input tanggal dengan ikon kalender bertema (AGENTS.md bagian 10).
 *
 * Indikator kalender bawaan browser diwarnai oleh `color-scheme`, sehingga pada tema
 * terang yang memakai teks gelap ikonnya nyaris tidak terlihat. Karena itu indikator
 * bawaan disembunyikan dan diganti ikon Lucide yang memakai token tema, sehingga
 * konsisten di seluruh 9 tema. Ikon tetap membuka pemilih tanggal bawaan lewat
 * `showPicker` bila browser mendukung.
 */
export function DateInput({ className, ref, ...props }: DateInputProps) {
  const innerRef = useRef<HTMLInputElement | null>(null)

  function setRef(node: HTMLInputElement | null) {
    innerRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) (ref as { current: HTMLInputElement | null }).current = node
  }

  function openPicker() {
    const node = innerRef.current
    if (!node) return
    node.focus()
    node.showPicker?.()
  }

  return (
    <div className="relative">
      <input
        ref={setRef}
        type="date"
        data-slot="input"
        className={cn(
          inputVariants({ size: 'md' }),
          'pr-9',
          '[&::-webkit-calendar-picker-indicator]:hidden',
          className,
        )}
        {...props}
      />
      <button
        type="button"
        aria-label="Buka pemilih tanggal"
        onClick={openPicker}
        className="theme-t absolute inset-y-0 right-0 grid w-9 place-items-center text-text-muted hover:text-text-primary"
      >
        <Calendar className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  )
}
