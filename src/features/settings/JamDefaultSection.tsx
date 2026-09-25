import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { defaultJamDefault } from '@/lib/domain/schema'
import type { DayOfWeek, JamDefault } from '@/lib/domain/types'
import { HARI, useLocale, useT } from '@/lib/i18n'
import { useConfigStore } from '@/stores/config'
import { JamInput } from './JamInput'
import { SettingsSection } from './SettingsSection'

/** Indeks hari pada tabel HARI locale, dipakai untuk label hari yang ikut bahasa aktif. */
const HARI_INDEX: Record<DayOfWeek, number> = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
}

/** Urutan tampilan Senin sampai Sabtu (AGENTS.md bagian 5.1). */
const HARI_ORDER: DayOfWeek[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']

/**
 * Jam default per hari (AGENTS.md bagian 5.1). Nilai ini dipakai bila jam pada form
 * editor dikosongkan. Nilai selalu disimpan 24 jam format titik, misal 08.00.
 *
 * Format tampilan 24 atau 12 jam diatur di sini dan hanya memengaruhi cara jam
 * dimasukkan dan ditampilkan di UI. Dokumen cetak dan PDF tetap 24 jam format titik.
 */
export function JamDefaultSection() {
  const t = useT()
  const locale = useLocale()
  const jamDefault = useConfigStore((s) => s.config.jamDefault)
  const formatJam = useConfigStore((s) => s.config.formatJam)
  const update = useConfigStore((s) => s.update)

  function setJam(hari: DayOfWeek, field: 'masuk' | 'pulang', value: string) {
    const next: JamDefault = {
      ...jamDefault,
      [hari]: { ...jamDefault[hari], [field]: value },
    }
    update({ jamDefault: next })
  }

  return (
    <SettingsSection id="jam-default" title={t('settings.jamDefault')}>
      <p className="mb-3 text-[12px] text-text-muted">{t('settings.jamDefaultDeskripsi')}</p>

      <div className="mb-4 max-w-xs">
        <SegmentedControl
          aria-label={t('settings.formatJam')}
          options={[
            { value: '24', label: t('settings.format24') },
            { value: '12', label: t('settings.format12') },
          ]}
          value={formatJam}
          onValueChange={(value) => update({ formatJam: value === '12' ? '12' : '24' })}
        />
      </div>

      <div className="border border-border-base">
        <div className="grid grid-cols-[6rem_1fr_1fr] gap-3 border-b border-border-base bg-bg-card px-3 py-2 text-[11px] uppercase tracking-wide text-text-dim">
          <span>{t('settings.hari')}</span>
          <span>{t('editor.jamMasuk')}</span>
          <span>{t('editor.jamPulang')}</span>
        </div>
        {HARI_ORDER.map((hari) => (
          <div
            key={hari}
            className="grid grid-cols-[6rem_1fr_1fr] items-start gap-3 border-b border-border-base px-3 py-2 last:border-b-0"
          >
            <span className="pt-2 text-[13px] text-text-main">
              {HARI[locale][HARI_INDEX[hari]]}
            </span>
            <JamInput
              label={t('editor.jamMasukLabel', {
                hari: HARI[locale][HARI_INDEX[hari]] ?? '',
                tanggal: '',
              })}
              value={jamDefault[hari].masuk}
              format={formatJam}
              onCommit={(value) => setJam(hari, 'masuk', value)}
            />
            <JamInput
              label={t('editor.jamPulangLabel', {
                hari: HARI[locale][HARI_INDEX[hari]] ?? '',
                tanggal: '',
              })}
              value={jamDefault[hari].pulang}
              format={formatJam}
              onCommit={(value) => setJam(hari, 'pulang', value)}
            />
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => update({ jamDefault: defaultJamDefault() })}
        >
          {t('settings.resetJamDefault')}
        </Button>
      </div>
    </SettingsSection>
  )
}
