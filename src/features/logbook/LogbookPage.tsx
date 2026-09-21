import { CalendarRange, FileText, Ruler, UserRound } from 'lucide-react'
import { navigate } from '@/app/router'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { formatWeekRange } from '@/lib/domain/calendar'
import { useConfigStore } from '@/stores/config'
import { useLogbookStore } from '@/stores/logbook'
import { useLogsStore } from '@/stores/logs'

export function LogbookPage() {
  const magang = useConfigStore((s) => s.config.magang)
  const profil = useConfigStore((s) => s.config.profil)
  const loadingLogs = useLogsStore((s) => s.loading)
  const errorLogs = useLogsStore((s) => s.error)
  const jumlahHari = useLogsStore((s) => Object.keys(s.data.days).length)
  const months = useLogbookStore((s) => s.months)

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

      <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-text-dim">
        Daftar minggu
      </h2>

      <div className="flex flex-col gap-6">
        {months.map((month) => (
          <section key={month.key}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-text-primary">{month.label}</h3>
              <Badge>{month.weeks.length} minggu</Badge>
            </div>
            <ul className="m-0 list-none border border-border-base p-0">
              {month.weeks.map((week) => (
                <li
                  key={week.id}
                  className="theme-t flex items-center justify-between border-b border-border-base px-3 py-2 last:border-b-0"
                >
                  <span className="text-[13px] text-text-main">
                    M{week.weekOfMonth} - {formatWeekRange(week.startDate)}
                  </span>
                  <Badge tone={week.days.some((d) => d.kegiatan) ? 'ok' : 'neutral'}>
                    {week.days.filter((d) => d.kegiatan).length}/6 terisi
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-8 text-[12px] text-text-dim">
        Editor langsung per sel akan tersedia pada fase berikutnya.
      </p>
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
