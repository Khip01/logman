import { WeekProgress } from '@/components/shared/WeekProgress'
import {
  disabledReasonFor,
  editableWeekDates,
  formatWeekRange,
  type MagangRange,
} from '@/lib/domain/calendar'
import { dayNameId, formatTanggalTanpaHari } from '@/lib/domain/date'
import type { DayOfWeek, WeekEntry } from '@/lib/domain/types'
import { DEFAULT_LOCALE, useLocale, useT } from '@/lib/i18n'
import type { MessageKey } from '@/lib/i18n/messages/id'
import { useConfigStore } from '@/stores/config'
import { EditorRow } from './EditorRow'

/**
 * Tabel editor satu minggu (AGENTS.md bagian 11.1, 11.2, dan 11.3).
 *
 * Struktur: header abu dengan empat kolom, lalu enam baris Senin sampai Sabtu. Setiap
 * baris membaca datanya sendiri dari store, sehingga ketikan hanya me-render ulang baris
 * yang bersangkutan.
 */

const KOLOM: readonly MessageKey[] = [
  'editor.hariTanggal',
  'editor.jamMasuk',
  'editor.jamPulang',
  'editor.kegiatan',
]

interface WeekEditorTableProps {
  week: WeekEntry
  /** Bulan yang sedang dibuka, menentukan baris mana yang aktif. */
  monthKey: string
  range: MagangRange
}

export function WeekEditorTable({ week, monthKey, range }: WeekEditorTableProps) {
  const jamDefault = useConfigStore((s) => s.config.jamDefault)
  const bahasa = useLocale()
  const t = useT()

  // Isi tabel ikut bahasa antarmuka, kecuali saat dicetak: dokumen selalu Indonesia
  // (AGENTS.md bagian 21). Karena kelas print tidak bisa mengubah teks, teks dokumen
  // diambil dari locale tetap `id` saat mode dokumen aktif.
  const isiLocale = bahasa

  return (
    <div className="theme-t border border-doc-line bg-doc-surface print:border-0 print:bg-doc-paper">
      <div className="flex items-center justify-between gap-2 border-b border-doc-line px-3 py-2 no-print">
        <span className="text-[12px] font-semibold text-text-primary print:font-doc">
          M{week.weekOfMonth} - {formatWeekRange(week.startDate)}
        </span>
        {/*
          Penghitung hanya menerima hari yang dapat diisi pada bulan ini, bukan seluruh
          enam hari. Minggu di awal atau akhir bulan memuat hari milik bulan tetangga dan
          hari di luar rentang; hari-hari itu tidak boleh ikut dihitung (AGENTS.md bagian 6).
        */}
        <WeekProgress dates={editableWeekDates(week, monthKey, range)} />
      </div>

      <table className="doc-table">
        <caption className="sr-only">Kegiatan minggu {formatWeekRange(week.startDate)}</caption>
        <thead>
          <tr>
            {KOLOM.map((key) => (
              <th key={key} scope="col" className="px-2 py-1.5 text-[12px]">
                {t(key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {week.days.map((day) => (
            <EditorRow
              key={day.date}
              date={day.date}
              hariLabel={dayNameId(day.date, isiLocale)}
              tanggalLabel={formatTanggalTanpaHari(day.date, isiLocale)}
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
  return dayNameId(iso, DEFAULT_LOCALE).toLowerCase() as DayOfWeek
}
