import { ListChecks, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { addAlasan, removeAlasan } from '@/lib/domain/alasan'
import { DEFAULT_ALASAN } from '@/lib/domain/schema'
import { useT } from '@/lib/i18n'
import { useConfigStore } from '@/stores/config'
import { SettingsSection } from './SettingsSection'

/**
 * Pengelola daftar alasan hari kosong (AGENTS.md bagian 5.1 dan 11.3).
 * User boleh menambah, menghapus, dan mengembalikan ke daftar bawaan. Selain dropdown
 * ini, user tetap boleh mengetik alasan bebas langsung di editor.
 */
export function AlasanSection() {
  const t = useT()
  const alasan = useConfigStore((s) => s.config.alasan)
  const update = useConfigStore((s) => s.update)
  const [draft, setDraft] = useState('')

  function tambah() {
    const next = addAlasan(alasan, draft)
    // Referensi sama berarti tidak ada perubahan (kosong atau duplikat).
    if (next === alasan) return
    update({ alasan: next })
    setDraft('')
  }

  return (
    <SettingsSection id="alasan" title={t('alasan.judulPanjang')}>
      <p className="mb-3 text-[12px] text-text-muted">{t('alasan.deskripsiPanjang')}</p>

      {alasan.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          headingLevel={3}
          title={t('alasan.belumAda')}
          description={t('alasan.belumAdaDeskripsi')}
        />
      ) : (
        <ul className="mb-3 flex flex-wrap gap-2">
          {alasan.map((item) => (
            <li key={item}>
              <span className="flex items-center gap-1.5 border border-border-base bg-bg-card py-1 pl-2.5 pr-1.5 text-[12px] text-text-main">
                {item}
                <button
                  type="button"
                  aria-label={t('alasan.hapus', { nama: item })}
                  onClick={() => update({ alasan: removeAlasan(alasan, item) })}
                  className="theme-t grid size-5 place-items-center text-text-dim hover:text-status-error-text focus:outline-none focus-visible:border focus-visible:border-border-focus"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <Field htmlFor="set-alasan-baru" label={t('alasan.tambah')} className="max-w-64 flex-1">
          <Input
            id="set-alasan-baru"
            value={draft}
            placeholder={t('alasan.misal')}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                tambah()
              }
            }}
          />
        </Field>
        <Button variant="outline" onClick={tambah} disabled={draft.trim() === ''}>
          <Plus className="size-4" strokeWidth={2} />
          {t('common.tambah')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => update({ alasan: [...DEFAULT_ALASAN] })}
          disabled={alasan.length === DEFAULT_ALASAN.length}
        >
          {t('alasan.kembalikan')}
        </Button>
      </div>
    </SettingsSection>
  )
}
