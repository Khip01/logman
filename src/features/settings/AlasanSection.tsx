import { Clock, ListChecks, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { addAlasan, removeAlasan, toggleStripJam } from '@/lib/domain/alasan'
import { DEFAULT_ALASAN } from '@/lib/domain/schema'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { useConfigStore } from '@/stores/config'
import { SettingsSection } from './SettingsSection'

/**
 * Pengelola daftar alasan hari kosong (AGENTS.md bagian 5.1 dan 11.8).
 *
 * User boleh menambah, menghapus, dan mengembalikan ke daftar bawaan. Selain dropdown
 * ini, user tetap boleh mengetik alasan bebas langsung di editor.
 *
 * Setiap alasan punya tanda `stripJam` yang menentukan apakah kolom jam pada hari
 * beralasan itu jadi strip (bukan angka). Tanda ini yang membuat alasan kustom seperti
 * "Sakit Gigi" juga bisa membuat jam jadi strip, sesuatu yang tidak mungkin saat
 * sebelumnya strip ditentukan dari nama alasan secara hardcode.
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
            <li key={item.label}>
              <span
                className={cn(
                  'flex items-center gap-1.5 border py-1 pl-2.5 pr-1.5 text-[12px]',
                  item.stripJam
                    ? 'border-border-light bg-bg-card text-text-primary'
                    : 'border-border-base bg-bg-card text-text-main',
                )}
              >
                {item.label}
                {/*
                 * Toggle strip jam. `aria-pressed` dipakai supaya state-nya terbaca
                 * screen reader, bukan hanya dari warna. Ikon jam memakai
                 * `aria-hidden` karena teksnya sudah ada di `aria-label`.
                 */}
                <button
                  type="button"
                  aria-pressed={item.stripJam}
                  aria-label={t('alasan.toggleStrip', { nama: item.label })}
                  title={t('alasan.toggleStripJudul')}
                  onClick={() => update({ alasan: toggleStripJam(alasan, item.label) })}
                  className={cn(
                    'theme-t grid size-5 place-items-center focus:outline-none',
                    'focus-visible:border focus-visible:border-border-focus',
                    item.stripJam ? 'text-text-primary' : 'text-text-dim hover:text-text-primary',
                  )}
                >
                  <Clock className="size-3.5" strokeWidth={2} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={t('alasan.hapus', { nama: item.label })}
                  onClick={() => update({ alasan: removeAlasan(alasan, item.label) })}
                  className="theme-t grid size-5 place-items-center text-text-dim hover:text-status-error-text focus:outline-none focus-visible:border focus-visible:border-border-focus"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mb-3 text-[12px] text-text-muted">{t('alasan.stripPetunjuk')}</p>

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
          onClick={() => update({ alasan: DEFAULT_ALASAN.map((item) => ({ ...item })) })}
          disabled={alasan.length === DEFAULT_ALASAN.length}
        >
          {t('alasan.kembalikan')}
        </Button>
      </div>
    </SettingsSection>
  )
}
