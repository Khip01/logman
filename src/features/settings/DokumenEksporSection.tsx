import { Download, FolderOpen, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import {
  CONTENT_SCALE_LABEL_KEY,
  CONTENT_SCALES,
  type ContentScale,
  FONT_DOKUMEN_LABEL_KEY,
  FONT_DOKUMEN_LIST,
} from '@/lib/domain/dokumen'
import { UKURAN_KERTAS } from '@/lib/domain/schema'
import type { UkuranKertas } from '@/lib/domain/types'
import { useT } from '@/lib/i18n'
import { LOCALES, type Locale } from '@/lib/i18n/locale'
import type { MessageKey } from '@/lib/i18n/messages/id'
import { getRepositories } from '@/lib/repo'
import { useConfigStore } from '@/stores/config'
import { SettingsSection } from './SettingsSection'

const KERTAS_OPTIONS = UKURAN_KERTAS.map((value) => ({ value, label: value }))

/** Key pesan deskripsi tiap ukuran kertas (AGENTS.md bagian 21). */
const KERTAS_DESKRIPSI_KEY: Record<UkuranKertas, MessageKey> = {
  A4: 'settings.kertas.A4',
  F4: 'settings.kertas.F4',
  Letter: 'settings.kertas.Letter',
}

const FONT_OPTIONS = FONT_DOKUMEN_LIST.map((value) => ({
  value,
  labelKey: FONT_DOKUMEN_LABEL_KEY[value],
}))

const SKALA_OPTIONS = CONTENT_SCALES.map((value) => ({
  value: String(value),
  labelKey: CONTENT_SCALE_LABEL_KEY[value],
}))

/**
 * Ukuran kertas, font dokumen, skala konten, dan folder ekspor PDF
 * (AGENTS.md bagian 10, 11.2, dan 12).
 *
 * Nama file mengikuti pola `LogBook_<NIM>_<Bulan>-<Tahun>.pdf`.
 */
export function DokumenEksporSection() {
  const t = useT()
  const ukuranKertas = useConfigStore((s) => s.config.ukuranKertas)
  const fontDokumen = useConfigStore((s) => s.config.fontDokumen)
  const contentScale = useConfigStore((s) => s.config.contentScale)
  const bahasaDokumen = useConfigStore((s) => s.config.bahasaDokumen)
  const nim = useConfigStore((s) => s.config.profil.nim)
  const update = useConfigStore((s) => s.update)

  const contohNama = `LogBook_${nim || '<NIM>'}_Agustus-2026.pdf`

  return (
    <SettingsSection id="dokumen" title={t('settings.dokumenEkspor')}>
      <div className="grid gap-5">
        <Field
          label={t('settings.ukuranKertas')}
          description={t(KERTAS_DESKRIPSI_KEY[ukuranKertas])}
        >
          <SegmentedControl
            aria-label={t('settings.ukuranKertas')}
            options={KERTAS_OPTIONS}
            value={ukuranKertas}
            onValueChange={(value) => update({ ukuranKertas: value })}
            className="w-fit"
          />
        </Field>

        <Field label={t('settings.fontDokumen')} description={t('settings.fontDokumenDeskripsi')}>
          <SegmentedControl
            aria-label={t('settings.fontDokumen')}
            options={FONT_OPTIONS.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
            }))}
            value={fontDokumen}
            onValueChange={(value) => update({ fontDokumen: value })}
            className="w-fit"
          />
        </Field>

        <Field label={t('settings.skalaKonten')} description={t('settings.skalaKontenDeskripsi')}>
          <SegmentedControl
            aria-label={t('settings.skalaKonten')}
            options={SKALA_OPTIONS.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
            }))}
            value={String(contentScale)}
            onValueChange={(value) => update({ contentScale: Number(value) as ContentScale })}
            className="w-fit"
          />
        </Field>

        <Field
          label={t('settings.bahasaDokumen')}
          description={t('settings.bahasaDokumenDeskripsi')}
        >
          <SegmentedControl
            aria-label={t('settings.bahasaDokumen')}
            options={LOCALES.map((value) => ({
              value,
              label: t(`settings.bahasa.${value}` as MessageKey),
            }))}
            value={bahasaDokumen}
            onValueChange={(value) => update({ bahasaDokumen: value as Locale })}
            className="w-fit"
          />
        </Field>

        <FolderExportField />

        <div className="border border-border-base bg-bg-card px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-dim">
            <Download className="size-3.5" strokeWidth={1.75} />
            {t('settings.polaNamaFile')}
          </div>
          <p className="mt-1 truncate font-mono text-[12px] text-text-main">{contohNama}</p>
        </div>
      </div>
    </SettingsSection>
  )
}

/**
 * Field folder ekspor. Input sengaja hanya-baca supaya user tidak salah ketik path;
 * menekan input atau tombol folder membuka dialog folder native di server, dengan
 * direktori awal mengikuti isi field (atau folder default bila masih kosong).
 *
 * Bila dialog native tidak tersedia di mesin user, field berubah menjadi dapat diketik
 * sebagai jalan manual, disertai keterangan. Tombol reset muncul hanya bila user sudah
 * mengganti path dari default.
 */
function FolderExportField() {
  const t = useT()
  const folderExport = useConfigStore((s) => s.config.folderExport)
  const update = useConfigStore((s) => s.update)
  const [exportsDir, setExportsDir] = useState('')
  const [busy, setBusy] = useState(false)
  const [manual, setManual] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void getRepositories()
      .env.info()
      .then((info) => {
        if (active) setExportsDir(info.exportsDir)
      })
      .catch(() => {
        // Path default hanya untuk placeholder; kegagalan di sini tidak fatal.
      })
    return () => {
      active = false
    }
  }, [])

  async function browse() {
    if (busy) return
    setBusy(true)
    setNote(null)
    try {
      const result = await getRepositories().env.pickFolder(folderExport)
      if (result.path) {
        update({ folderExport: result.path })
        setManual(false)
      } else if (result.unsupported) {
        setManual(true)
        setNote(t('settings.dialogTidakAda'))
      }
    } catch {
      setNote(t('settings.dialogGagal'))
    } finally {
      setBusy(false)
    }
  }

  const placeholder = exportsDir
    ? t('settings.folderDefault', { path: exportsDir })
    : t('settings.folderDefaultKosong')

  return (
    <Field
      htmlFor="set-folder"
      label={t('settings.folderEkspor')}
      description={t('settings.folderEksporDeskripsi')}
    >
      <div className="flex items-center gap-2">
        <Input
          id="set-folder"
          data-testid="folder-export-input"
          value={folderExport}
          placeholder={placeholder}
          readOnly={!manual}
          aria-readonly={!manual}
          onClick={() => {
            if (!manual) void browse()
          }}
          className={manual ? undefined : 'cursor-pointer'}
          onChange={(event) => update({ folderExport: event.target.value })}
        />
        <button
          type="button"
          aria-label={t('settings.telusuriFolder')}
          title={t('settings.telusuriFolderJudul')}
          data-testid="folder-export-browse"
          disabled={busy}
          onClick={() => void browse()}
          className="theme-t grid size-9 shrink-0 place-items-center border border-border-base bg-bg-input text-text-muted hover:border-border-light hover:text-text-primary disabled:opacity-50"
        >
          <FolderOpen className="size-4" strokeWidth={1.75} />
        </button>
        {folderExport !== '' ? (
          <button
            type="button"
            aria-label={t('settings.resetFolder')}
            title={t('settings.resetFolderJudul')}
            data-testid="folder-export-reset"
            onClick={() => {
              update({ folderExport: '' })
              setNote(null)
            }}
            className="theme-t grid size-9 shrink-0 place-items-center border border-border-base bg-bg-input text-text-muted hover:border-border-light hover:text-text-primary"
          >
            <RotateCcw className="size-4" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>

      {note ? (
        <p role="status" className="mt-2 text-[11px] leading-relaxed text-status-warn-text">
          {note}
        </p>
      ) : null}
    </Field>
  )
}
