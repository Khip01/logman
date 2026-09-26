import type { LucideIcon } from 'lucide-react'
import {
  CalendarOff,
  Clock,
  FileText,
  Languages,
  ListChecks,
  Palette,
  PenLine,
  Search,
  Sparkles,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/Input'
import {
  type SettingsSearchResult,
  type SettingsSectionIcon,
  searchSettings,
} from '@/lib/domain/settingsSearch'
import { useLocale, useT } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { useSettingsJump } from './SettingsFlash'

/**
 * Pencarian menu Pengaturan (AGENTS.md bagian 22).
 *
 * Dua lapis hasil, persis seperti yang diminta:
 * 1. Lapis judul, misal "jam" menemukan "Jam Default". Barisnya menampilkan ikon dan
 *    nama menunya saja.
 * 2. Lapis konten, misal "PDF" menemukan deskripsi font dokumen. Barisnya menampilkan
 *    ikon, nama menu, lalu potongan teks yang memuat kata itu, sehingga user tahu kenapa
 *    hasilnya muncul.
 *
 * Saran teratas SELALU otomatis terpilih, jadi menekan Enter langsung memakai saran itu
 * tanpa perlu menekan panah dulu. Memilih saran menggulir ke menunya sambil memberi
 * kilatan singkat (lihat `SettingsSection`).
 *
 * Aksesibilitas dan perilaku keyboard mengikuti pola `Combobox.tsx` yang sudah ada:
 * input `role="combobox"` dengan `aria-expanded`, `aria-controls`, dan
 * `aria-activedescendant`; daftar `role="listbox"`; tiap saran `role="option"`.
 *
 * Sengaja TIDAK memakai animasi Motion: dropdown muncul dan hilang seketika, jadi tidak
 * ada properti layout yang dianimasikan dan aturan bagian 8 tetap terjaga.
 */

/** Pemetaan nama ikon ke komponennya, sama dengan yang dipakai judul seksi. */
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

export function SettingsSearch() {
  const t = useT()
  const locale = useLocale()
  const jumpTo = useSettingsJump()

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const results = useMemo(() => searchSettings(query, locale), [query, locale])

  /*
   * Saran teratas selalu terpilih setiap hasil berubah. Dengan begitu Enter memakai
   * saran paling atas tanpa perlu navigasi panah, dan penyorotan ikut berpindah saat
   * user menambah huruf.
   *
   * Dipicu oleh query dan locale, BUKAN oleh array `results`, karena array itu identitas
   * barunya berubah setiap render walau isinya sama. Memakai query membuat efek ini hanya
   * berjalan saat hasil memang mungkin berubah.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: hasil ditentukan query dan locale
  useEffect(() => {
    setActiveIndex(0)
  }, [query, locale])

  // Menutup saat klik di luar, sama seperti perilaku Combobox.
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function pilih(result: SettingsSearchResult | undefined) {
    if (!result) return
    jumpTo(result.sectionId)
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (results.length === 0) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index) => (index + step + results.length) % results.length)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      pilih(results[activeIndex])
      return
    }

    if (event.key === 'Escape') {
      if (!open) return
      // Hanya menutup daftar saran; teks tetap ada supaya user bisa lanjut mengetik.
      event.preventDefault()
      setOpen(false)
    }
  }

  const adaHasil = results.length > 0

  return (
    <div ref={rootRef} data-testid="settings-search" className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-dim"
          strokeWidth={1.75}
          aria-hidden
        />
        <Input
          id="settings-search-input"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-label={t('settings.cari.label')}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && adaHasil ? `${listId}-${activeIndex}` : undefined}
          placeholder={t('settings.cari.placeholder')}
          value={query}
          className="pl-8 pr-8"
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {query !== '' ? (
          <button
            type="button"
            data-testid="settings-search-clear"
            aria-label={t('common.hapus')}
            onClick={() => {
              setQuery('')
              setOpen(true)
            }}
            className="theme-t absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center text-text-dim hover:text-text-primary"
          >
            <X className="size-3.5" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={t('settings.cari.label')}
          data-testid="settings-search-results"
          className="theme-t absolute inset-x-0 top-full z-50 mt-1 max-h-80 overflow-y-auto border border-border-base bg-bg-card p-1"
        >
          {adaHasil ? (
            results.map((result, index) => {
              const isActive = index === activeIndex
              return (
                // Memakai <button> agar elemen ber-role "option" tetap dapat difokus dan
                // diaktifkan lewat keyboard. Saran tidak masuk urutan Tab (fokus dikelola
                // input combobox lewat aria-activedescendant), jadi tombolnya diberi
                // tabIndex -1.
                <button
                  key={result.key}
                  type="button"
                  tabIndex={-1}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isActive}
                  data-testid={`settings-suggestion-${result.sectionId}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pilih(result)}
                  className={cn(
                    'theme-t flex w-full cursor-pointer items-start gap-2 px-2 py-1.5 text-left text-[13px]',
                    isActive ? 'bg-bg-card-hover' : '',
                  )}
                >
                  <ResultIcon icon={result.icon} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-text-primary">
                      {result.kind === 'title' ? (
                        <Highlight text={result.sectionTitle} match={result.match} />
                      ) : (
                        <span className="font-semibold">{result.sectionTitle}:</span>
                      )}
                    </span>
                    {result.kind === 'content' ? (
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-text-muted">
                        <Highlight text={result.snippet} match={result.match} />
                      </span>
                    ) : null}
                  </span>
                </button>
              )
            })
          ) : (
            <p className="px-2 py-1.5 text-[13px] text-text-dim">{t('settings.cari.kosong')}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}

/** Ikon saran. Diberi warna redup agar teks tetap jadi fokus utama. */
function ResultIcon({ icon }: { icon: SettingsSectionIcon }) {
  const Icon = ICONS[icon]
  return <Icon className="mt-0.5 size-3.5 shrink-0 text-text-dim" strokeWidth={1.75} aria-hidden />
}

/**
 * Menyorot kata yang dicocokkan.
 *
 * Memakai token aksen tema (`bg-accent` + `text-accent-text`), jadi sorotannya selalu
 * berkontras di kesembilan tema tanpa warna keras baru. Ini bukan animasi: hanya warna
 * statis pada elemen, sehingga aturan bagian 8 tidak tersentuh.
 */
function Highlight({ text, match }: { text: string; match: { start: number; length: number } }) {
  if (match.length === 0) return <>{text}</>

  const before = text.slice(0, match.start)
  const middle = text.slice(match.start, match.start + match.length)
  const after = text.slice(match.start + match.length)

  return (
    <>
      {before}
      <mark data-testid="settings-search-mark" className="bg-accent text-accent-text">
        {middle}
      </mark>
      {after}
    </>
  )
}
