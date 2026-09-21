import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { defaultJamDefault } from '@/lib/domain/schema'
import type { DayOfWeek, JamDefault } from '@/lib/domain/types'
import { useConfigStore } from '@/stores/config'
import { JamInput } from './JamInput'

const HARI_LABEL: Record<DayOfWeek, string> = {
  senin: 'Senin',
  selasa: 'Selasa',
  rabu: 'Rabu',
  kamis: 'Kamis',
  jumat: 'Jumat',
  sabtu: 'Sabtu',
}

/** Urutan tampilan Senin sampai Sabtu (AGENTS.md bagian 5.1). */
const HARI_ORDER: DayOfWeek[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']

/**
 * Jam default per hari (AGENTS.md bagian 5.1). Nilai ini dipakai bila jam pada form
 * editor dikosongkan. Format selalu titik, misal 08.00.
 */
export function JamDefaultSection() {
  const jamDefault = useConfigStore((s) => s.config.jamDefault)
  const update = useConfigStore((s) => s.update)

  function setJam(hari: DayOfWeek, field: 'masuk' | 'pulang', value: string) {
    const next: JamDefault = {
      ...jamDefault,
      [hari]: { ...jamDefault[hari], [field]: value },
    }
    update({ jamDefault: next })
  }

  return (
    <section className="mb-10" data-testid="section-jam-default">
      <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
        <Clock className="size-4" strokeWidth={1.75} />
        Jam Default
      </h2>
      <p className="mb-3 text-[12px] text-text-muted">
        Dipakai saat jam pada form dikosongkan. Format titik, misal 08.00.
      </p>

      <div className="border border-border-base">
        <div className="grid grid-cols-[6rem_1fr_1fr] gap-3 border-b border-border-base bg-bg-card px-3 py-2 text-[11px] uppercase tracking-wide text-text-dim">
          <span>Hari</span>
          <span>Jam masuk</span>
          <span>Jam pulang</span>
        </div>
        {HARI_ORDER.map((hari) => (
          <div
            key={hari}
            className="grid grid-cols-[6rem_1fr_1fr] items-start gap-3 border-b border-border-base px-3 py-2 last:border-b-0"
          >
            <span className="pt-2 text-[13px] text-text-main">{HARI_LABEL[hari]}</span>
            <JamInput
              label={`Jam masuk ${HARI_LABEL[hari]}`}
              value={jamDefault[hari].masuk}
              onCommit={(value) => setJam(hari, 'masuk', value)}
            />
            <JamInput
              label={`Jam pulang ${HARI_LABEL[hari]}`}
              value={jamDefault[hari].pulang}
              onCommit={(value) => setJam(hari, 'pulang', value)}
            />
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => update({ jamDefault: defaultJamDefault() })}
        >
          Kembalikan ke 08.00 sampai 16.00
        </Button>
      </div>
    </section>
  )
}
