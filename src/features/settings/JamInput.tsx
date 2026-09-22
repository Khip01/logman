import { TimePicker } from '@/components/ui/TimePicker'
import type { JamFormat } from '@/lib/domain/jamFormat'

interface JamInputProps {
  /** Nilai tersimpan dalam format titik 24 jam, misal "08.00". */
  value: string
  /** Dipanggil saat nilai valid dikomit, selalu format titik 24 jam. */
  onCommit: (value: string) => void
  /** Nama aksesibilitas, misal "Jam masuk Senin". */
  label: string
  /** Format tampilan yang dipilih user di Pengaturan. */
  format: JamFormat
  disabled?: boolean
}

/**
 * Input jam di Pengaturan (AGENTS.md bagian 11.2).
 *
 * Nilai selalu disimpan 24 jam format titik. Tampilan mengikuti `format` yang dipilih
 * user (24 atau 12 jam) dan pemilihannya lewat `TimePicker`, sehingga user bisa mengetik
 * atau memilih dari popover.
 */
export function JamInput({ value, onCommit, label, format, disabled }: JamInputProps) {
  return (
    <TimePicker
      value={value}
      onChange={onCommit}
      format={format}
      label={label}
      disabled={disabled}
    />
  )
}
