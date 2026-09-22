import { Wrench } from 'lucide-react'
import { Switch } from '@/components/ui/Switch'
import { useConfigStore } from '@/stores/config'

/**
 * Toggle tampilan UI pengembangan (AGENTS.md bagian 11.4).
 *
 * Menu dan route `/dev/*` hanya muncul bila opsi ini menyala. Default mati, sehingga
 * aplikasi produksi tidak menampilkan halaman pengembangan sama sekali.
 */
export function TampilanDevSection() {
  const tampilkanDevUi = useConfigStore((s) => s.config.tampilkanDevUi)
  const update = useConfigStore((s) => s.update)

  return (
    <section className="mb-10" data-testid="section-tampilan-dev">
      <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
        <Wrench className="size-4" strokeWidth={1.75} />
        Tampilan
      </h2>

      <label
        htmlFor="set-dev-ui"
        className="flex cursor-pointer items-start justify-between gap-4 border border-border-base bg-bg-card px-3 py-3"
      >
        <span className="flex flex-col gap-1">
          <span className="text-[13px] text-text-main">Perlihatkan UI pengembangan</span>
          <span className="text-[11px] leading-relaxed text-text-dim">
            Menampilkan menu dan halaman dev seperti galeri komponen, katalog motion, performa, dan
            seed.
          </span>
        </span>
        <Switch
          id="set-dev-ui"
          checked={tampilkanDevUi}
          onCheckedChange={(checked) => update({ tampilkanDevUi: checked })}
        />
      </label>
    </section>
  )
}
