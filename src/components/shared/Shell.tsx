import { AnimatePresence, m } from 'motion/react'
import type { ReactNode } from 'react'
import { pageVariants } from '@/motion/presets'
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
 * JEBAKAN YANG SUDAH DIPERBAIKI: JANGAN pernah memberi `initial={false}` pada
 * `AnimatePresence` di sini. Nilai itu menyebar lewat konteks ke SELURUH komponen
 * Motion di dalam pohon, sehingga semua animasi masuk (pratinjau tier, kartu, panel)
 * ikut dilewati tanpa error. Halaman cukup memakai `initial="hidden"` biasa.
 * Lihat AGENTS.md bagian 8.
 */
export function Shell({ activePath, breadcrumb, children }: ShellProps) {
  return (
    <div className="flex h-full w-full">
      <Sidebar activePath={activePath} />

      <div
        className="flex h-full min-w-0 flex-1 flex-col"
        style={{ marginLeft: 'var(--sidebar-rail-width)' }}
      >
        <TopHeader breadcrumb={breadcrumb} />

        <main className="relative min-h-0 flex-1 overflow-y-auto">
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

        <StatusBar />
      </div>
    </div>
  )
}
