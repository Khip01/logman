import { PenLine, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { hapusPembimbing, setDefaultPembimbing, tambahPembimbing } from '@/lib/domain/pembimbing'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { useConfigStore } from '@/stores/config'
import { SettingsSection } from './SettingsSection'

/**
 * Pengaturan nama penanda tangan (AGENTS.md bagian 11.5).
 *
 * Mahasiswa memakai nama di profil, sehingga tidak ada field di sini. Dosen Pembimbing
 * satu nama tetap. Pembimbing Lapangan bisa banyak: tambah lewat tombol plus, hapus lewat
 * tombol silang, dan tandai satu sebagai default yang dipakai bila minggu belum diatur.
 */
export function PenandaTanganSection() {
  const t = useT()
  const config = useConfigStore((s) => s.config)
  const update = useConfigStore((s) => s.update)
  const [draft, setDraft] = useState('')

  const daftar = config.pembimbingLapangan
  const defaultNama = config.pembimbingLapanganDefault

  function tambah() {
    const next = tambahPembimbing(daftar, draft)
    if (next === daftar) return
    update({
      pembimbingLapangan: next,
      // Bila belum ada default, nama pertama otomatis menjadi default.
      pembimbingLapanganDefault: defaultNama ?? next[0] ?? null,
    })
    setDraft('')
  }

  function hapus(nama: string) {
    const next = hapusPembimbing(daftar, nama)
    const nextDefault =
      config.pembimbingLapanganDefault === nama
        ? (next[0] ?? null)
        : setDefaultPembimbing(next, config.pembimbingLapanganDefault)
    update({ pembimbingLapangan: next, pembimbingLapanganDefault: nextDefault })
  }

  return (
    <SettingsSection id="penanda-tangan" title={t('settings.penandaTangan')}>
      <p className="mb-4 text-[12px] text-text-muted">{t('settings.penandaTanganDeskripsi')}</p>

      <div className="mb-5">
        <Field
          htmlFor="set-dosen"
          label={t('settings.dosenPembimbing')}
          description={t('settings.dosenPembimbingDeskripsi')}
        >
          <Input
            id="set-dosen"
            value={config.dosenPembimbing}
            placeholder={t('settings.misalDosen')}
            onChange={(event) => update({ dosenPembimbing: event.target.value })}
          />
        </Field>
      </div>

      <p className="mb-2 text-[12px] font-medium text-text-main">
        {t('settings.pembimbingLapangan')}
      </p>

      {daftar.length === 0 ? (
        <EmptyState
          icon={PenLine}
          headingLevel={3}
          title={t('settings.belumAdaPembimbing')}
          description={t('settings.belumAdaPembimbingDeskripsi')}
        />
      ) : (
        <ul className="mb-3 flex flex-wrap gap-2">
          {daftar.map((nama) => {
            const isDefault = nama === defaultNama
            return (
              <li key={nama}>
                <span
                  className={cn(
                    'flex items-center gap-1.5 border py-1 pl-2.5 pr-1.5 text-[12px]',
                    isDefault
                      ? 'border-border-light bg-bg-card text-text-primary'
                      : 'border-border-base text-text-main',
                  )}
                >
                  <button
                    type="button"
                    aria-pressed={isDefault}
                    title={isDefault ? t('settings.defaultSaatIni') : t('settings.jadikanDefault')}
                    onClick={() => update({ pembimbingLapanganDefault: nama })}
                    className="theme-t text-left hover:text-text-primary"
                  >
                    {nama}
                    {isDefault ? (
                      <span className="ml-1.5 text-[10px] uppercase tracking-wide text-text-dim">
                        {t('settings.default')}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    aria-label={t('settings.hapusPembimbing', { nama })}
                    onClick={() => hapus(nama)}
                    className="theme-t grid size-5 place-items-center text-text-dim hover:text-status-error-text"
                  >
                    <X className="size-3.5" strokeWidth={2} />
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <Field
          htmlFor="set-pembimbing-baru"
          label={t('settings.tambahPembimbing')}
          className="max-w-64 flex-1"
        >
          <Input
            id="set-pembimbing-baru"
            value={draft}
            placeholder={t('settings.misalNama')}
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
      </div>
    </SettingsSection>
  )
}
