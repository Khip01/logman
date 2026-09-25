import { Switch } from '@/components/ui/Switch'
import { useT } from '@/lib/i18n'
import { useConfigStore } from '@/stores/config'
import { SettingsSection } from './SettingsSection'

/**
 * Toggle tampilan UI pengembangan (AGENTS.md bagian 11.4).
 *
 * Menu dan route `/dev/*` hanya muncul bila opsi ini menyala. Default mati, sehingga
 * aplikasi produksi tidak menampilkan halaman pengembangan sama sekali.
 */
export function TampilanDevSection() {
  const t = useT()
  const tampilkanDevUi = useConfigStore((s) => s.config.tampilkanDevUi)
  const update = useConfigStore((s) => s.update)

  return (
    <SettingsSection id="tampilan-dev" title={t('settings.tampilan')}>
      <label
        htmlFor="set-dev-ui"
        className="flex cursor-pointer items-start justify-between gap-4 border border-border-base bg-bg-card px-3 py-3"
      >
        <span className="flex flex-col gap-1">
          <span className="text-[13px] text-text-main">{t('settings.tampilkanDev')}</span>
          <span className="text-[11px] leading-relaxed text-text-dim">
            {t('settings.tampilkanDevDeskripsi')}
          </span>
        </span>
        <Switch
          id="set-dev-ui"
          checked={tampilkanDevUi}
          onCheckedChange={(checked) => update({ tampilkanDevUi: checked })}
        />
      </label>
    </SettingsSection>
  )
}
