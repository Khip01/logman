import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/motion/AppProviders'
import { Combobox } from './Combobox'
import { SegmentedControl } from './SegmentedControl'
import { Switch } from './Switch'

function renderWithProviders(node: React.ReactNode) {
  return render(<AppProviders>{node}</AppProviders>)
}

describe('Switch', () => {
  it('memanggil onCheckedChange saat diklik', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Switch aria-label="Simpan otomatis" onCheckedChange={onChange} />)

    await user.click(screen.getByRole('switch', { name: 'Simpan otomatis' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('SegmentedControl', () => {
  const options = [
    { value: 'a' as const, label: 'A4' },
    { value: 'b' as const, label: 'F4' },
  ]

  it('menandai opsi aktif lewat aria-checked', () => {
    render(
      <SegmentedControl aria-label="Kertas" options={options} value="a" onValueChange={() => {}} />,
    )
    expect(screen.getByRole('radio', { name: 'A4' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'F4' })).not.toBeChecked()
  })

  it('memanggil onValueChange saat opsi lain dipilih', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <SegmentedControl aria-label="Kertas" options={options} value="a" onValueChange={onChange} />,
    )

    await user.click(screen.getByRole('radio', { name: 'F4' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})

describe('Combobox', () => {
  const options = ['Libur Nasional', 'Sakit']

  /** Harness stateful, karena Combobox adalah komponen terkontrol. */
  function ComboboxHarness({ onChange }: { onChange?: (value: string) => void }) {
    const [value, setValue] = useState('')
    return (
      <Combobox
        options={options}
        value={value}
        onValueChange={(next) => {
          setValue(next)
          onChange?.(next)
        }}
      />
    )
  }

  it('menampilkan daftar pilihan saat fokus', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ComboboxHarness />)

    await user.click(screen.getByRole('combobox'))
    expect(await screen.findByRole('option', { name: 'Libur Nasional' })).toBeInTheDocument()
  })

  it('memilih opsi dari daftar', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<ComboboxHarness onChange={onChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Sakit' }))
    expect(onChange).toHaveBeenCalledWith('Sakit')
  })

  it('memungkinkan teks bebas di luar daftar', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<ComboboxHarness onChange={onChange} />)

    await user.type(screen.getByRole('combobox'), 'Dinas Luar')
    await user.click(await screen.findByRole('option', { name: 'Gunakan "Dinas Luar"' }))
    expect(onChange).toHaveBeenCalledWith('Dinas Luar')
  })
})
