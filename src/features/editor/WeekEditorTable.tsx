import { WeekProgress } from '@/components/shared/WeekProgress'
import { disabledReasonFor, formatWeekRange, type MagangRange } from '@/lib/domain/calendar'
import { dayNameId, formatTanggalTanpaHari } from '@/lib/domain/date'
import type { DayOfWeek, WeekEntry } from '@/lib/domain/types'
import { useConfigStore } from '@/stores/config'
import { EditorRow } from './EditorRow'

/**
 * Tabel editor satu minggu (AGENTS.md bagian 11.1, 11.2, dan 11.3).
 *
 * Struktur: header abu dengan empat kolom, lalu enam baris Senin sampai Sabtu. Setiap
 * baris membaca datanya sendiri dari store, sehingga ketikan hanya me-render ulang baris
 * yang bersangkutan.
 */

const KOLOM = ['Hari, Tanggal', 'Jam Masuk', 'Jam Pulang', 'Kegiatan'] as const

interface WeekEditorTableProps {
  week: WeekEntry
  /** Bulan yang sedang dibuka, menentukan baris mana yang aktif. */
  monthKey: string
  range: MagangRange
}

export function WeekEditorTable({ week, monthKey, range }: WeekEditorTableProps) {
  const jamDefault = useConfigStore((s) => s.config.jamDefault)

  return (
    <div className="border border-doc-border bg-doc-paper">
      <div className="flex items-center justify-between gap-2 border-b border-doc-border px-3 py-2">
        <span className="font-doc text-[12px] font-semibold text-doc-ink">
          M{week.weekOfMonth} - {formatWeekRange(week.startDate)}
        </span>
        <WeekProgress dates={week.days.map((d) => d.date)} />
      </div>

      <table className="doc-table">
        <caption className="sr-only">Kegiatan minggu {formatWeekRange(week.startDate)}</caption>
        <thead>
          <tr>
            {KOLOM.map((label) => (
              <th key={label} scope="col" className="px-2 py-1.5 text-[12px]">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {week.days.map((day) => (
            <EditorRow
              key={day.date}
              date={day.date}
              hariLabel={dayNameId(day.date)}
              tanggalLabel={formatTanggalTanpaHari(day.date)}
              disabled={disabledReasonFor(day.date, monthKey, range) !== null}
              jamDefault={jamDefault[dayNameKey(day.date)]}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Memetakan tanggal ke kunci jam default, misal "senin". */
function dayNameKey(iso: string): DayOfWeek {
  return dayNameId(iso).toLowerCase() as DayOfWeek
}
