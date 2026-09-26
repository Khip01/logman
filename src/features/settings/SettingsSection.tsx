import type { LucideIcon } from 'lucide-react'
import {
  CalendarOff,
  Clock,
  FileText,
  Languages,
  ListChecks,
  Palette,
  PenLine,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import {
  type SettingsSectionIcon,
  type SettingsSectionId,
  settingsSectionDomId,
  settingsSectionIcon,
} from '@/lib/domain/settingsSearch'
import { onScrollSettle } from '@/lib/utils/scrollSettle'
import { sectionGlintTotalSeconds } from '@/motion/presets'
import { MOTION_TIER_PROFILE } from '@/motion/tiers'
import { useUiStore } from '@/stores/ui'
import { GlintBorder, GlintShine } from './GlintTrail'
import { useSettingsFlashRequest } from './SettingsFlash'

/**
 * Pembungkus satu seksi Pengaturan (AGENTS.md bagian 22).
 *
 * SEBELUMNYA setiap seksi menulis `<section>` dan `<h2>` sendiri, dengan empat seksi
 * memakai `SectionTitle` lokal dan lima seksi menulis `<h2>` langsung. Untuk pencarian,
 * setiap seksi perlu `id` DOM yang stabil dan kemampuan diberi kilau saat dipilih, jadi
 * markup itu disatukan di sini:
 * - `id` stabil lewat `settingsSectionDomId`, dipakai pencarian untuk menggulir.
 * - `data-testid` tetap `section-<id>`, sama seperti sebelumnya.
 * - `scroll-mt-20` memberi ruang untuk bar pencarian yang sticky di atas.
 * - kilau sasaran, yang baru dijalankan SETELAH gulir mendarat.
 */

/** Pemetaan nama ikon ke komponennya. Modul domain menyimpan nama, bukan komponen. */
const ICONS: Record<SettingsSectionIcon, LucideIcon> = {
  user: UserRound,
  palette: Palette,
  sparkles: Sparkles,
  languages: Languages,
  clock: Clock,
  'list-checks': ListChecks,
  'pen-line': PenLine,
  'calendar-off': CalendarOff,
  'file-text': FileText,
  wrench: Wrench,
}

interface SettingsSectionProps {
  id: SettingsSectionId
  title: string
  children: ReactNode
}

export function SettingsSection({ id, title, children }: SettingsSectionProps) {
  const { request, clear } = useSettingsFlashRequest()
  const sectionRef = useRef<HTMLElement>(null)
  const motionTier = useUiStore((s) => s.motion)

  const profile = MOTION_TIER_PROFILE[motionTier]
  const isTarget = request?.sectionId === id
  const token = isTarget ? request.token : null

  /*
   * Token kilau aktif. Diisi setelah gulir mendarat, dikosongkan lagi setelah kilau
   * selesai. `null` berarti tidak ada kilau yang sedang berjalan.
   */
  const [glintToken, setGlintToken] = useState<number | null>(null)

  /*
   * Menggulir ke seksi ini, lalu MENUNGGU gulir mendarat sebelum menyalakan kilau.
   *
   * Kilau sengaja TIDAK dimulai saat gulir masih berjalan: animasinya akan selesai
   * sebelum seksi tujuannya terlihat, jadi user tidak pernah melihatnya. Perilaku gulir
   * mengikuti tier: halus bila tier mengizinkan gerakan sekunder, langsung pada `minimal`
   * dan `mati`.
   */
  useEffect(() => {
    if (token === null) return
    const section = sectionRef.current
    const container = section?.closest('[data-testid="app-main"]')
    if (!section || !(container instanceof HTMLElement)) {
      setGlintToken(token)
      return
    }

    section.scrollIntoView({
      block: 'start',
      behavior: profile.secondaryMotion ? 'smooth' : 'auto',
    })

    return onScrollSettle(container, () => setGlintToken(token))
  }, [token, profile.secondaryMotion])

  /*
   * Membersihkan permintaan setelah SELURUH rangkaian kilau selesai: fade in, sapuan,
   * tahan, lalu fade out. Dikerjakan di sini, bukan di provider, karena lama permintaan
   * bergantung pada waktu gulir yang hanya diketahui sasaran. Setelah dibersihkan,
   * memilih saran yang sama dua kali akan memutar ulang kilaunya.
   */
  useEffect(() => {
    if (glintToken === null) return
    const durationMs = sectionGlintTotalSeconds(profile) * 1000
    const timer = window.setTimeout(() => {
      setGlintToken(null)
      clear(glintToken)
    }, durationMs)
    return () => window.clearTimeout(timer)
  }, [glintToken, profile, clear])

  return (
    <section
      ref={sectionRef}
      id={settingsSectionDomId(id)}
      data-testid={`section-${id}`}
      data-flash={token !== null ? 'true' : 'false'}
      className="relative mb-10 scroll-mt-20"
    >
      {/*
        Garis border yang merembet turun, DI BELAKANG konten. Ini yang membuat penutup
        border boleh menutupi area panel tanpa pernah menutupi teks. Tiap komponen
        memutuskan kadar per tier sendiri (bagian 22); tier `mati` tidak merender apa pun.
      */}
      {glintToken !== null ? <GlintBorder token={glintToken} /> : null}

      <div className="relative z-10">
        <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          <IconFor id={id} />
          {title}
        </h2>

        {children}
      </div>

      {/*
        Sapuan cahaya, DI PALING DEPAN, di atas seluruh komponen seksi, supaya terasa
        melintas di permukaan. Lapisannya `pointer-events: none`, jadi tidak menghalangi
        klik pada kontrol di dalam seksi.
      */}
      {glintToken !== null ? <GlintShine token={glintToken} /> : null}
    </section>
  )
}

/** Ikon seksi, diambil dari registry supaya judul dan pencarian memakai ikon yang sama. */
function IconFor({ id }: { id: SettingsSectionId }) {
  const Icon = ICONS[settingsSectionIcon(id)]
  return <Icon className="size-4" strokeWidth={1.75} />
}
