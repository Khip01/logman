import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { sanitizeHariKerja } from '@/lib/domain/calendar'
import { defaultJamDefault } from '@/lib/domain/schema'
import type { DayOfWeek, JamDefault } from '@/lib/domain/types'
import { HARI, useLocale, useT } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
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
 *
 * Seksi ini sekaligus tempat mengatur HARI KERJA, yaitu hari mana yang punya baris di
 * tabel dokumen (bagian 11.7). Keduanya ada di sini karena satu hal: baris yang
 * dimatikan tidak punya jam, jadi tidak ada gunanya menampilkan input jamnya.
 */
export function JamDefaultSection() {
  const t = useT()
  const locale = useLocale()
  const jamDefault = useConfigStore((s) => s.config.jamDefault)
  const hariKerja = useConfigStore((s) => s.config.hariKerja)
  const formatJam = useConfigStore((s) => s.config.formatJam)
  const update = useConfigStore((s) => s.update)

  function setJam(hari: DayOfWeek, field: 'masuk' | 'pulang', value: string) {
    const next: JamDefault = {
      ...jamDefault,
      [hari]: { ...jamDefault[hari], [field]: value },
    }
    update({ jamDefault: next })
  }

  /*
   * Menyalakan atau mematikan sebuah hari kerja.
   *
   * Daftar kosong DILARANG karena tabel tanpa baris tidak bisa diisi. Jadi menyalakan
   * hari terakhir yang menyala tidak diizinkan, dan tombolnya dimatikan. Ini
   * mencerminkan `sanitizeHariKerja` di domain, bukan aturan tambahan di UI.
   */
  function toggleHari(hari: DayOfWeek) {
    const aktif = hariKerja.includes(hari)
    if (aktif && hariKerja.length <= 1) return
    const next = aktif ? hariKerja.filter((item) => item !== hari) : [...hariKerja, hari]
    // `sanitizeHariKerja` juga mengurutkan ulang, jadi dipanggil di sini agar yang
    // tersimpan sudah rapi dan tidak bergantung penuh pada lapisan parse.
    update({ hariKerja: sanitizeHariKerja(next) })
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

      <div className="mb-4">
        {/*
         * `fieldset` dipakai, bukan `div` dengan `role="group"`. Fieldset adalah
         * elemen semantik yang tepat untuk sekelompok tombol yang saling berkaitan,
         * dan otomatis memberi naam kelompok lewat `legend` untuk screen reader.
         * Border dan padding bawaan browser dimatikan karena preflight sudah
         * menyetel ulang, tapi margin bawaan pada `legend` tetap dinolkan sendiri.
         */}
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 p-0 text-[12px] text-text-muted">
            {t('settings.hariKerja')}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {HARI_ORDER.map((hari) => {
              const aktif = hariKerja.includes(hari)
              const namaHari = HARI[locale][HARI_INDEX[hari]] ?? hari
              // Hari terakhir yang menyala tidak boleh dimatikan, karena tabel akan
              // kehilangan semua baris. `aria-disabled` dipakai bersama `disabled`
              // supaya tetap terbaca screen reader kenapa tombolnya mati.
              const terkunci = aktif && hariKerja.length <= 1
              return (
                <button
                  key={hari}
                  type="button"
                  aria-pressed={aktif}
                  aria-disabled={terkunci}
                  disabled={terkunci}
                  onClick={() => toggleHari(hari)}
                  title={terkunci ? t('settings.hariKerjaMinimal') : undefined}
                  className={cn(
                    'theme-t border px-2.5 py-1 text-[12px]',
                    'focus:outline-none focus-visible:border focus-visible:border-border-focus',
                    aktif
                      ? 'border-border-light bg-bg-card text-text-primary'
                      : 'border-border-base text-text-dim hover:border-border-light hover:text-text-primary',
                    terkunci && 'cursor-not-allowed opacity-60',
                  )}
                >
                  {namaHari}
                </button>
              )
            })}
          </div>
        </fieldset>
        <p className="mt-2 text-[12px] text-text-muted">{t('settings.hariKerjaDeskripsi')}</p>
      </div>

      <div className="border border-border-base">
        <div className="grid grid-cols-[6rem_1fr_1fr] gap-3 border-b border-border-base bg-bg-card px-3 py-2 text-[11px] uppercase tracking-wide text-text-dim">
          <span>{t('settings.hari')}</span>
          <span>{t('editor.jamMasuk')}</span>
          <span>{t('editor.jamPulang')}</span>
        </div>
        {HARI_ORDER.filter((hari) => hariKerja.includes(hari)).map((hari) => (
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
