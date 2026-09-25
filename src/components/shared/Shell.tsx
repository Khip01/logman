import { AnimatePresence, m } from 'motion/react'
import { type ReactNode, useEffect, useLayoutEffect, useRef } from 'react'
import { pageStyleContent } from '@/lib/domain/paper'
import { useT } from '@/lib/i18n'
import type { MessageKey } from '@/lib/i18n/messages/id'
import { readScroll, saveScroll } from '@/lib/utils/scrollMemory'
import { pageVariants } from '@/motion/presets'
import { useConfigStore } from '@/stores/config'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { TopHeader } from './TopHeader'

interface ShellProps {
  activePath: string
  /**
   * Key breadcrumb, atau null bila halaman tidak dikenal. Shell yang menerjemahkan,
   * supaya route tidak perlu tahu bahasa aktif (AGENTS.md bagian 21).
   */
  breadcrumbKeys: MessageKey[] | null
  children: ReactNode
}

/**
 * Memulihkan posisi scroll halaman ini sebelum paint.
 *
 * Diletakkan SETELAH `children` agar efek layout milik konten (misalnya `AutoGrowTextarea`
 * yang menyetel tinggi) sudah selesai diukur, sehingga tinggi kontainer sudah final saat
 * posisi dipulihkan. `useLayoutEffect` berjalan sebelum paint, jadi user tidak melihat
 * kedipan "atas lalu lompat".
 */
function ScrollRestore({
  container,
  path,
}: {
  container: React.RefObject<HTMLElement | null>
  path: string
}) {
  useLayoutEffect(() => {
    const node = container.current
    if (!node) return
    node.scrollTop = readScroll(path)
  }, [container, path])

  return null
}

/**
 * Kerangka aplikasi. Sidebar bersifat overlay (AGENTS.md bagian 11.4), sehingga
 * lebar konten hanya dipengaruhi oleh rail sempit, bukan oleh drawer yang terbuka.
 *
 * Susunan tinggi: baris atas (rail + konten) mengambil sisa ruang, lalu status bar
 * FULL WIDTH di paling bawah. Rail dan drawer sama-sama berhenti di atas status bar
 * (`bottom-[var(--statusbar-height)]`), sehingga tepi bawah keduanya sejajar dengan
 * tepi atas status bar. Tanpa ini, rail yang full height dan drawer yang tidak akan
 * membentuk "notch" di sudut kiri bawah.
 *
 * POSISI SCROLL PER HALAMAN (AGENTS.md bagian 11.4): `<main>` adalah satu kontainer scroll
 * yang tidak pernah diganti, jadi tanpa pengelolaan, posisi halaman lama terbawa ke
 * halaman baru. Karena itu posisi disimpan saat path berubah dan dipulihkan oleh
 * `ScrollRestore`. Ingatan ini TIDAK memakai scroll listener: penulisan hanya terjadi
 * sekali per navigasi, jadi menggulir tidak menambah biaya apa pun (bagian 13).
 *
 * Shell juga menulis aturan @page runtime (#logman-page-style) mengikuti ukuran
 * kertas dari config, agar preview cetak browser dan PDF ekspor memakai ukuran
 * yang sama (AGENTS.md bagian 12).
 *
 * JEBAKAN YANG SUDAH DIPERBAIKI: JANGAN pernah memberi `initial={false}` pada
 * `AnimatePresence` di sini. Nilai itu menyebar lewat konteks ke SELURUH komponen
 * Motion di dalam pohon, sehingga semua animasi masuk (pratinjau tier, kartu, panel)
 * ikut dilewati tanpa error. Halaman cukup memakai `initial="hidden"` biasa.
 * Lihat AGENTS.md bagian 8.
 */
export function Shell({ activePath, breadcrumbKeys, children }: ShellProps) {
  const t = useT()
  const ukuranKertas = useConfigStore((s) => s.config.ukuranKertas)
  const mainRef = useRef<HTMLElement>(null)
  const trackedPathRef = useRef(activePath)

  useEffect(() => {
    let tag = document.getElementById('logman-page-style') as HTMLStyleElement | null
    if (!tag) {
      tag = document.createElement('style')
      tag.id = 'logman-page-style'
      document.head.appendChild(tag)
    }
    tag.textContent = pageStyleContent(ukuranKertas)
  }, [ukuranKertas])

  /*
   * Menyimpan posisi scroll halaman yang ditinggalkan. Memakai `useLayoutEffect`, bukan
   * `useEffect`, karena pada tier `mati` animasi keluar selesai seketika; dengan `useEffect`
   * posisi lama bisa sudah terklam oleh tinggi konten baru sebelum sempat dibaca.
   */
  useLayoutEffect(() => {
    const node = mainRef.current
    const previous = trackedPathRef.current
    if (node && previous !== activePath) {
      saveScroll(previous, node.scrollTop)
    }
    trackedPathRef.current = activePath
  }, [activePath])

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex min-h-0 flex-1">
        <Sidebar activePath={activePath} />

        <div
          className="app-frame flex min-h-0 min-w-0 flex-1 flex-col"
          style={{ marginLeft: 'var(--sidebar-rail-width)' }}
        >
          <TopHeader
            breadcrumb={breadcrumbKeys?.map((key) => t(key)) ?? [t('error.tidakDitemukan')]}
          />

          <main
            ref={mainRef}
            data-testid="app-main"
            className="app-main relative min-h-0 flex-1 overflow-y-auto"
          >
            <AnimatePresence mode="wait">
              <m.div
                key={activePath}
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="min-h-full"
              >
                {children}
                <ScrollRestore container={mainRef} path={activePath} />
              </m.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <StatusBar />
    </div>
  )
}
