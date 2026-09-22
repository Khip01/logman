import { AnimatePresence, m } from 'motion/react'
import { type ReactNode, useEffect } from 'react'
import { pageStyleContent } from '@/lib/domain/paper'
import { pageVariants } from '@/motion/presets'
import { useConfigStore } from '@/stores/config'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { TopHeader } from './TopHeader'

interface ShellProps {
  activePath: string
  breadcrumb: string[]
  children: ReactNode
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
export function Shell({ activePath, breadcrumb, children }: ShellProps) {
  const ukuranKertas = useConfigStore((s) => s.config.ukuranKertas)

  useEffect(() => {
    let tag = document.getElementById('logman-page-style') as HTMLStyleElement | null
    if (!tag) {
      tag = document.createElement('style')
      tag.id = 'logman-page-style'
      document.head.appendChild(tag)
    }
    tag.textContent = pageStyleContent(ukuranKertas)
  }, [ukuranKertas])

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex min-h-0 flex-1">
        <Sidebar activePath={activePath} />

        <div
          className="app-frame flex min-h-0 min-w-0 flex-1 flex-col"
          style={{ marginLeft: 'var(--sidebar-rail-width)' }}
        >
          <TopHeader breadcrumb={breadcrumb} />

          <main className="app-main relative min-h-0 flex-1 overflow-y-auto">
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
              </m.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <StatusBar />
    </div>
  )
}
