import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useMemo } from 'react'
import { findWeekOfDate, type MagangRange } from '@/lib/domain/calendar'
import { formatTanggalPendek } from '@/lib/domain/date'
import { monthIncompleteDates } from '@/lib/domain/editor'
import type { MonthGroup } from '@/lib/domain/types'
import { useLocale, useT } from '@/lib/i18n'
import { useLogbookStore } from '@/stores/logbook'
import { useLogsStore } from '@/stores/logs'

/**
 * Banner validasi di atas tabel (AGENTS.md bagian 11.3).
 *
 * Menampilkan daftar hari yang belum lengkap PADA BULAN AKTIF: hari yang dapat diisi
 * tetapi belum punya kegiatan maupun alasan. Hari di luar rentang dan baris milik bulan
 * lain tidak dihitung, karena memang tidak dapat diisi.
 *
 * Daftar hari bersifat interaktif: menekan salah satu hari memindahkan user ke minggu
 * yang memuat hari itu, memberi kilatan pada barisnya sesuai tier animasi, lalu
 * memfokuskan field kegiatan. Lihat `EditorRow` untuk kilatan dan fokusnya.
 *
 * Banner ini juga menjadi dasar validasi ekspor: server menolak ekspor dan tombol Ekspor
 * dinonaktifkan selama masih ada hari yang belum lengkap (AGENTS.md bagian 11.3 dan 12).
 */
export function ValidationBanner({ month, range }: { month: MonthGroup; range: MagangRange }) {
  const t = useT()
  const locale = useLocale()
  const days = useLogsStore((s) => s.data.days)
  const selectWeek = useLogbookStore((s) => s.selectWeek)
  const requestFocus = useLogbookStore((s) => s.requestFocus)

  const incomplete = useMemo(() => monthIncompleteDates(month, days, range), [month, days, range])

  if (incomplete.length === 0) {
    return (
      <div
        data-testid="validation-banner-ok"
        className="mb-4 flex items-center gap-2 border border-status-ok bg-status-ok-bg px-3 py-2"
      >
        <CheckCircle2 className="size-4 shrink-0 text-status-ok-text" strokeWidth={1.75} />
        <p className="text-[12px] text-status-ok-text">
          {t('validasi.lengkap', { bulan: month.label })}
        </p>
      </div>
    )
  }

  /** Melompat ke minggu hari itu, minta kilatan, lalu minta fokus ke field kegiatan. */
  function lompatKeHari(date: string) {
    const week = findWeekOfDate(month, date)
    if (!week) return
    // Pilih minggu dengan bulan konteks ini, agar baris milik bulan ini yang aktif dan
    // dapat diisi (AGENTS.md bagian 6).
    selectWeek(week.id, month.key)
    requestFocus(date)
  }

  return (
    <div className="mb-4 border border-status-warn bg-status-warn-bg px-3 py-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0 text-status-warn-text" strokeWidth={1.75} />
        <p className="text-[12px] font-medium text-status-warn-text">
          {t('validasi.belumLengkap', { n: incomplete.length, count: incomplete.length })}
        </p>
      </div>
      <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
        {incomplete.map((date) => (
          <li key={date} className="list-none">
            <button
              type="button"
              data-testid={`banner-day-${date}`}
              aria-label={t('validasi.lompatKe', { tanggal: formatTanggalPendek(date, locale) })}
              onClick={() => lompatKeHari(date)}
              className="theme-t flex items-center gap-1.5 border border-status-warn bg-bg-card px-2 py-1 text-[11px] text-status-warn-text hover:border-border-light hover:text-text-primary"
            >
              {formatTanggalPendek(date, locale)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
