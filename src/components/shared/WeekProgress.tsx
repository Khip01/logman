import { memo, useMemo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { effectiveStatus } from '@/lib/domain/editor'
import type { DayEntry } from '@/lib/domain/types'
import { useLogsStore } from '@/stores/logs'

/**
 * Penghitung hari terisi untuk sekumpulan tanggal.
 *
 * Dipisah sebagai komponen sendiri yang berlangganan data hari, supaya perubahan satu
 * ketikan tidak memaksa tabel atau halaman ikut ter-render ulang (AGENTS.md bagian 13).
 */
export const WeekProgress = memo(function WeekProgress({ dates }: { dates: string[] }) {
  const days = useLogsStore((s) => s.data.days)

  const terisi = useMemo(
    () => dates.filter((date) => effectiveStatus(days[date] ?? kosong(date)) === 'terisi').length,
    [dates, days],
  )

  return (
    <Badge tone={terisi > 0 ? 'ok' : 'neutral'}>
      {terisi}/{dates.length} terisi
    </Badge>
  )
})

/** Hari kosong dipakai saat sebuah tanggal belum punya entri tersimpan. */
function kosong(date: string): DayEntry {
  return { date, masuk: null, pulang: null, kegiatan: '', alasan: null, status: 'kosong' }
}
