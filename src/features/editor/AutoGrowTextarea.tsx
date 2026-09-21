import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface AutoGrowTextareaProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  placeholder?: string
  'aria-label': string
  className?: string
}

/**
 * Textarea tanpa border yang tumbuh mengikuti isi (AGENTS.md bagian 11.2).
 *
 * Tinggi diset ke `scrollHeight` setiap perubahan, sehingga TIDAK ADA scrollbar di
 * dalam sel dan baris tabel ikut memanjang. `height` adalah properti tata letak, jadi
 * pengaturannya dilakukan di luar animasi: tidak ada transisi pada height. Ini satu
 * satunya tempat di mana ukuran berubah, dan itu memang perilaku dokumen yang diminta,
 * bukan animasi.
 *
 * Mengapa bukan `contenteditable`: rawan cursor lompat dan menempelkan format asing.
 * Textarea memberi perilaku teks polos yang dapat diprediksi.
 */
export function AutoGrowTextarea({
  value,
  onChange,
  onBlur,
  onKeyDown,
  disabled,
  placeholder,
  'aria-label': ariaLabel,
  className,
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Tinggi harus diukur ulang setiap isi berubah, termasuk saat berubah dari luar
  // (misal data selesai dimuat). Karena itu `value` memang dependency yang disengaja.
  // biome-ignore lint/correctness/useExhaustiveDependencies: value memang dependency yang disengaja
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    // Reset dulu agar scrollHeight mengukur isi, bukan tinggi sebelumnya.
    node.style.height = 'auto'
    node.style.height = `${node.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      rows={1}
      spellCheck={false}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className={cn(
        'block w-full resize-none border-0 bg-transparent p-0',
        'text-[12px] leading-relaxed text-doc-ink outline-none',
        'whitespace-pre-wrap break-words',
        'placeholder:text-doc-muted',
        'disabled:cursor-not-allowed',
        className,
      )}
    />
  )
}
