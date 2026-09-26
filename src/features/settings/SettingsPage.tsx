import { m } from 'motion/react'
import { DateInput } from '@/components/ui/DateInput'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { LOCALES, useT } from '@/lib/i18n'
import type { MessageKey } from '@/lib/i18n/messages/id'
import { setThemeAnimated } from '@/lib/theme/themeTransition'
import { cn } from '@/lib/utils/cn'
import { pageVariants } from '@/motion/presets'
import { MOTION_TIER_PROFILE } from '@/motion/tiers'
import { useConfigStore } from '@/stores/config'
import { MOTION_TIERS, THEMES, useUiStore } from '@/stores/ui'
import { AlasanSection } from './AlasanSection'
import { DokumenEksporSection } from './DokumenEksporSection'
import { HariLuarBulanSection } from './HariLuarBulanSection'
import { JamDefaultSection } from './JamDefaultSection'
import { PenandaTanganSection } from './PenandaTanganSection'
import { SettingsFlashProvider } from './SettingsFlash'
import { SettingsSearch } from './SettingsSearch'
import { SettingsSection } from './SettingsSection'
import { TampilanDevSection } from './TampilanDevSection'
import { TierPreview } from './TierPreview'

/**
 * Pemilih bahasa antarmuka (AGENTS.md bagian 21).
 *
 * Dokumen cetak dan PDF selalu bahasa Indonesia, karena mengikuti template kampus;
 * pilihan di sini hanya mengubah antarmuka aplikasi.
 */
function BahasaSection() {
  const t = useT()
  const bahasa = useConfigStore((s) => s.config.bahasa)
  const update = useConfigStore((s) => s.update)

  return (
    <SettingsSection id="bahasa" title={t('settings.bahasa')}>
      <Field label={t('settings.bahasa')} description={t('settings.bahasaDeskripsi')}>
        <SegmentedControl
          aria-label={t('settings.bahasa')}
          options={LOCALES.map((value) => ({
            value,
            label: t(`settings.bahasa.${value}` as MessageKey),
          }))}
          value={bahasa}
          onValueChange={(value) => update({ bahasa: value })}
          className="w-fit"
        />
      </Field>
    </SettingsSection>
  )
}

export function SettingsPage() {
  const t = useT()
  const theme = useUiStore((s) => s.theme)
  const motion = useUiStore((s) => s.motion)
  const setMotion = useUiStore((s) => s.setMotion)

  const config = useConfigStore((s) => s.config)
  const update = useConfigStore((s) => s.update)

  return (
    <SettingsFlashProvider>
      <m.div
        initial="hidden"
        animate="visible"
        variants={pageVariants}
        className="mx-auto max-w-3xl px-6 py-10"
      >
        <h1 className="mb-6 text-[17px] font-semibold text-text-primary">{t('settings.judul')}</h1>

        {/*
          Bar pencarian dibuat sticky supaya tetap terjangkau saat user menggulir jauh ke
          bawah, dan tidak lagi terjebak di dalam animasi masuk halaman: `transform` pada
          induk yang beranimasi akan mengurung `position: sticky` di dalamnya.
          `scroll-mt-20` pada tiap seksi memberi ruang setinggi bar ini.
        */}
        {/*
          `pointer-events-none` pada bar dan `pointer-events-auto` pada kotak pencarian
          penting: bar ini sticky, sehingga konten yang digulir naik akan lewat DI
          BELAKANGNYA. Tanpa itu, bagian konten yang kebetulan berada di area bar tidak
          bisa diklik karena kliknya tertelan bar. Yang boleh menerima klik hanya kotak
          pencariannya sendiri.
        */}
        <div className="theme-t pointer-events-none sticky top-0 z-20 -mx-6 mb-6 border-b border-border-base bg-bg-body px-6 py-3">
          <div className="pointer-events-auto">
            <SettingsSearch />
          </div>
        </div>

        {/* Profil dan rentang magang. Wajib sebelum daftar Log Book muncul. */}
        <SettingsSection id="profil" title={t('settings.profil')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="set-nama" label={t('settings.namaMahasiswa')}>
              <Input
                id="set-nama"
                value={config.profil.nama}
                placeholder={t('settings.namaLengkap')}
                onChange={(event) =>
                  update({ profil: { ...config.profil, nama: event.target.value } })
                }
              />
            </Field>
            <Field htmlFor="set-nim" label={t('settings.nim')}>
              <Input
                id="set-nim"
                value={config.profil.nim}
                placeholder={t('settings.nimPanjang')}
                onChange={(event) =>
                  update({ profil: { ...config.profil, nim: event.target.value } })
                }
              />
            </Field>
            <Field htmlFor="set-prodi" label={t('settings.programStudi')}>
              <Input
                id="set-prodi"
                value={config.profil.programStudi}
                onChange={(event) =>
                  update({ profil: { ...config.profil, programStudi: event.target.value } })
                }
              />
            </Field>
            <Field htmlFor="set-mitra" label={t('settings.mitraIndustri')}>
              <Input
                id="set-mitra"
                value={config.profil.mitraIndustri}
                onChange={(event) =>
                  update({ profil: { ...config.profil, mitraIndustri: event.target.value } })
                }
              />
            </Field>
            <Field
              htmlFor="set-mulai"
              label={t('settings.tanggalMulai')}
              description={t('settings.tanggalMulaiDeskripsi')}
            >
              <DateInput
                id="set-mulai"
                value={config.magang.mulai ?? ''}
                onChange={(event) =>
                  update({ magang: { ...config.magang, mulai: event.target.value } })
                }
              />
            </Field>
            <Field htmlFor="set-selesai" label={t('settings.tanggalSelesai')}>
              <DateInput
                id="set-selesai"
                value={config.magang.selesai ?? ''}
                onChange={(event) =>
                  update({ magang: { ...config.magang, selesai: event.target.value } })
                }
              />
            </Field>
          </div>
        </SettingsSection>

        {/* Tema: grid kartu swatch miniatur, bukan radio (AGENTS.md bagian 10) */}
        <SettingsSection id="tema" title={t('settings.tema')}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={(event) =>
                  setThemeAnimated(item.id, { x: event.clientX, y: event.clientY })
                }
                aria-pressed={theme === item.id}
                className={cn(
                  'theme-t overflow-hidden border text-left',
                  theme === item.id
                    ? 'border-border-light bg-bg-card'
                    : 'border-border-base hover:border-border-light',
                )}
              >
                {/* data-theme hanya di area miniatur, agar label tetap ikut tema aplikasi */}
                <div data-theme={item.id}>
                  <ThemeSwatch />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border-base px-3 py-2">
                  <span className="truncate text-[12px] text-text-main">{t(item.labelKey)}</span>
                  {theme === item.id ? (
                    <span className="size-2 shrink-0 bg-accent" aria-hidden />
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </SettingsSection>

        {/* Tier animasi: kontrol manual, default penuh (AGENTS.md bagian 8.1) */}
        <SettingsSection id="tier" title={t('settings.tierAnimasi')}>
          <p className="mb-3 text-[12px] text-text-muted">{t('settings.tierAnimasiDeskripsi')}</p>
          <div className="mb-4">
            <SegmentedControl
              aria-label={t('settings.tierAnimasi')}
              options={MOTION_TIERS.map((tier) => ({
                value: tier,
                label: t(MOTION_TIER_PROFILE[tier].labelKey),
              }))}
              value={motion}
              onValueChange={(value) => {
                setMotion(value)
                update({ tierAnimasi: value })
              }}
            />
          </div>

          {/* Pratinjau mini window di bawah tier selector, di atas deskripsinya. */}
          <TierPreview tier={motion} />
        </SettingsSection>

        <BahasaSection />
        <JamDefaultSection />
        <AlasanSection />
        <PenandaTanganSection />
        <HariLuarBulanSection />
        <DokumenEksporSection />
        <TampilanDevSection />
      </m.div>
    </SettingsFlashProvider>
  )
}

/** Miniatur shell aplikasi dalam tema kartu, agar user melihat hasil nyata. */
function ThemeSwatch() {
  return (
    <div className="theme-t flex h-20 w-full bg-bg-body">
      <div className="theme-t flex w-6 flex-col gap-1 border-r border-border-base bg-bg-sidebar p-1">
        <span className="size-1.5 bg-accent" />
        <span className="h-1 w-full bg-border-light" />
        <span className="h-1 w-2/3 bg-border-base" />
      </div>
      <div className="theme-t flex flex-1 flex-col gap-1 p-1.5">
        <span className="theme-t h-1.5 w-1/2 bg-text-dim" />
        <div className="theme-t mt-0.5 flex-1 border border-border-base bg-bg-card p-1">
          <span className="theme-t block h-1 w-3/4 bg-border-light" />
        </div>
      </div>
    </div>
  )
}
