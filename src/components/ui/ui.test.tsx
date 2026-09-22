import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/motion/AppProviders'
import { Combobox } from './Combobox'
import { DateInput } from './DateInput'
import { SegmentedControl } from './SegmentedControl'
import { Switch } from './Switch'
import { TimePicker } from './TimePicker'

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

describe('TimePicker', () => {
  it('menampilkan nilai 24 jam apa adanya', () => {
    renderWithProviders(
      <TimePicker value="08.00" onChange={() => {}} format="24" label="Jam uji" />,
    )
    expect(screen.getByLabelText('Jam uji')).toHaveValue('08.00')
  })

  it('menampilkan nilai 12 jam dengan AM/PM', () => {
    renderWithProviders(
      <TimePicker value="16.30" onChange={() => {}} format="12" label="Jam uji" />,
    )
    expect(screen.getByLabelText('Jam uji')).toHaveValue('4.30 PM')
  })

  it('menormalkan masukan 24 jam menjadi format titik', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(<TimePicker value="" onChange={onChange} format="24" label="Jam uji" />)

    const input = screen.getByLabelText('Jam uji')
    await user.type(input, '7:05')
    await user.tab()
    expect(onChange).toHaveBeenCalledWith('07.05')
  })

  it('memilih jam dan menit dari popover', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <TimePicker value="08.00" onChange={onChange} format="24" label="Jam uji" />,
    )

    await user.click(screen.getByRole('button', { name: 'Buka pemilih jam' }))
    await user.click(await screen.findByRole('option', { name: '09' }))
    expect(onChange).toHaveBeenCalledWith('09.00')
  })

  it('menyediakan toggle AM/PM pada format 12', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <TimePicker value="08.00" onChange={onChange} format="12" label="Jam uji" />,
    )

    await user.click(screen.getByRole('button', { name: 'Buka pemilih jam' }))
    await user.click(await screen.findByRole('button', { name: 'PM' }))
    expect(onChange).toHaveBeenCalledWith('20.00')
  })
})

describe('DateInput', () => {
  it('merender input tanggal dengan tombol pemilih', () => {
    render(<DateInput aria-label="Tanggal mulai" value="2026-09-01" onChange={() => {}} />)
    expect(screen.getByLabelText('Tanggal mulai')).toHaveValue('2026-09-01')
    expect(screen.getByRole('button', { name: 'Buka pemilih tanggal' })).toBeInTheDocument()
  })
})
