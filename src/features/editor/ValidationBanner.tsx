import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useMemo } from 'react'
import type { MagangRange } from '@/lib/domain/calendar'
import { formatTanggalPendek } from '@/lib/domain/date'
import { monthIncompleteDates } from '@/lib/domain/editor'
import type { MonthGroup } from '@/lib/domain/types'
import { useLogsStore } from '@/stores/logs'

/**
 * Banner validasi di atas tabel (AGENTS.md bagian 11.3).
 *
 * Menampilkan daftar hari yang belum lengkap: hari yang dapat diisi tetapi belum punya
 * kegiatan maupun alasan. Hari di luar rentang dan baris milik bulan lain tidak
 * dihitung, karena memang tidak dapat diisi.
 *
 * Banner ini bersifat informasi di layar, tetapi daftar yang sama menjadi dasar
 * validasi ekspor: server menolak ekspor dan tombol Ekspor dinonaktifkan selama
 * masih ada hari yang belum lengkap (AGENTS.md bagian 11.3 dan 12).
 */
export function ValidationBanner({ month, range }: { month: MonthGroup; range: MagangRange }) {
  const days = useLogsStore((s) => s.data.days)

  const incomplete = useMemo(() => monthIncompleteDates(month, days, range), [month, days, range])

  if (incomplete.length === 0) {
    return (
      <div className="mb-4 flex items-center gap-2 border border-status-ok bg-status-ok-bg px-3 py-2">
        <CheckCircle2 className="size-4 shrink-0 text-status-ok-text" strokeWidth={1.75} />
        <p className="text-[12px] text-status-ok-text">
          Semua hari pada {month.label} sudah lengkap.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-4 border border-status-warn bg-status-warn-bg px-3 py-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0 text-status-warn-text" strokeWidth={1.75} />
        <p className="text-[12px] font-medium text-status-warn-text">
          {incomplete.length} hari belum punya kegiatan atau alasan
        </p>
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-6">
        {incomplete.map((date) => (
          <li key={date} className="text-[11px] text-status-warn-text">
            {formatTanggalPendek(date)}
          </li>
        ))}
      </ul>
    </div>
  )
}
