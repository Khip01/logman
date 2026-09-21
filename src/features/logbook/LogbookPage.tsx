import { CalendarRange, ChevronLeft, ChevronRight, FileText, Ruler, UserRound } from 'lucide-react'
import { navigate } from '@/app/router'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { ValidationBanner } from '@/features/editor/ValidationBanner'
import { WeekEditorTable } from '@/features/editor/WeekEditorTable'
import { formatWeekRange, type MagangRange } from '@/lib/domain/calendar'
import type { MonthGroup } from '@/lib/domain/types'
import { cn } from '@/lib/utils/cn'
import { useConfigStore } from '@/stores/config'
import { useLogbookStore } from '@/stores/logbook'
import { useLogsStore } from '@/stores/logs'

/**
 * Halaman Log Book: navigasi bulan dan minggu plus editor langsung per sel
 * (AGENTS.md bagian 6, 11.2, dan 11.4).
 *
 * Baris hari yang bukan milik bulan yang sedang dibuka, atau di luar rentang magang,
 * tetap ditampilkan namun diredupkan dan tidak dapat diisi.
 */
export function LogbookPage() {
  const magang = useConfigStore((s) => s.config.magang)
  const profil = useConfigStore((s) => s.config.profil)
  const loadingLogs = useLogsStore((s) => s.loading)
  const errorLogs = useLogsStore((s) => s.error)
  const jumlahHari = useLogsStore((s) => Object.keys(s.data.days).length)

  const months = useLogbookStore((s) => s.months)
  const activeMonthKey = useLogbookStore((s) => s.activeMonthKey)
  const activeWeekId = useLogbookStore((s) => s.activeWeekId)
  const selectWeek = useLogbookStore((s) => s.selectWeek)
  const setActiveMonth = useLogbookStore((s) => s.setActiveMonth)

  const adaRentang = Boolean(magang.mulai && magang.selesai)

  if (!adaRentang) {
    return (
      <EmptyState
        icon={CalendarRange}
        headingLevel={1}
        title="Rentang magang belum diatur"
        description="Atur tanggal mulai dan selesai magang di Pengaturan. Daftar Log Book dibuat otomatis dari rentang tersebut."
        action={
          <Button variant="primary" onClick={() => navigate('/settings')}>
            Buka Pengaturan
          </Button>
        }
      />
    )
  }

  if (loadingLogs) {
    return (
      <div className="grid min-h-40 place-items-center">
        <Spinner />
      </div>
    )
  }

  const activeIndex = months.findIndex((month) => month.key === activeMonthKey)
  const activeMonth = activeIndex >= 0 ? months[activeIndex] : undefined
  const activeWeek =
    activeMonth?.weeks.find((week) => week.id === activeWeekId) ?? activeMonth?.weeks[0]

  const range: MagangRange = { mulai: magang.mulai, selesai: magang.selesai }

  function goToMonth(offset: number) {
    const next = months[activeIndex + offset]
    if (next) setActiveMonth(next.key)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <FileText className="size-5 text-text-muted" strokeWidth={1.75} />
        <h1 className="text-[17px] font-semibold text-text-primary">Log Book</h1>
      </div>

      {errorLogs ? (
        <div className="mb-6 border border-status-error bg-status-error-bg px-3 py-2 text-[12px] text-status-error-text">
          Gagal memuat data log: {errorLogs}
        </div>
      ) : null}

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <InfoRow icon={UserRound} label="Nama" value={profil.nama || 'Belum diisi'} />
        <InfoRow icon={FileText} label="NIM" value={profil.nim || 'Belum diisi'} />
        <InfoRow
          icon={CalendarRange}
          label="Rentang magang"
          value={`${magang.mulai} sampai ${magang.selesai}`}
        />
        <InfoRow icon={Ruler} label="Hari terisi" value={`${jumlahHari} hari`} />
      </div>

      {!activeMonth ? (
        <EmptyState
          icon={CalendarRange}
          headingLevel={2}
          title="Belum ada minggu"
          description="Rentang magang terlalu pendek atau tidak valid, sehingga belum ada minggu yang bisa ditampilkan."
        />
      ) : (
        <>
          <MonthNavigator
            month={activeMonth}
            canPrev={activeIndex > 0}
            canNext={activeIndex < months.length - 1}
            onPrev={() => goToMonth(-1)}
            onNext={() => goToMonth(1)}
            onSelectWeek={(weekId) => selectWeek(weekId, activeMonth.key)}
            activeWeekId={activeWeek?.id ?? null}
          />

          <ValidationBanner month={activeMonth} range={range} />

          {activeWeek ? (
            <WeekEditorTable week={activeWeek} monthKey={activeMonth.key} range={range} />
          ) : null}
        </>
      )}
    </div>
  )
}

interface MonthNavigatorProps {
  month: MonthGroup
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  onSelectWeek: (weekId: string) => void
  activeWeekId: string | null
}

/** Navigasi bulan dengan tombol maju dan mundur, plus pemilih minggu M1, M2, ... */
function MonthNavigator({
  month,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onSelectWeek,
  activeWeekId,
}: MonthNavigatorProps) {
  return (
    <div className="mb-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Bulan sebelumnya"
          disabled={!canPrev}
          onClick={onPrev}
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
        </Button>
        <h2 className="text-[15px] font-semibold text-text-primary">{month.label}</h2>
        <Button
          variant="outline"
          size="icon"
          aria-label="Bulan berikutnya"
          disabled={!canNext}
          onClick={onNext}
        >
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={`Minggu ${month.label}`}>
        {month.weeks.map((week) => {
          const isActive = week.id === activeWeekId
          return (
            <button
              key={week.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectWeek(week.id)}
              className={cn(
                'theme-t border px-2.5 py-1.5 text-left text-[12px]',
                isActive
                  ? 'border-border-light bg-bg-card text-text-primary'
                  : 'border-border-base text-text-muted hover:border-border-light hover:text-text-primary',
              )}
            >
              <span className="font-semibold">M{week.weekOfMonth}</span>
              <span className="ml-2 text-[11px]">{formatWeekRange(week.startDate)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText
  label: string
  value: string
}) {
  return (
    <div className="theme-t border border-border-base bg-bg-card px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-dim">
        <Icon className="size-3.5" strokeWidth={1.75} />
        {label}
      </div>
      <p className="mt-1 truncate text-[13px] text-text-main">{value}</p>
    </div>
  )
}
