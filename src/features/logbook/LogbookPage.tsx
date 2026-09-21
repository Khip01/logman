import { BookOpen, CalendarRange } from 'lucide-react'
import { navigate } from '@/app/router'
import { useLogbookStore } from '@/stores/logbook'

const MONTH_LABEL = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

/** Label panjang bulan, misal "September 2026". */
export function formatMonthLabel(year: number, monthIndex: number): string {
  return `${MONTH_LABEL[monthIndex]} ${year}`
}

export function LogbookPage() {
  const months = useLogbookStore((s) => s.months)

  if (months.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
        <CalendarRange className="size-8 text-text-dim" strokeWidth={1.5} />
        <h1 className="text-[17px] font-semibold text-text-primary">Rentang magang belum diatur</h1>
        <p className="text-[13px] leading-relaxed text-text-muted">
          Atur tanggal mulai dan selesai magang di Pengaturan. Daftar Log Book akan dibuat otomatis
          dari rentang tersebut.
        </p>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="theme-t border border-border-base bg-accent px-4 py-2 text-[13px] font-semibold text-accent-text hover:bg-accent-hover"
        >
          Buka Pengaturan
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="size-5 text-text-muted" strokeWidth={1.75} />
        <h1 className="text-[17px] font-semibold text-text-primary">Log Book</h1>
      </div>

      <p className="text-[13px] text-text-muted">
        {months.length} bulan terdeteksi dari rentang magang.
      </p>
    </div>
  )
}
