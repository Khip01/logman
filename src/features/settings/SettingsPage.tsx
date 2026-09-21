import { Clock, FileText, Palette, Ruler, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { setThemeAnimated } from '@/lib/theme/themeTransition'
import { cn } from '@/lib/utils/cn'
import { MOTION_TIER_PROFILE } from '@/motion/tiers'
import { MOTION_TIERS, THEMES, useUiStore } from '@/stores/ui'
import { TierPreview } from './TierPreview'

export function SettingsPage() {
  const theme = useUiStore((s) => s.theme)
  const motion = useUiStore((s) => s.motion)
  const setMotion = useUiStore((s) => s.setMotion)

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-8 text-[17px] font-semibold text-text-primary">Pengaturan</h1>

      {/* Tema: grid kartu swatch miniatur, bukan radio (AGENTS.md bagian 10) */}
      <section className="mb-10">
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
      <section className="mb-10">
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
            onValueChange={setMotion}
          />
        </div>

        {/* Pratinjau mini window di bawah tier selector, di atas deskripsinya. */}
        <TierPreview tier={motion} />
      </section>

      <ComingSoonSection icon={Clock} title="Jam Default" />
      <ComingSoonSection icon={Ruler} title="Ukuran Kertas" />
      <ComingSoonSection icon={FileText} title="Profil dan Rentang Magang" />
    </div>
  )
}

/**
 * Seksi yang belum tersedia. Sengaja TIDAK memakai opacity pada teks, karena
 * menurunkan kontras di bawah ambang aksesibilitas. Status ditandai dengan Badge.
 */
function ComingSoonSection({ icon: Icon, title }: { icon: typeof Palette; title: string }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
        <Icon className="size-4" strokeWidth={1.75} />
        {title}
        <Badge>Belum tersedia</Badge>
      </h2>
      <p className="text-[12px] text-text-muted">Akan datang di fase berikutnya.</p>
    </section>
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
