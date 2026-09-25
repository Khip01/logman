import { Sprout } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { buildSeedPatch } from '@/lib/domain/seed'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { useConfigStore } from '@/stores/config'
import { useLogbookStore } from '@/stores/logbook'
import { useLogsStore } from '@/stores/logs'

/**
 * Mode seed/demo (AGENTS.md bagian 15): tombol mengisi satu bulan dengan data
 * contoh untuk pengujian cepat.
 *
 * Hanya hari yang bisa diisi (dalam rentang magang) yang ditimpa, lewat batch
 * patch autosave sehingga seluruh bulan tersimpan dalam satu permintaan.
 */
export function DevSeedPage() {
  const t = useT()
  const months = useLogbookStore((s) => s.months)
  const magang = useConfigStore((s) => s.config.magang)
  const setDays = useLogsStore((s) => s.setDays)
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const activeKey = selected ?? months[0]?.key ?? null
  const activeMonth = months.find((month) => month.key === activeKey) ?? null

  function seed() {
    if (!activeMonth || !magang.mulai || !magang.selesai) return
    const patch = buildSeedPatch(activeMonth, { mulai: magang.mulai, selesai: magang.selesai })
    setDays(patch)
    setResult(t('dev.seed.berhasil', { n: Object.keys(patch).length, bulan: activeMonth.label }))
  }

  if (months.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-2 text-[17px] font-semibold text-text-primary">
          {t('dev.seed.judulPanjang')}
        </h1>
        <p className="text-[13px] text-text-muted">{t('dev.seed.tanpaRentang')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-2 text-[17px] font-semibold text-text-primary">
        {t('dev.seed.judulPanjang')}
      </h1>
      <p className="mb-6 text-[13px] text-text-muted">{t('dev.seed.deskripsiPanjang')}</p>

      <fieldset className="mb-4 border-0 p-0">
        <legend className="mb-2 p-0 text-[12px] text-text-dim">{t('dev.seed.pilihBulan')}</legend>
        <div className="flex flex-wrap gap-2">
          {months.map((month) => (
            <button
              key={month.key}
              type="button"
              data-testid={`seed-month-${month.key}`}
              aria-pressed={month.key === activeKey}
              onClick={() => {
                setSelected(month.key)
                setResult(null)
              }}
              className={cn(
                'theme-t border px-2.5 py-1.5 text-left text-[12px]',
                month.key === activeKey
                  ? 'border-border-light bg-bg-card text-text-primary'
                  : 'border-border-base text-text-muted hover:border-border-light hover:text-text-primary',
              )}
            >
              {month.label}
            </button>
          ))}
        </div>
      </fieldset>

      <Button variant="primary" data-testid="seed-submit" disabled={!activeMonth} onClick={seed}>
        <Sprout className="size-3.5" strokeWidth={1.75} />
        {t('dev.seed.isiContoh', { bulan: activeMonth?.label ?? '' })}
      </Button>

      {result ? (
        <p
          data-testid="seed-result"
          className="mt-4 border border-status-ok bg-status-ok-bg px-3 py-2 text-[12px] text-status-ok-text"
        >
          {result}
        </p>
      ) : null}
    </div>
  )
}
