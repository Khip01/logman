import { Palette, Sparkles, UserRound } from 'lucide-react'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { setThemeAnimated } from '@/lib/theme/themeTransition'
import { cn } from '@/lib/utils/cn'
import { MOTION_TIER_PROFILE } from '@/motion/tiers'
import { useConfigStore } from '@/stores/config'
import { MOTION_TIERS, THEMES, useUiStore } from '@/stores/ui'
import { AlasanSection } from './AlasanSection'
import { DokumenEksporSection } from './DokumenEksporSection'
import { JamDefaultSection } from './JamDefaultSection'
import { TierPreview } from './TierPreview'

export function SettingsPage() {
  const theme = useUiStore((s) => s.theme)
  const motion = useUiStore((s) => s.motion)
  const setMotion = useUiStore((s) => s.setMotion)

  const config = useConfigStore((s) => s.config)
  const update = useConfigStore((s) => s.update)

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-8 text-[17px] font-semibold text-text-primary">Pengaturan</h1>

      {/* Profil dan rentang magang. Wajib sebelum daftar Log Book muncul. */}
      <section className="mb-10" data-testid="section-profil">
        <SectionTitle icon={UserRound} title="Profil dan Rentang Magang" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="set-nama" label="Nama mahasiswa">
            <Input
              id="set-nama"
              value={config.profil.nama}
              placeholder="Nama lengkap"
              onChange={(event) =>
                update({ profil: { ...config.profil, nama: event.target.value } })
              }
            />
          </Field>
          <Field htmlFor="set-nim" label="NIM">
            <Input
              id="set-nim"
              value={config.profil.nim}
              placeholder="Nomor induk mahasiswa"
              onChange={(event) =>
                update({ profil: { ...config.profil, nim: event.target.value } })
              }
            />
          </Field>
          <Field htmlFor="set-prodi" label="Program Studi">
            <Input
              id="set-prodi"
              value={config.profil.programStudi}
              onChange={(event) =>
                update({ profil: { ...config.profil, programStudi: event.target.value } })
              }
            />
          </Field>
          <Field htmlFor="set-mitra" label="Nama Mitra Industri">
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
            label="Tanggal mulai magang"
            description="Daftar Log Book dibuat otomatis dari rentang ini."
          >
            <Input
              id="set-mulai"
              type="date"
              value={config.magang.mulai ?? ''}
              onChange={(event) =>
                update({ magang: { ...config.magang, mulai: event.target.value } })
              }
            />
          </Field>
          <Field htmlFor="set-selesai" label="Tanggal selesai magang">
            <Input
              id="set-selesai"
              type="date"
              value={config.magang.selesai ?? ''}
              onChange={(event) =>
                update({ magang: { ...config.magang, selesai: event.target.value } })
              }
            />
          </Field>
        </div>
      </section>

      {/* Tema: grid kartu swatch miniatur, bukan radio (AGENTS.md bagian 10) */}
      <section className="mb-10" data-testid="section-tema">
        <SectionTitle icon={Palette} title="Tema" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={(event) => setThemeAnimated(item.id, { x: event.clientX, y: event.clientY })}
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
                <span className="truncate text-[12px] text-text-main">{item.label}</span>
                {theme === item.id ? (
                  <span className="size-2 shrink-0 bg-accent" aria-hidden />
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Tier animasi: kontrol manual, default penuh (AGENTS.md bagian 8.1) */}
      <section className="mb-10" data-testid="section-tier">
        <SectionTitle icon={Sparkles} title="Tier Animasi" />
        <p className="mb-3 text-[12px] text-text-muted">
          Menentukan kadar gerakan sekunder. Tier tinggi lebih ekspresif dan lebih berat.
        </p>
        <div className="mb-4">
          <SegmentedControl
            aria-label="Tier animasi"
            options={MOTION_TIERS.map((tier) => ({
              value: tier,
              label: MOTION_TIER_PROFILE[tier].label,
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
      </section>

      <JamDefaultSection />
      <AlasanSection />
      <DokumenEksporSection />
    </div>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Palette; title: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
      <Icon className="size-4" strokeWidth={1.75} />
      {title}
    </h2>
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
