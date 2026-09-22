import { Check, Plus } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Input } from './Input'

interface ComboboxProps {
  /** Daftar pilihan yang tersedia. */
  options: string[]
  /** Nilai saat ini. Boleh teks bebas di luar daftar. */
  value: string
  /** Dipanggil setiap nilai berubah, termasuk saat user mengetik. */
  onValueChange: (value: string) => void
  /**
   * Dipanggil HANYA saat user memilih entri (klik atau Enter), bukan saat mengetik.
   * Dipakai pemanggil yang ingin menahan draft sebelum commit.
   */
  onSelect?: (value: string) => void
  /** Dipanggil saat input kehilangan fokus. */
  onInputBlur?: () => void
  placeholder?: string
  /** Teks tombol untuk memakai nilai yang diketik bila belum ada di daftar. */
  createLabel?: (value: string) => string
  className?: string
  disabled?: boolean
  /** Nama aksesibilitas input, dipakai bila tidak dibungkus label eksternal. */
  'aria-label'?: string
}

/** Satu baris pada daftar dropdown: pilihan biasa atau aksi membuat nilai baru. */
interface Entry {
  kind: 'option' | 'create'
  /** Nilai yang akan dipakai saat entri ini dipilih. */
  value: string
  /** Teks yang ditampilkan. */
  label: string
}

/**
 * Combobox: pilih dari daftar ATAU ketik teks bebas (AGENTS.md bagian 11.3).
 *
 * Sengaja TIDAK memakai Radix Popover. Pada versi Radix yang dipakai proyek ini,
 * popover yang dibuka lewat `PopoverAnchor` tanpa `PopoverTrigger` langsung tertutup
 * kembali karena interaksi pada input dianggap "di luar" konten. Bug itu membuat
 * combobox tidak pernah terbuka. Implementasi mandiri di bawah ini mengelola fokus,
 * klik luar, dan navigasi keyboard secara eksplisit, sehingga perilakunya dapat diuji.
 *
 * Aksesibilitas: input memakai `role="combobox"` dengan `aria-expanded`,
 * `aria-controls`, dan `aria-activedescendant`; daftar memakai `role="listbox"`.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  onSelect,
  onInputBlur,
  placeholder = 'Pilih atau ketik',
  createLabel = (v) => `Gunakan "${v}"`,
  className,
  disabled,
  'aria-label': ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase()
    if (!query) return options
    return options.filter((option) => option.toLowerCase().includes(query))
  }, [options, value])

  const exactMatch = options.some((option) => option.toLowerCase() === value.trim().toLowerCase())
  const canCreate = value.trim().length > 0 && !exactMatch

  const entries: Entry[] = useMemo(() => {
    const list: Entry[] = filtered.map((option) => ({
      kind: 'option',
      value: option,
      label: option,
    }))
    if (canCreate) {
      list.push({ kind: 'create', value: value.trim(), label: createLabel(value.trim()) })
    }
    return list
  }, [filtered, canCreate, value, createLabel])

  // Klik di luar menutup daftar. Didengarkan pada pointerdown agar tidak bertabrakan
  // dengan fokus input.
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Indeks aktif direset saat daftar berubah agar tidak menunjuk entri yang hilang.
  useEffect(() => {
    setActiveIndex(entries.length > 0 ? 0 : -1)
  }, [entries.length])

  function select(entry: Entry) {
    onValueChange(entry.value)
    onSelect?.(entry.value)
    setOpen(false)
    inputRef.current?.focus()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      setActiveIndex((index) => Math.min(index + 1, entries.length - 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      const entry = entries[activeIndex]
      if (open && entry) {
        event.preventDefault()
        select(entry)
      }
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const activeId = open && entries[activeIndex] ? `${listId}-${activeIndex}` : undefined

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Input
        ref={inputRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        onChange={(event) => {
          onValueChange(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={onInputBlur}
        onKeyDown={onKeyDown}
      />

      {open && !disabled ? (
        <ul
          id={listId}
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: role listbox untuk daftar pilihan combobox
          role="listbox"
          className="theme-t absolute inset-x-0 top-full z-50 m-0 mt-1 max-h-52 list-none overflow-y-auto border border-border-base bg-bg-card p-1"
        >
          {entries.length === 0 ? (
            <li className="list-none px-2 py-1.5 text-[12px] text-text-dim">Tidak ada pilihan</li>
          ) : null}

          {entries.map((entry, index) => {
            const isSelected = entry.kind === 'option' && entry.value === value
            const isActive = index === activeIndex
            return (
              <li key={`${entry.kind}-${entry.value}`} className="list-none">
                <button
                  type="button"
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  // Menahan fokus agar blur input tidak menutup daftar sebelum klik
                  // sempat diproses.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(entry)}
                  className={cn(
                    'theme-t flex w-full items-center gap-2 px-2 py-1.5 text-left text-[13px]',
                    isActive ? 'bg-bg-card-hover' : '',
                    isSelected ? 'text-text-primary' : 'text-text-main',
                  )}
                >
                  <span className="grid size-3.5 shrink-0 place-items-center">
                    {entry.kind === 'create' ? (
                      <Plus className="size-3.5" strokeWidth={2} />
                    ) : isSelected ? (
                      <Check className="size-3.5" strokeWidth={2} />
                    ) : null}
                  </span>
                  <span className="truncate">{entry.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
