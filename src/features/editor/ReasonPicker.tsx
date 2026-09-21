import { useState } from 'react'
import { Combobox } from '@/components/ui/Combobox'

/**
 * Pemilih alasan untuk hari yang masih kosong (AGENTS.md bagian 11.3).
 *
 * Menahan teks sebagai draft lokal dan hanya mengirim ke store saat user memilih entri
 * (klik atau Enter) atau meninggalkan input. Tanpa ini, setiap huruf langsung ter-commit,
 * pemilih ikut hilang karena hari berubah menjadi "berisi alasan", dan user tidak pernah
 * selesai mengetik.
 */
export function ReasonPicker({
  options,
  onCommit,
  disabled,
}: {
  options: string[]
  onCommit: (alasan: string) => void
  disabled?: boolean
}) {
  const [draft, setDraft] = useState('')

  function commit(value: string) {
    const trimmed = value.trim()
    if (trimmed === '') return
    setDraft('')
    onCommit(trimmed)
  }

  return (
    <Combobox
      options={options}
      value={draft}
      disabled={disabled}
      onValueChange={setDraft}
      onSelect={commit}
      onInputBlur={() => commit(draft)}
      placeholder="Atau pilih alasan"
      className="[&_input]:h-6 [&_input]:border-dashed [&_input]:text-[11px]"
    />
  )
}
