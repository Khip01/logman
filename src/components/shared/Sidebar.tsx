import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  FlaskConical,
  Gauge,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useState } from 'react'
import { navigate } from '@/app/router'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { formatWeekRange } from '@/lib/domain/calendar'
import { cn } from '@/lib/utils/cn'
import {
  listItemVariants,
  overlayVariants,
  sidebarVariants,
  staggerListVariants,
} from '@/motion/presets'
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

const DEV_NAV: NavItem[] = [
  { label: 'Komponen', path: '/dev/components', icon: Layers },
  { label: 'Motion', path: '/dev/motion', icon: FlaskConical },
  { label: 'Performa', path: '/dev/perf', icon: Gauge },
]

interface SidebarProps {
  activePath: string
}

/**
 * Sidebar terdiri dari dua bagian (AGENTS.md bagian 11.4):
 * - Rail statis selebar 52 px yang selalu tampil berisi label bulan 3 huruf.
 * - Drawer yang meluncur menumpuk di atas konten saat dibuka.
 * Tinggi dan lebar tidak dianimasikan, hanya transform dan opacity.
 */
export function Sidebar({ activePath }: SidebarProps) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const months = useLogbookStore((s) => s.months)
  const activeMonthKey = useLogbookStore((s) => s.activeMonthKey)
  const setActiveMonth = useLogbookStore((s) => s.setActiveMonth)
  const activeWeekId = useLogbookStore((s) => s.activeWeekId)
  const selectWeek = useLogbookStore((s) => s.selectWeek)
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({})

  function openDrawerAt(key: string | null) {
    useUiStore.getState().setSidebarCollapsed(false)
    if (key) {
      setActiveMonth(key)
      setOpenMonths((prev) => ({ ...prev, [key]: true }))
    }
  }

  function toggleMonth(key: string) {
    setOpenMonths((prev) => ({ ...prev, [key]: !prev[key] }))
    setActiveMonth(key)
  }

  function pickWeek(monthKey: string, weekId: string) {
    // Bulan konteks ikut dipilih, penting untuk minggu lintas bulan (AGENTS.md bagian 6).
    selectWeek(weekId, monthKey)
    // Perluas daftar minggu bulan ini, tutup yang lain agar rapi.
    setOpenMonths({ [monthKey]: true })
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
              onClick={() => useUiStore.getState().setSidebarCollapsed(true)}
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
                'theme-t no-print fixed inset-y-0 left-0 z-50 flex flex-col',
                'border-r border-border-base bg-bg-sidebar',
              )}
              style={{ width: 'var(--sidebar-width)' }}
            >
              <div
                className="theme-t flex shrink-0 items-center gap-2 border-b border-border-base px-2"
                style={{ height: 'var(--header-height)' }}
              >
                <div className="grid size-7 shrink-0 place-items-center bg-accent text-[13px] font-black text-accent-text">
                  L
                </div>
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight text-text-primary">
                  logman
                </span>
                <button
                  type="button"
                  onClick={() => useUiStore.getState().setSidebarCollapsed(true)}
                  aria-label="Tutup sidebar"
                  className="theme-t grid size-7 shrink-0 place-items-center border border-border-base text-text-muted hover:border-border-light hover:text-text-primary"
                >
                  <PanelLeftClose className="size-4" strokeWidth={1.75} />
                </button>
              </div>

              <nav className="flex flex-col gap-0.5 border-b border-border-base p-2">
                {MAIN_NAV.map((item) => (
                  <NavButton key={item.path} item={item} activePath={activePath} />
                ))}
              </nav>

              <div className="flex-1 overflow-y-auto p-2">
                <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
                  Bulan
                </p>

                {months.length === 0 ? (
                  <p className="px-2 py-3 text-[12px] leading-relaxed text-text-dim">
                    Atur rentang magang di Pengaturan untuk membuat daftar Log Book.
                  </p>
                ) : null}

                <m.ul
                  variants={staggerListVariants}
                  initial="hidden"
                  animate="visible"
                  className="m-0 list-none p-0"
                >
                  {months.map((month) => {
                    const isOpen = openMonths[month.key] ?? false
                    return (
                      <m.li key={month.key} variants={listItemVariants} className="list-none">
                        <button
                          type="button"
                          onClick={() => toggleMonth(month.key)}
                          className="theme-t flex w-full items-center gap-2 px-2 py-2 text-left text-[13px] text-text-muted hover:bg-bg-card hover:text-text-primary"
                        >
                          {isOpen ? (
                            <ChevronDown className="size-3.5 shrink-0" strokeWidth={1.75} />
                          ) : (
                            <ChevronRight className="size-3.5 shrink-0" strokeWidth={1.75} />
                          )}
                          <span className="truncate">{month.label}</span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen ? (
                            <m.ul
                              variants={staggerListVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              className="m-0 ml-4 list-none border-l border-border-base pl-2"
                            >
                              {month.weeks.map((week) => (
                                <m.li
                                  key={week.id}
                                  variants={listItemVariants}
                                  className="list-none"
                                >
                                  <button
                                    type="button"
                                    onClick={() => pickWeek(month.key, week.id)}
                                    className={cn(
                                      'theme-t block w-full px-2 py-1.5 text-left text-[12px]',
                                      week.id === activeWeekId
                                        ? 'bg-bg-card text-text-primary'
                                        : 'text-text-dim hover:bg-bg-card hover:text-text-primary',
                                    )}
                                  >
                                    <span className="font-semibold">M{week.weekOfMonth}</span>
                                    <span className="ml-2 text-[11px]">
                                      {formatWeekRange(week.startDate)}
                                    </span>
                                  </button>
                                </m.li>
                              ))}
                            </m.ul>
                          ) : null}
                        </AnimatePresence>
                      </m.li>
                    )
                  })}
                </m.ul>

                <p className="px-2 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-text-dim">
                  Dev
                </p>
                <div className="flex flex-col gap-0.5">
                  {DEV_NAV.map((item) => (
                    <NavButton key={item.path} item={item} activePath={activePath} />
                  ))}
                </div>
              </div>
            </m.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* Rail statis, selalu tampil */}
      <nav
        data-testid="sidebar-rail"
        aria-label="Bulan"
        className={cn(
          'theme-t no-print fixed inset-y-0 left-0 z-30 flex flex-col items-center',
          'border-r border-border-base bg-bg-sidebar',
        )}
        style={{ width: 'var(--sidebar-rail-width)' }}
      >
        <div
          className="flex shrink-0 items-center justify-center border-b border-border-base"
          style={{ height: 'var(--header-height)', width: '100%' }}
        >
          <button
            type="button"
            onClick={() => openDrawerAt(null)}
            aria-label="Buka sidebar"
            className="theme-t grid size-7 place-items-center bg-accent text-[13px] font-black text-accent-text"
          >
            L
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-2">
          {months.length === 0 ? (
            <PanelLeftOpen className="mt-2 size-4 text-text-dim" strokeWidth={1.75} />
          ) : null}
          {months.map((month) => (
            <Popover key={month.key}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Bulan ${month.label}`}
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
                  {month.weeks.map((week) => (
                    <li key={week.id} className="list-none">
                      <button
                        type="button"
                        onClick={() => pickWeek(month.key, week.id)}
                        className={cn(
                          'theme-t block w-full px-2 py-1.5 text-left text-[12px]',
                          week.id === activeWeekId
                            ? 'bg-bg-card text-text-primary'
                            : 'text-text-dim hover:bg-bg-card hover:text-text-primary',
                        )}
                      >
                        <span className="font-semibold">M{week.weekOfMonth}</span>
                        <span className="ml-2 text-[11px]">{formatWeekRange(week.startDate)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </nav>
    </>
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
