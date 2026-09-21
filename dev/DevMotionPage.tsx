import { m } from 'motion/react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useDocumentVisible } from '@/lib/utils/useDocumentVisible'
import {
  buildTierPreviewVariants,
  listItemVariants,
  overlayVariants,
  pageVariants,
  pulseVariants,
  sidebarVariants,
  staggerListVariants,
} from '@/motion/presets'
import { MOTION_TIER_PROFILE } from '@/motion/tiers'
import { MOTION_TIERS, useUiStore } from '@/stores/ui'

const ROWS = ['baris-1', 'baris-2', 'baris-3', 'baris-4']

/**
 * Katalog preset animasi (AGENTS.md bagian 15). Setiap preset ditampilkan dan bisa
 * diputar ulang. Tier aktif diambil dari store, sehingga perilaku tiap tier terlihat.
 */
export function DevMotionPage() {
  const motion = useUiStore((s) => s.motion)
  const setMotion = useUiStore((s) => s.setMotion)
  const [replay, setReplay] = useState(0)
  const visible = useDocumentVisible()

  const profile = MOTION_TIER_PROFILE[motion]
  const tierVariants = useMemo(() => buildTierPreviewVariants(profile), [profile])

  const key = `${motion}-${replay}`

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-1 text-[17px] font-semibold text-text-primary">Katalog Motion</h1>
      <p className="mb-6 text-[13px] text-text-muted">
        Seluruh preset animasi dan perilakunya di tiap tier. Gunakan tombol untuk memutar ulang.
      </p>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label="Tier animasi"
          options={MOTION_TIERS.map((tier) => ({
            value: tier,
            label: MOTION_TIER_PROFILE[tier].label,
          }))}
          value={motion}
          onValueChange={setMotion}
        />
        <Button variant="outline" size="sm" onClick={() => setReplay((n) => n + 1)}>
          Putar ulang semua
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Demo title="page" description="Transisi halaman masuk dan keluar.">
          <m.div
            key={key}
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            className="flex h-24 items-center justify-center border border-border-base bg-bg-body"
          >
            <span className="text-[12px] text-text-muted">Halaman</span>
          </m.div>
        </Demo>

        <Demo title="overlay" description="Lapisan gelap muncul dan hilang.">
          <div className="relative h-24 overflow-hidden border border-border-base bg-bg-body">
            <m.div
              key={key}
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              className="absolute inset-0 bg-bg-overlay"
            />
            <span className="absolute inset-0 grid place-items-center text-[12px] text-text-main">
              Overlay
            </span>
          </div>
        </Demo>

        <Demo title="sidebar" description="Panel meluncur dari kiri memakai spring.">
          <div className="relative h-24 overflow-hidden border border-border-base bg-bg-body">
            <m.div
              key={key}
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              className="absolute inset-y-0 left-0 flex w-20 flex-col gap-1 border-r border-border-base bg-bg-sidebar p-2"
            >
              <span className="h-1.5 w-3/4 bg-accent" />
              <span className="h-1 w-full bg-border-light" />
              <span className="h-1 w-2/3 bg-border-base" />
            </m.div>
          </div>
        </Demo>

        <Demo title="staggerList dan listItem" description="Daftar muncul berurutan.">
          <m.ul
            key={key}
            variants={staggerListVariants}
            initial="hidden"
            animate="visible"
            className="m-0 flex h-24 list-none flex-col justify-center gap-1.5 border border-border-base bg-bg-body p-3"
          >
            {ROWS.map((row) => (
              <m.li key={row} variants={listItemVariants} className="flex items-center gap-2">
                <span className="h-1.5 w-10 bg-border-light" />
                <span className="h-1.5 flex-1 bg-border-base" />
              </m.li>
            ))}
          </m.ul>
        </Demo>

        <Demo title="pulse" description="Denyut halus untuk elemen idle.">
          <div className="flex h-24 items-center justify-center gap-3 border border-border-base bg-bg-body">
            <m.span
              variants={pulseVariants}
              initial="rest"
              animate={profile.pulse && visible ? 'pulse' : 'rest'}
              className="size-2.5 bg-status-ok"
            />
            <span className="text-[12px] text-text-muted">
              {profile.pulse ? 'Aktif' : 'Nonaktif di tier ini'}
            </span>
          </div>
        </Demo>

        <Demo title="tierPreview" description="Gerakan panel pratinjau tier.">
          <div key={key} className="flex h-24 gap-2 border border-border-base bg-bg-body p-2">
            <m.div
              variants={tierVariants.panel}
              initial="hidden"
              animate="visible"
              className="w-16 border-r border-border-base bg-bg-sidebar p-2"
            >
              <span className="mb-1.5 block h-1.5 w-3/4 bg-accent" />
              <span className="mb-1.5 block h-1 w-full bg-border-light" />
              <span className="block h-1 w-2/3 bg-border-base" />
            </m.div>
            <m.ul
              variants={tierVariants.list}
              initial="hidden"
              animate="visible"
              className="m-0 flex flex-1 list-none flex-col justify-center gap-1.5 p-0"
            >
              {ROWS.map((row) => (
                <m.li key={row} variants={tierVariants.item} className="flex items-center gap-2">
                  <span className="h-1.5 w-8 bg-border-light" />
                  <span className="h-1.5 flex-1 bg-border-base" />
                </m.li>
              ))}
            </m.ul>
          </div>
        </Demo>
      </div>

      <p className="mt-6 text-[12px] text-text-dim">
        Tier aktif: <span className="text-text-main">{profile.label}</span>. {profile.description}
      </p>
    </div>
  )
}

function Demo({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card padding="none" data-testid={`motion-${title}`}>
      <div className="border-b border-border-base px-3 py-2">
        <p className="font-mono text-[12px] text-text-primary">{title}</p>
        <p className="text-[11px] text-text-dim">{description}</p>
      </div>
      <div className="p-3">{children}</div>
    </Card>
  )
}
