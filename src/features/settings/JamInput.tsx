import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { normalizeJam } from '@/lib/domain/schema'

interface JamInputProps {
  /** Nilai tersimpan dalam format titik, misal "08.00". */
  value: string
  /** Dipanggil saat nilai valid dikomit, selalu format titik. */
  onCommit: (value: string) => void
  /** Nama aksesibilitas, misal "Jam masuk Senin". */
  label: string
  disabled?: boolean
}

/**
 * Input jam dengan format titik (AGENTS.md bagian 11.2).
 *
 * `input type="time"` menampilkan format yang ditentukan locale browser (bisa "08:00"),
 * sehingga tidak dipakai di sini. Sebagai gantinya input teks dengan normalisasi ke
 * format titik saat blur atau Enter. Nilai disimpan lokal selama mengetik agar
 * autosave hanya berjalan saat nilai sudah valid.
 */
export function JamInput({ value, onCommit, label, disabled }: JamInputProps) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)

  // Sinkronkan saat nilai tersimpan berubah dari luar (misal setelah load config).
  useEffect(() => {
    setDraft(value)
    setError(null)
  }, [value])

  function commit() {
    const normalized = normalizeJam(draft)
    if (!normalized) {
      setError('Format jam HH.MM, misal 08.00.')
      return
    }
    setError(null)
    setDraft(normalized)
    if (normalized !== value) onCommit(normalized)
  }

  return (
    <div className="flex flex-col gap-1">
      <Input
        value={draft}
        disabled={disabled}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        inputMode="numeric"
        placeholder="08.00"
        className="w-24"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape') {
            setDraft(value)
            setError(null)
          }
        }}
      />
      {error ? (
        <p role="alert" className="text-[11px] leading-relaxed text-status-error-text">
          {error}
        </p>
      ) : null}
    </div>
  )
}
