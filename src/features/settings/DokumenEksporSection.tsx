import { Download, FileText } from 'lucide-react'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { UKURAN_KERTAS } from '@/lib/domain/schema'
import type { UkuranKertas } from '@/lib/domain/types'
import { useConfigStore } from '@/stores/config'

const KERTAS_OPTIONS = UKURAN_KERTAS.map((value) => ({ value, label: value }))

const KERTAS_DESKRIPSI: Record<UkuranKertas, string> = {
  A4: '210 x 297 mm. Default template.',
  F4: '215 x 330 mm. Folio, umum di Indonesia.',
  Letter: '216 x 279 mm. Standar Amerika.',
}

/**
 * Ukuran kertas dan folder ekspor PDF (AGENTS.md bagian 12).
 * Nama file mengikuti pola `LogBook_<NIM>_<Bulan>-<Tahun>.pdf`.
 */
export function DokumenEksporSection() {
  const ukuranKertas = useConfigStore((s) => s.config.ukuranKertas)
  const folderExport = useConfigStore((s) => s.config.folderExport)
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
          htmlFor="set-folder"
          label="Folder ekspor"
          description="Path lokal tempat PDF hasil ekspor disimpan."
        >
          <Input
            id="set-folder"
            value={folderExport}
            placeholder="Misal /home/user/Dokumen/LogBook"
            onChange={(event) => update({ folderExport: event.target.value })}
          />
        </Field>

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
