import { Check, Plus } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Input } from './Input'
import { Popover, PopoverAnchor, PopoverContent } from './Popover'

interface ComboboxProps {
  /** Daftar pilihan yang tersedia. */
  options: string[]
  /** Nilai saat ini. Boleh teks bebas di luar daftar. */
  value: string
  /** Dipanggil saat nilai berubah. */
  onValueChange: (value: string) => void
  placeholder?: string
  /** Teks tombol untuk memakai nilai yang diketik bila belum ada di daftar. */
  createLabel?: (value: string) => string
  className?: string
  disabled?: boolean
}

/**
 * Combobox: pilih dari daftar ATAU ketik teks bebas (AGENTS.md bagian 11.3).
 * Ini dipakai untuk kolom alasan hari kosong.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Pilih atau ketik',
  createLabel = (v) => `Gunakan "${v}"`,
  className,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase()
    if (!query) return options
    return options.filter((option) => option.toLowerCase().includes(query))
  }, [options, value])

  const exactMatch = options.some((option) => option.toLowerCase() === value.trim().toLowerCase())
  const canCreate = value.trim().length > 0 && !exactMatch

  function select(next: string) {
    onValueChange(next)
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn('relative', className)}>
          <Input
            ref={inputRef}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            onChange={(event) => {
              onValueChange(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setOpen(false)
            }}
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={() => setOpen(false)}
      >
        {/* biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: role listbox untuk daftar pilihan combobox */}
        <ul id={listId} role="listbox" className="m-0 max-h-52 list-none overflow-y-auto p-0">
          {filtered.map((option) => {
            const isSelected = option === value
            return (
              <li key={option} className="list-none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => select(option)}
                  className={cn(
                    'theme-t flex w-full items-center gap-2 px-2 py-1.5 text-left text-[13px]',
                    isSelected
                      ? 'bg-bg-card-hover text-text-primary'
                      : 'text-text-main hover:bg-bg-card-hover',
                  )}
                >
                  <span className="grid size-3.5 shrink-0 place-items-center">
                    {isSelected ? <Check className="size-3.5" strokeWidth={2} /> : null}
                  </span>
                  <span className="truncate">{option}</span>
                </button>
              </li>
            )
          })}

          {filtered.length === 0 && !canCreate ? (
            <li className="list-none px-2 py-1.5 text-[12px] text-text-dim">Tidak ada pilihan</li>
          ) : null}

          {canCreate ? (
            <li className="list-none">
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => select(value.trim())}
                className="theme-t flex w-full items-center gap-2 px-2 py-1.5 text-left text-[13px] text-text-main hover:bg-bg-card-hover"
              >
                <Plus className="size-3.5 shrink-0" strokeWidth={2} />
                <span className="truncate">{createLabel(value.trim())}</span>
              </button>
            </li>
          ) : null}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
