import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  formatJamDisplay,
  type JamFormat,
  type Meridiem,
  minuteOptions,
  parseJam24,
  parseJamDisplay,
  to12Hour,
  to24Hour,
  toJam24,
} from '@/lib/domain/jamFormat'
import { cn } from '@/lib/utils/cn'
import { inputVariants } from './Input'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'

interface TimePickerProps {
  /** Nilai tersimpan 24 jam format titik, misal "08.00". String kosong berarti belum diisi. */
  value: string
  /** Dipanggil dengan nilai 24 jam format titik saat user memilih atau mengetik. */
  onChange: (value: string) => void
  /** Format tampilan yang dipilih user. Nilai tersimpan tetap 24 jam. */
  format: JamFormat
  /** Nama aksesibilitas, misal "Jam masuk Senin". */
  label: string
  disabled?: boolean
  /** Nilai contoh yang dipakai saat kosong, misal jam default. */
  placeholder?: string
  /** `field` tampil seperti input biasa, `cell` tanpa border untuk di dalam tabel. */
  variant?: 'field' | 'cell'
  className?: string
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i)
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1)

/**
 * Pemilih jam dengan pemicu popover, mendukung format 24 dan 12 jam (AGENTS.md
 * bagian 11.2). Nilai yang disimpan selalu 24 jam format titik; format hanya mengubah
 * cara jam ditampilkan dan dimasukkan.
 *
 * Input teks tetap tersedia agar pengisian cepat dengan keyboard, dan tombol jam
 * membuka pemilih untuk memilih jam dan menit tanpa mengetik.
 */
export function TimePicker({
  value,
  onChange,
  format,
  label,
  disabled,
  placeholder,
  variant = 'field',
  className,
}: TimePickerProps) {
  const [draft, setDraft] = useState(formatJamDisplay(value, format))
  const [error, setError] = useState<string | null>(null)

  // Sinkronkan saat nilai tersimpan berubah dari luar (misal setelah load config).
  useEffect(() => {
    setDraft(formatJamDisplay(value, format))
    setError(null)
  }, [value, format])

  function commit(raw: string) {
    const trimmed = raw.trim()
    if (trimmed === '') {
      setError(null)
      setDraft('')
      if (value !== '') onChange('')
      return
    }
    const normalized = parseJamDisplay(trimmed, format)
    if (!normalized) {
      setError(format === '24' ? 'Format jam HH.MM, misal 08.00.' : 'Format jam, misal 8.00 AM.')
      return
    }
    setError(null)
    setDraft(formatJamDisplay(normalized, format))
    if (normalized !== value) onChange(normalized)
  }

  function pick(normalized: string) {
    setError(null)
    setDraft(formatJamDisplay(normalized, format))
    if (normalized !== value) onChange(normalized)
  }

  const parts = parseJam24(value)
  const reference = parts ?? parseJam24(placeholder ?? '') ?? { hh: 8, mm: 0 }
  const { hh: hh12, meridiem } = to12Hour(reference.hh)

  const isCell = variant === 'cell'

  return (
    <div className={cn(isCell ? 'flex flex-col items-center' : 'flex flex-col gap-1', className)}>
      <div className={cn('flex items-center', isCell ? 'w-full' : 'gap-1')}>
        <input
          type="text"
          inputMode={format === '24' ? 'numeric' : 'text'}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          value={draft}
          placeholder={placeholder ? formatJamDisplay(placeholder, format) : undefined}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
            if (event.key === 'Escape') {
              setDraft(formatJamDisplay(value, format))
              setError(null)
            }
          }}
          className={cn(
            isCell
              ? 'w-full border-0 bg-transparent p-0 text-center text-[12px] text-text-main outline-none placeholder:text-text-dim print:hidden'
              : cn(inputVariants({ size: 'md' }), 'w-28'),
          )}
        />

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label="Buka pemilih jam"
              title={`Pilih ${label}`}
              data-testid="time-picker-trigger"
              className={cn(
                'theme-t shrink-0 text-text-muted no-print hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50',
                isCell
                  ? 'grid size-4 place-items-center print:hidden'
                  : 'grid size-9 place-items-center border border-border-base bg-bg-input',
              )}
            >
              <Clock className={isCell ? 'size-3' : 'size-4'} strokeWidth={1.75} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56">
            <p className="mb-2 text-[12px] font-semibold text-text-primary">{label}</p>
            <div className="flex gap-2">
              <TimeGrid
                title="Jam"
                values={format === '24' ? HOURS_24 : HOURS_12}
                selected={format === '24' ? reference.hh : hh12}
                render={(hour) => (format === '24' ? String(hour).padStart(2, '0') : String(hour))}
                onSelect={(hour) =>
                  pick(
                    format === '24'
                      ? (toJam24(hour, reference.mm) ?? value)
                      : (toJam24(to24Hour(hour, meridiem), reference.mm) ?? value),
                  )
                }
              />
              <TimeGrid
                title="Menit"
                values={minuteOptions(parts ? reference.mm : null)}
                selected={reference.mm}
                render={(minute) => String(minute).padStart(2, '0')}
                onSelect={(minute) => pick(toJam24(reference.hh, minute) ?? value)}
              />
            </div>

            {format === '12' ? (
              <div className="mt-2 flex border border-border-base">
                {(['AM', 'PM'] as Meridiem[]).map((item) => {
                  const active = item === meridiem
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={active}
                      onClick={() => pick(toJam24(to24Hour(hh12, item), reference.mm) ?? value)}
                      className={cn(
                        'theme-t flex-1 px-2 py-1 text-[12px] font-medium',
                        active
                          ? 'bg-accent text-accent-text'
                          : 'text-text-muted hover:text-text-primary',
                      )}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>

      {error ? (
        <p role="alert" className="text-[11px] leading-relaxed text-status-error-text">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Grid pilihan angka yang bisa digulir. Dipakai untuk jam dan menit. */
function TimeGrid({
  title,
  values,
  selected,
  render,
  onSelect,
}: {
  title: string
  values: number[]
  selected: number
  render: (value: number) => string
  onSelect: (value: number) => void
}) {
  return (
    <div className="flex-1">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-text-dim">{title}</p>
      <div
        role="listbox"
        aria-label={title}
        className="grid max-h-40 grid-cols-3 gap-1 overflow-y-auto"
      >
        {values.map((item) => {
          const active = item === selected
          return (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => onSelect(item)}
              className={cn(
                'theme-t px-1 py-1 text-[12px] tabular-nums',
                active
                  ? 'bg-accent text-accent-text'
                  : 'text-text-muted hover:bg-bg-card-hover hover:text-text-primary',
              )}
            >
              {render(item)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
