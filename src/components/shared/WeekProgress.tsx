import { memo, useMemo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { isDayFilled } from '@/lib/domain/editor'
import { useT } from '@/lib/i18n'
import { useLogsStore } from '@/stores/logs'

/**
 * Penghitung hari berisi untuk sekumpulan tanggal.
 *
 * Dipisah sebagai komponen sendiri yang berlangganan data hari, supaya perubahan satu
 * ketikan tidak memaksa tabel atau halaman ikut ter-render ulang (AGENTS.md bagian 13).
 *
 * "Berisi" dihitung lewat `isDayFilled`, sehingga hari yang diisi ALASAN (libur, sakit,
 * izin) ikut terhitung. Sebelumnya komponen ini membandingkan langsung dengan status
 * 'terisi', sehingga hari ber-alasan tidak pernah dihitung dan badge tetap 0.
 */
export const WeekProgress = memo(function WeekProgress({ dates }: { dates: string[] }) {
  const t = useT()
  const days = useLogsStore((s) => s.data.days)

  const terisi = useMemo(
    () => dates.filter((date) => isDayFilled(days[date])).length,
    [dates, days],
  )

  return (
    <Badge data-testid="week-progress" tone={terisi > 0 ? 'ok' : 'neutral'}>
      {t('editor.terisi', { n: terisi, total: dates.length })}
    </Badge>
  )
})
