import { useEffect, useLayoutEffect, useRef } from 'react'
import { penandaUntukTombol, toggleInlineWrap } from '@/lib/domain/richTextShortcut'
import { cn } from '@/lib/utils/cn'

interface AutoGrowTextareaProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  placeholder?: string
  /** Bila nilainya berubah, textarea mengambil fokus. Dipakai banner validasi. */
  focusToken?: number
  /** Dipanggil saat fokus masuk dan keluar, dipakai peralihan mode baca dan edit. */
  onFocusChange?: (aktif: boolean) => void
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
 *
 * Pintasan format (AGENTS.md bagian 11.6): Ctrl+B membungkus teks terpilih dengan `**` dan
 * Ctrl+I dengan `*`. Logikanya ada di `richTextShortcut.ts` yang murni dan teruji, sehingga
 * komponen ini hanya menangani posisi kursor dan memulihkannya setelah nilai berubah.
 */
export function AutoGrowTextarea({
  value,
  onChange,
  onBlur,
  onKeyDown,
  disabled,
  placeholder,
  focusToken,
  onFocusChange,
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

  /*
   * Fokus terprogram dari banner validasi (AGENTS.md bagian 11.3). Memakai `token` yang
   * naik setiap permintaan, sehingga klik berulang pada hari yang sama tetap memfokuskan
   * ulang field ini.
   */
  useEffect(() => {
    if (focusToken === undefined) return
    ref.current?.focus()
  }, [focusToken])

  /**
   * Menerapkan pintasan format pada pilihan yang sedang aktif.
   *
   * Posisi kursor dipulihkan SETELAH React menulis nilai baru, karena nilai terkontrol
   * menempatkan kursor di ujung teks setiap kali nilainya berubah dari luar.
   */
  function terapkanPintasan(penanda: '**' | '*'): void {
    const node = ref.current
    if (!node) return
    const hasil = toggleInlineWrap(node.value, node.selectionStart, node.selectionEnd, penanda)
    onChange(hasil.teks)
    requestAnimationFrame(() => {
      const target = ref.current
      if (!target) return
      target.setSelectionRange(hasil.mulai, hasil.akhir)
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      const penanda = penandaUntukTombol(event.key)
      if (penanda) {
        // WAJIB dicegah: tanpa ini browser menjalankan perintah bawaannya, misalnya
        // membuka panel bookmark pada Ctrl+B.
        event.preventDefault()
        terapkanPintasan(penanda)
        return
      }
    }
    onKeyDown?.(event)
  }

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
      onBlur={() => {
        onFocusChange?.(false)
        onBlur?.()
      }}
      onFocus={() => onFocusChange?.(true)}
      onKeyDown={handleKeyDown}
      className={cn(
        'block w-full resize-none border-0 bg-transparent p-0',
        'text-[12px] leading-[19.5px] text-text-main print:text-doc-ink outline-none',
        'whitespace-pre-wrap break-words',
        'placeholder:text-text-dim print:placeholder:text-doc-muted',
        'disabled:cursor-not-allowed',
        className,
      )}
    />
  )
}
