import { Download, FileText, FolderOpen, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import {
  CONTENT_SCALE_LABEL,
  CONTENT_SCALES,
  type ContentScale,
  FONT_DOKUMEN_LABEL,
  FONT_DOKUMEN_LIST,
} from '@/lib/domain/dokumen'
import { UKURAN_KERTAS } from '@/lib/domain/schema'
import type { UkuranKertas } from '@/lib/domain/types'
import { getRepositories } from '@/lib/repo'
import { useConfigStore } from '@/stores/config'

const KERTAS_OPTIONS = UKURAN_KERTAS.map((value) => ({ value, label: value }))

const KERTAS_DESKRIPSI: Record<UkuranKertas, string> = {
  A4: '210 x 297 mm. Default template.',
  F4: '215 x 330 mm. Folio, umum di Indonesia.',
  Letter: '216 x 279 mm. Standar Amerika.',
}

const FONT_OPTIONS = FONT_DOKUMEN_LIST.map((value) => ({
  value,
  label: FONT_DOKUMEN_LABEL[value],
}))

const SKALA_OPTIONS = CONTENT_SCALES.map((value) => ({
  value: String(value),
  label: CONTENT_SCALE_LABEL[value],
}))

/**
 * Ukuran kertas, font dokumen, skala konten, dan folder ekspor PDF
 * (AGENTS.md bagian 10, 11.2, dan 12).
 *
 * Nama file mengikuti pola `LogBook_<NIM>_<Bulan>-<Tahun>.pdf`.
 */
export function DokumenEksporSection() {
  const ukuranKertas = useConfigStore((s) => s.config.ukuranKertas)
  const fontDokumen = useConfigStore((s) => s.config.fontDokumen)
  const contentScale = useConfigStore((s) => s.config.contentScale)
  const nim = useConfigStore((s) => s.config.profil.nim)
  const update = useConfigStore((s) => s.update)

  const contohNama = `LogBook_${nim || '<NIM>'}_Agustus-2026.pdf`

  return (
    <section className="mb-10" data-testid="section-dokumen">
      <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
        <FileText className="size-4" strokeWidth={1.75} />
        Dokumen dan Ekspor
      </h2>

      <div className="grid gap-5">
        <Field label="Ukuran kertas" description={KERTAS_DESKRIPSI[ukuranKertas]}>
          <SegmentedControl
            aria-label="Ukuran kertas"
            options={KERTAS_OPTIONS}
            value={ukuranKertas}
            onValueChange={(value) => update({ ukuranKertas: value })}
            className="w-fit"
          />
        </Field>

        <Field
          label="Font dokumen"
          description="Font untuk tabel, kop, dan tanda tangan pada cetak dan PDF. Tampilan aplikasi tidak berubah."
        >
          <SegmentedControl
            aria-label="Font dokumen"
            options={FONT_OPTIONS}
            value={fontDokumen}
            onValueChange={(value) => update({ fontDokumen: value })}
            className="w-fit"
          />
        </Field>

        <Field
          label="Skala tampilan konten"
          description="Membesarkan isi Log Book di layar saja. Hasil cetak dan PDF tetap 12 pt sesuai template."
        >
          <SegmentedControl
            aria-label="Skala tampilan konten"
            options={SKALA_OPTIONS}
            value={String(contentScale)}
            onValueChange={(value) => update({ contentScale: Number(value) as ContentScale })}
            className="w-fit"
          />
        </Field>

        <FolderExportField />

        <div className="border border-border-base bg-bg-card px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-dim">
            <Download className="size-3.5" strokeWidth={1.75} />
            Pola nama file
          </div>
          <p className="mt-1 truncate font-mono text-[12px] text-text-main">{contohNama}</p>
        </div>
      </div>
    </section>
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
        setNote('Dialog folder tidak tersedia di mesin ini. Ketik path folder secara manual.')
      }
    } catch {
      setNote('Gagal membuka dialog folder. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  const placeholder = exportsDir ? `Default: ${exportsDir}` : 'Default: folder data logman'

  return (
    <Field
      htmlFor="set-folder"
      label="Folder ekspor"
      description="Path lokal tempat PDF hasil ekspor disimpan."
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
          aria-label="Telusuri folder"
          title="Pilih folder lewat dialog"
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
            aria-label="Reset ke folder default"
            title="Kembalikan ke folder default"
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
