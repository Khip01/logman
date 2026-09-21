import { RotateCcw } from 'lucide-react'
import { m } from 'motion/react'
import { useMemo, useState } from 'react'
import { useDocumentVisible } from '@/lib/utils/useDocumentVisible'
import { buildTierPreviewVariants, pulseVariants } from '@/motion/presets'
import { MOTION_TIER_PROFILE } from '@/motion/tiers'
import type { MotionTier } from '@/stores/ui'

/** Id baris pratinjau, stabil agar tidak memakai index sebagai key. */
const ROW_IDS = ['baris-1', 'baris-2', 'baris-3', 'baris-4', 'baris-5']

interface TierPreviewProps {
  tier: MotionTier
}

/**
 * Pratinjau mini window per tier animasi (AGENTS.md bagian 8.1).
 * Menampilkan gambaran kadar animasi tier yang dipilih: gerakan panel, stagger baris,
 * dan denyut idle. Animasi diputar ulang saat tier berubah (lewat key gabungan) atau
 * saat tombol putar ulang ditekan.
 *
 * Setiap elemen diberi `initial`, `animate`, dan `variants` secara eksplisit. Ini
 * penting agar animasi tetap berjalan walau elemen baru saja dipasang ulang karena
 * perubahan `key`.
 */
export function TierPreview({ tier }: TierPreviewProps) {
  const profile = MOTION_TIER_PROFILE[tier]
  const variants = useMemo(() => buildTierPreviewVariants(profile), [profile])
  const [replayCount, setReplayCount] = useState(0)
  const visible = useDocumentVisible()

  // Key gabungan: berubah saat tier berganti maupun saat tombol putar ulang ditekan,
  // sehingga animasi masuk diputar ulang.
  const animationKey = `${tier}-${replayCount}`
  const pulseActive = profile.pulse && visible

  return (
    <div className="border border-border-base bg-bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border-base px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-text-dim">
            Pratinjau
          </span>
          <span className="border border-border-base px-1.5 py-0.5 text-[10px] text-text-muted">
            {profile.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setReplayCount((count) => count + 1)}
          className="theme-t flex items-center gap-1.5 border border-border-base px-2 py-1 text-[11px] text-text-muted hover:border-border-light hover:text-text-primary"
        >
          <RotateCcw className="size-3.5" strokeWidth={1.75} />
          Putar ulang
        </button>
      </div>

      <div className="p-4">
        <div className="mx-auto w-full max-w-md border border-border-base bg-bg-body">
          {/* Title bar mini window */}
          <div className="flex items-center gap-2 border-b border-border-base bg-bg-sidebar px-2.5 py-1.5">
            <span className="grid size-4 place-items-center bg-accent text-[9px] font-black text-accent-text">
              L
            </span>
            <span className="text-[10px] font-semibold text-text-muted">logman</span>
            <m.span
              variants={pulseVariants}
              initial="rest"
              animate={pulseActive ? 'pulse' : 'rest'}
              className="ml-auto size-1.5 bg-status-ok"
              aria-hidden
            />
          </div>

          <div className="flex" key={animationKey} data-testid="tier-preview-window">
            {/* Panel sidebar */}
            <m.div
              data-testid="tier-preview-panel"
              variants={variants.panel}
              initial="hidden"
              animate="visible"
              className="w-16 shrink-0 border-r border-border-base bg-bg-sidebar p-2"
            >
              <div className="mb-1.5 h-1.5 w-3/4 bg-accent" />
              <div className="mb-1.5 h-1 w-full bg-border-light" />
              <div className="mb-1.5 h-1 w-2/3 bg-border-base" />
              <div className="h-1 w-1/2 bg-border-base" />
            </m.div>

            {/* Tabel kegiatan */}
            <m.div
              className="min-w-0 flex-1 p-2"
              variants={variants.window}
              initial="hidden"
              animate="visible"
            >
              <div className="mb-1.5 flex gap-1.5">
                <span className="h-1.5 w-8 bg-border-light" />
                <span className="h-1.5 w-5 bg-border-light" />
                <span className="h-1.5 flex-1 bg-border-light" />
              </div>
              <m.ul
                variants={variants.list}
                initial="hidden"
                animate="visible"
                className="m-0 list-none space-y-1 p-0"
              >
                {ROW_IDS.slice(0, profile.previewItems).map((id) => (
                  <m.li
                    key={id}
                    variants={variants.item}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-1.5"
                  >
                    <span className="h-1.5 w-8 shrink-0 bg-border-light" />
                    <span className="h-1.5 w-5 shrink-0 bg-border-base" />
                    <span className="h-1.5 min-w-0 flex-1 bg-border-base" />
                  </m.li>
                ))}
              </m.ul>
            </m.div>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-text-dim">{profile.description}</p>
      </div>
    </div>
  )
}
