import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FlaskConical,
  Gauge,
  Layers,
  Settings,
  Sprout,
} from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { navigate } from '@/app/router'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { formatWeekRange } from '@/lib/domain/calendar'
import { cn } from '@/lib/utils/cn'
import {
  listItemVariants,
  overlayVariants,
  popTransition,
  sidebarVariants,
  staggerListVariants,
} from '@/motion/presets'
import { useConfigStore } from '@/stores/config'
import { useLogbookStore } from '@/stores/logbook'
import { useUiStore } from '@/stores/ui'

interface NavItem {
  label: string
  path: string
  icon: typeof BookOpen
}

const MAIN_NAV: NavItem[] = [
  { label: 'Log Book', path: '/', icon: BookOpen },
  { label: 'Pengaturan', path: '/settings', icon: Settings },
  { label: 'Ekspor', path: '/export', icon: Download },
]

/**
 * Aksi cepat di rail, selalu tampil walau drawer tertutup. Log Book ada di sini agar
 * konsisten dengan daftar nav di drawer (AGENTS.md bagian 11.4).
 */
const RAIL_ACTIONS: NavItem[] = [
  { label: 'Log Book', path: '/', icon: BookOpen },
  { label: 'Pengaturan', path: '/settings', icon: Settings },
  { label: 'Ekspor', path: '/export', icon: Download },
]

const DEV_NAV: NavItem[] = [
  { label: 'Komponen', path: '/dev/components', icon: Layers },
  { label: 'Motion', path: '/dev/motion', icon: FlaskConical },
  { label: 'Performa', path: '/dev/perf', icon: Gauge },
  { label: 'Seed', path: '/dev/seed', icon: Sprout },
]

interface SidebarProps {
  activePath: string
}

/**
 * Sidebar terdiri dari dua bagian (AGENTS.md bagian 11.4):
 * - Rail statis selebar 52 px yang selalu tampil berisi aksi cepat dan label bulan.
 * - Drawer yang meluncur menumpuk di atas konten saat dibuka.
 *
 * Tombol buka dan tombol tutup sengaja BERSAUDARA secara visual:
 * - Di rail, tombol buka berada di DASAR rail, tingginya mengisi sisa ruang.
 * - Di drawer, tombol tutup berada di DASAR drawer, tingginya juga mengisi sisa ruang,
 *   dengan batas `max-h` supaya daftar bulan tidak pernah terasa sempit.
 * Keduanya memakai ikon panel yang sama, hanya arahnya berbeda, jadi user langsung
 * tahu hubungannya. `popTransition` dipakai saat tinggi tombol berubah agar tidak
 * melompat, dan hanya memakai transform (AGENTS.md bagian 8.2).
 *
 * Dua cara menutup: tombol tutup di dasar drawer dan tombol Escape. Backdrop hanya
 * muncul di viewport sempit agar desktop tetap bisa diklik.
 */
export function Sidebar({ activePath }: SidebarProps) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const months = useLogbookStore((s) => s.months)
  const activeMonthKey = useLogbookStore((s) => s.activeMonthKey)
  const activeWeekId = useLogbookStore((s) => s.activeWeekId)
  const selectWeek = useLogbookStore((s) => s.selectWeek)
  const tampilkanDevUi = useConfigStore((s) => s.config.tampilkanDevUi)
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({})

  const openDrawer = useCallback(() => {
    useUiStore.getState().setSidebarCollapsed(false)
  }, [])

  const closeDrawer = useCallback(() => {
    useUiStore.getState().setSidebarCollapsed(true)
  }, [])

  /**
   * Saat drawer dibuka, bulan aktif SELALU dibuka juga. Dengan begitu sidebar langsung
   * fokus ke bulan dan minggu yang sedang dilihat user, bukan ke keadaan terakhir
   * sebelum refresh. Pilihan user tetap dihormati selama drawer tetap terbuka.
   */
  useEffect(() => {
    if (collapsed || !activeMonthKey) return
    setOpenMonths((prev) => (prev[activeMonthKey] ? prev : { ...prev, [activeMonthKey]: true }))
  }, [collapsed, activeMonthKey])

  // Escape menutup drawer, kecuali ada dialog atau popover yang sedang terbuka.
  useEffect(() => {
    if (collapsed) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      const overlay = document.querySelector(
        '[role="dialog"][data-state="open"], [data-slot="popover-content"]',
      )
      if (overlay) return
      closeDrawer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [collapsed, closeDrawer])

  /**
   * Menekan item bulan hanya membuka atau menutup daftar minggunya. Menekan ini TIDAK
   * memilih bulan: bulan yang dipakai mengikuti minggu yang dipilih user, supaya tidak
   * ada dua sumber kebenaran (AGENTS.md bagian 6 dan 11.4).
   */
  function toggleMonth(key: string) {
    setOpenMonths((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  /**
   * Memilih minggu sekaligus menetapkan bulan konteksnya, lalu menuju Log Book.
   *
   * PENTING: keadaan buka/tutup bulan lain TIDAK disentuh. Sebelumnya fungsi ini menutup
   * semua bulan lain, dan itu mengagetkan user. Sekarang hanya bulan tempat minggu yang
   * dipilih dipastikan terbuka, sisanya dibiarkan apa adanya.
   */
  function pickWeek(monthKey: string, weekId: string) {
    // Bulan konteks ikut dipilih, penting untuk minggu lintas bulan (AGENTS.md bagian 6).
    selectWeek(weekId, monthKey)
    setOpenMonths((prev) => (prev[monthKey] ? prev : { ...prev, [monthKey]: true }))
    navigate('/')
  }

  /** Menuju Log Book dan menampilkan bulan serta minggu yang sedang dipilih. */
  function goToActiveWeek() {
    navigate('/')
  }

  return (
    <>
      <AnimatePresence>
        {!collapsed ? (
          <>
            {/* Backdrop hanya pada viewport sempit, agar desktop tetap bisa diklik. */}
            <m.button
              type="button"
              aria-label="Tutup sidebar"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeDrawer}
              className="theme-t no-print fixed inset-0 z-40 cursor-default bg-bg-overlay lg:hidden"
            />

            <m.aside
              data-testid="sidebar-drawer"
              aria-label="Navigasi utama"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'theme-t no-print fixed top-0 left-0 z-50 flex flex-col',
                'border-r border-border-base bg-bg-sidebar',
                // Berhenti tepat di atas status bar, sama seperti rail. Dengan begitu tepi
                // bawah drawer sejajar dengan tepi atas status bar yang full width, tanpa
                // "notch" di sudut kiri bawah (AGENTS.md bagian 7 dan 11.4).
                'bottom-[var(--statusbar-height)]',
              )}
              style={{ width: 'var(--sidebar-width)' }}
            >
              <div
                className="theme-t flex shrink-0 items-center gap-2 border-b border-border-base px-2"
                style={{ height: 'var(--header-height)' }}
              >
                <button
                  type="button"
                  onClick={goToActiveWeek}
                  aria-label="Ke Log Book"
                  data-testid="sidebar-brand"
                  className="grid size-7 shrink-0 place-items-center bg-accent text-[13px] font-black text-accent-text"
                >
                  L
                </button>
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight text-text-primary">
                  logman
                </span>
              </div>

              <nav className="flex flex-col gap-0.5 border-b border-border-base p-2">
                {MAIN_NAV.map((item) => (
                  <NavButton key={item.path} item={item} activePath={activePath} />
                ))}
              </nav>

              {/*
                Area gulir hanya berisi daftar bulan. Label "Bulan" memakai `sticky top-0`
                dengan latar yang sama dengan sidebar, sehingga ia menggulir bersama daftar
                namun berhenti di atas dan tetap terlihat (perilaku sliver). Label ini
                sengaja TIDAK punya garis atau margin sendiri: pemisah antar bagian sudah
                disediakan border pada blok nav Dev di bawahnya.
              */}
              <div
                data-testid="sidebar-months-scroll"
                className="flex min-h-40 shrink flex-col overflow-y-auto pb-2"
              >
                <div className="sticky top-0 z-10 bg-bg-sidebar">
                  <p className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-dim">
                    Bulan
                  </p>
                </div>

                {months.length === 0 ? (
                  <p className="px-4 py-3 text-[12px] leading-relaxed text-text-dim">
                    Atur rentang magang di Pengaturan untuk membuat daftar Log Book.
                  </p>
                ) : null}

                <m.ul
                  variants={staggerListVariants}
                  initial="hidden"
                  animate="visible"
                  className="m-0 list-none px-2"
                >
                  {months.map((month) => {
                    const isOpen = openMonths[month.key] ?? false
                    const isActiveMonth = month.key === activeMonthKey
                    return (
                      <m.li key={month.key} variants={listItemVariants} className="list-none">
                        {/*
                          Penanda bulan mengikuti MINGGU YANG SEDANG DIPILIH, bukan status
                          buka/tutup. Jadi hanya SATU bulan yang tampil lebih terang, dan
                          itu tetap begitu walau bulannya sedang tertutup atau bulan lain
                          sedang dibuka. Tidak ada border, latar, atau label tambahan.
                        */}
                        <button
                          type="button"
                          onClick={() => toggleMonth(month.key)}
                          aria-expanded={isOpen}
                          data-active={isActiveMonth ? 'true' : undefined}
                          className={cn(
                            'theme-t flex w-full items-center gap-2 border border-transparent px-2 py-1.5 text-left text-[12px]',
                            'hover:bg-bg-card',
                            isActiveMonth
                              ? 'text-text-primary'
                              : 'text-text-muted hover:text-text-primary',
                          )}
                        >
                          <m.span
                            className="shrink-0"
                            animate={{ rotate: isOpen ? 90 : 0 }}
                            transition={popTransition}
                          >
                            <ChevronRight className="size-3.5" strokeWidth={2} />
                          </m.span>
                          <span className="truncate">{month.label}</span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen ? (
                            <m.ul
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={popTransition}
                              className="m-0 mb-1 list-none p-0 pl-4"
                            >
                              {month.weeks.map((week) => {
                                const isActiveWeek = week.id === activeWeekId
                                return (
                                  <li key={week.id} className="list-none">
                                    <button
                                      type="button"
                                      onClick={() => pickWeek(month.key, week.id)}
                                      aria-current={isActiveWeek ? 'true' : undefined}
                                      className={cn(
                                        'theme-t flex w-full items-baseline gap-2 border-l px-2 py-1 text-left text-[12px]',
                                        isActiveWeek
                                          ? 'border-accent bg-bg-card font-semibold text-text-primary'
                                          : 'border-border-light text-text-dim hover:bg-bg-card hover:text-text-primary',
                                      )}
                                    >
                                      <span className="font-semibold">M{week.weekOfMonth}</span>
                                      <span className="truncate text-[11px]">
                                        {formatWeekRange(week.startDate)}
                                      </span>
                                    </button>
                                  </li>
                                )
                              })}
                            </m.ul>
                          ) : null}
                        </AnimatePresence>
                      </m.li>
                    )
                  })}
                </m.ul>
              </div>

              {tampilkanDevUi ? (
                <nav className="shrink-0 border-t border-border-base p-2">
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-dim">
                    Dev
                  </p>
                  {DEV_NAV.map((item) => (
                    <NavButton key={item.path} item={item} activePath={activePath} />
                  ))}
                </nav>
              ) : null}

              <DrawerCollapseButton onClose={closeDrawer} />
            </m.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/*
        Rail: satu kolom penuh selebar 52 px. Aksi cepat di atas, daftar bulan yang
        dapat digulir di tengah, dan tombol buka yang tingginya memenuhi sisa ruang di
        bawah. Dengan begitu user cukup menekan bagian bawah rail yang collapse tanpa
        perlu presisi (AGENTS.md bagian 11.4).
      */}
      <nav
        data-testid="sidebar-rail"
        aria-label="Navigasi ringkas"
        className="theme-t no-print fixed top-0 left-0 z-30 flex flex-col border-r border-border-base bg-bg-sidebar bottom-[var(--statusbar-height)]"
        style={{ width: 'var(--sidebar-rail-width)' }}
      >
        <div
          className="flex w-full shrink-0 items-center justify-center border-b border-border-base"
          style={{ height: 'var(--header-height)' }}
        >
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Buka sidebar"
            data-testid="sidebar-open-logo"
            className="theme-t grid size-7 place-items-center bg-accent text-[13px] font-black text-accent-text"
          >
            L
          </button>
        </div>

        {/* Aksi cepat: Log Book, Pengaturan, dan Ekspor tetap tersedia saat drawer tertutup. */}
        <div className="flex w-full shrink-0 flex-col items-center gap-1 py-2">
          {RAIL_ACTIONS.map((item) => (
            <RailIconButton key={item.path} item={item} activePath={activePath} />
          ))}
        </div>

        <div className="flex min-h-0 w-full shrink flex-col items-center gap-1 overflow-y-auto py-2">
          {months.map((month) => (
            <Popover key={month.key}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Bulan ${month.label}`}
                  aria-current={month.key === activeMonthKey ? 'true' : undefined}
                  className={cn(
                    'theme-t grid h-9 w-9 shrink-0 place-items-center border text-[11px] font-semibold',
                    month.key === activeMonthKey
                      ? 'border-border-light bg-bg-card text-text-primary'
                      : 'border-transparent text-text-muted hover:border-border-base hover:text-text-primary',
                  )}
                >
                  {month.short}
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start">
                <p className="mb-1 px-1 text-[12px] font-semibold text-text-primary">
                  {month.label}
                </p>
                <ul className="m-0 max-h-72 list-none overflow-y-auto p-0">
                  {month.weeks.map((week) => {
                    const isActiveWeek = week.id === activeWeekId
                    return (
                      <li key={week.id} className="list-none">
                        <button
                          type="button"
                          onClick={() => pickWeek(month.key, week.id)}
                          aria-current={isActiveWeek ? 'true' : undefined}
                          className={cn(
                            'theme-t block w-full px-2 py-1.5 text-left text-[12px]',
                            isActiveWeek
                              ? 'bg-bg-card font-semibold text-text-primary'
                              : 'text-text-dim hover:bg-bg-card hover:text-text-primary',
                          )}
                        >
                          <span className="font-semibold">M{week.weekOfMonth}</span>
                          <span className="ml-2 text-[11px]">
                            {formatWeekRange(week.startDate)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </PopoverContent>
            </Popover>
          ))}
        </div>

        {/*
          Tombol buka: selebar rail, tingginya mengisi SELURUH sisa ruang sampai dasar,
          jadi area kliknya sangat besar (AGENTS.md bagian 11.4). Ikonnya sengaja
          sederhana, hanya garis pemisah dan panah, sama seperti tombol tutup di drawer.
        */}
        <m.button
          type="button"
          onClick={openDrawer}
          aria-label="Buka sidebar lewat strip"
          data-testid="sidebar-open-strip"
          whileHover={{ y: -2 }}
          transition={popTransition}
          className="theme-t group flex min-h-20 w-full flex-1 flex-col items-center justify-center gap-2 border-t border-border-base text-text-dim hover:bg-bg-card hover:text-text-primary"
        >
          <span className="h-6 w-px shrink-0 bg-border-light" aria-hidden />
          <ChevronRight className="size-4 shrink-0" strokeWidth={1.75} />
        </m.button>
      </nav>
    </>
  )
}

/** Tombol ikon 36x36 untuk rail, dengan keadaan aktif mengikuti path. */
function RailIconButton({ item, activePath }: { item: NavItem; activePath: string }) {
  const Icon = item.icon
  const isActive = activePath === item.path
  return (
    <button
      type="button"
      onClick={() => navigate(item.path)}
      aria-label={item.label}
      data-testid={`rail-${item.path === '/' ? 'logbook' : item.path.slice(1)}`}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'theme-t grid h-9 w-9 shrink-0 place-items-center border',
        isActive
          ? 'border-border-light bg-bg-card text-text-primary'
          : 'border-transparent text-text-muted hover:border-border-base hover:text-text-primary',
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </button>
  )
}

/**
 * Tombol tutup di DASAR drawer, kembar dengan tombol buka di rail.
 *
 * Aturan tata letaknya:
 * - `flex-1` + `min-h-20`: tombol mengisi sisa ruang drawer, tetapi tidak pernah lebih
 *   pendek dari 80 px. Jadi daftar bulan di atasnya tetap lega untuk digulir.
 * - Isi tombol dibungkus SATU container berisi yang lebarnya `--sidebar-rail-width`
 *   dan tingginya mengikuti tombol (`h-full`). Container itu ditempel ke KANAN tombol
 *   (`self-end`), sehingga isinya terlihat rapat ke tepi kanan sidebar expanded, sama
 *   seperti posisi rail saat collapsed. Di dalam container, isinya di-center, jadi
 *   tampilannya identik dengan tombol buka di rail.
 * - Ikonnya identik dengan tombol buka (garis pemisah lalu panah, hanya arah
 *   berlawanan), supaya keduanya terlihat sebagai pasangan.
 *
 * `layout` membuat perpindahan tingginya beranimasi memakai transform, bukan properti
 * tata letak (AGENTS.md bagian 8.3.2).
 */
function DrawerCollapseButton({ onClose }: { onClose: () => void }) {
  return (
    <m.button
      type="button"
      onClick={onClose}
      aria-label="Tutup sidebar lewat strip"
      data-testid="sidebar-collapse-strip"
      layout
      transition={popTransition}
      className="theme-t flex min-h-20 w-full flex-1 items-stretch justify-end border-t border-border-base text-text-dim hover:bg-bg-card hover:text-text-primary"
    >
      {/*
        Container selebar rail, tingginya mengikuti tombol. Isi (garis + panah) di-center di
        dalamnya. Karena container ini menempel ke kanan, ikonnya sejajar dengan ikon rail
        saat collapsed.
      */}
      <span
        className="flex w-[var(--sidebar-rail-width)] shrink-0 flex-col items-center justify-center gap-2"
        aria-hidden
      >
        <span className="h-6 w-px shrink-0 bg-border-light" />
        <ChevronLeft className="size-4 shrink-0" strokeWidth={1.75} />
      </span>
    </m.button>
  )
}

function NavButton({ item, activePath }: { item: NavItem; activePath: string }) {
  const Icon = item.icon
  const isActive = activePath === item.path
  return (
    <button
      type="button"
      onClick={() => navigate(item.path)}
      className={cn(
        'theme-t flex items-center gap-3 px-3 py-2 text-left text-[13px]',
        isActive
          ? 'border border-border-base bg-bg-card font-semibold text-text-primary'
          : 'border border-transparent text-text-muted hover:bg-bg-card hover:text-text-primary',
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{item.label}</span>
    </button>
  )
}
