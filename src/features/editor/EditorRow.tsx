import { X } from 'lucide-react'
import { m } from 'motion/react'
import { useEffect, useRef } from 'react'
import { TimePicker } from '@/components/ui/TimePicker'
import {
  displayJam,
  JAM_STRIP,
  patchAlasan,
  patchKegiatan,
  showsJamStrip,
} from '@/lib/domain/editor'
import type { JamFormat } from '@/lib/domain/jamFormat'
import type { DayEntry } from '@/lib/domain/types'
import { useT } from '@/lib/i18n'
import { bumpRender } from '@/lib/utils/perf'
import { buildRowFlashVariants, rowFlashDurationSeconds } from '@/motion/presets'
import { MOTION_TIER_PROFILE } from '@/motion/tiers'
import { useConfigStore } from '@/stores/config'
import { useLogbookStore } from '@/stores/logbook'
import { useLogsStore } from '@/stores/logs'
import { useUiStore } from '@/stores/ui'
import { AutoGrowTextarea } from './AutoGrowTextarea'
import { ReasonPicker } from './ReasonPicker'

/**
 * Satu baris hari pada tabel editor (AGENTS.md bagian 11.2 dan 11.3).
 *
 * PENTING (performa, AGENTS.md bagian 13): baris ini membaca datanya SENDIRI dari store
 * lewat selector per tanggal, bukan menerima entri hari sebagai prop. Dengan begitu satu
 * ketikan hanya me-render ulang baris yang bersangkutan, bukan seluruh tabel.
 *
 * Urutan tampilan pada kolom Kegiatan:
 * - Hari berisi kegiatan: textarea yang tumbuh mengikuti isi.
 * - Hari masih kosong: textarea plus pemilih alasan di bawahnya.
 * - Hari berisi alasan: alasan ditampilkan sebagai teks dokumen dengan tombol hapus.
 */

/** Hari kosong dipakai saat sebuah tanggal belum punya entri tersimpan. */
function emptyDay(date: string): DayEntry {
  return { date, masuk: null, pulang: null, kegiatan: '', alasan: null, status: 'kosong' }
}

export interface EditorRowProps {
  /** Tanggal ISO baris ini. Identitas baris. */
  date: string
  /** Nama hari bahasa Indonesia, misal "Senin". */
  hariLabel: string
  /** Tanggal lengkap bahasa Indonesia, misal "21 September 2026". */
  tanggalLabel: string
  /** Benar bila baris tidak dapat diisi (bulan lain atau di luar rentang). */
  disabled: boolean
  /** Jam default untuk nama hari ini, dipakai sebagai placeholder. */
  jamDefault: { masuk: string; pulang: string }
}

export function EditorRow({ date, hariLabel, tanggalLabel, disabled, jamDefault }: EditorRowProps) {
  const t = useT()
  // Penghitung render harness (AGENTS.md bagian 13). No-op pada build produksi.
  bumpRender(date)
  // Selector per tanggal: baris lain tidak ikut ter-render saat tanggal ini berubah.
  const stored = useLogsStore((s) => s.data.days[date])
  const setDay = useLogsStore((s) => s.setDay)
  const alasanOptions = useConfigStore((s) => s.config.alasan)
  const formatJam = useConfigStore((s) => s.config.formatJam)

  // Kilatan dan fokus dari banner validasi (AGENTS.md bagian 11.3).
  const focusRequest = useLogbookStore((s) => s.focusRequest)
  const clearFocus = useLogbookStore((s) => s.clearFocus)
  const motionTier = useUiStore((s) => s.motion)

  const day = stored ?? emptyDay(date)
  const strip = showsJamStrip(day)
  const adaAlasan = Boolean(day.alasan && !day.kegiatan)

  const isFocusTarget = !disabled && focusRequest?.date === date
  const flashProfile = MOTION_TIER_PROFILE[motionTier]
  const flashVariants = buildRowFlashVariants(flashProfile)
  const flashMs = rowFlashDurationSeconds(flashProfile) * 1000
  const rowRef = useRef<HTMLTableRowElement>(null)
  const focusToken = isFocusTarget ? focusRequest.token : undefined

  /*
   * Menggeser baris tujuan ke tengah layar begitu user menekan hari di banner, lalu
   * membersihkan permintaan fokus setelah kilatan selesai. Pembersihan penting supaya
   * baris tidak ikut terfokus lagi saat user berpindah minggu dan kembali.
   *
   * Gerak halus hanya dipakai pada tier yang mengizinkan gerakan sekunder; tier `minimal`
   * dan `mati` melompat langsung (AGENTS.md bagian 8.1).
   */
  useEffect(() => {
    if (!isFocusTarget || !focusRequest) return
    rowRef.current?.scrollIntoView({
      block: 'center',
      behavior: flashProfile.secondaryMotion ? 'smooth' : 'auto',
    })
    const token = focusRequest.token
    const timer = window.setTimeout(() => {
      // Hanya bersihkan bila permintaan ini belum digantikan permintaan lain.
      if (useLogbookStore.getState().focusRequest?.token === token) clearFocus()
    }, flashMs + 50)
    return () => window.clearTimeout(timer)
  }, [isFocusTarget, focusRequest, flashProfile.secondaryMotion, flashMs, clearFocus])

  function commitJam(field: 'masuk' | 'pulang', normalized: string) {
    setDay(date, { [field]: normalized === '' ? null : normalized })
  }

  return (
    <tr
      ref={rowRef}
      data-testid={`editor-row-${date}`}
      data-disabled={disabled ? 'true' : 'false'}
      data-flash={isFocusTarget ? 'true' : 'false'}
      className="relative"
    >
      <th scope="row" className="doc-cell-fit px-2 py-1.5 text-left font-normal">
        {/*
          Lapisan kilatan. Ditaruh di dalam sel pertama (bukan langsung di dalam <tr>,
          karena <tr> hanya boleh berisi sel). Karena <tr> memakai `position: relative`,
          `inset-0` di sini mencakup seluruh baris.
          HANYA opacity yang dianimasikan (AGENTS.md bagian 8.2). `key` memakai token
          supaya klik berulang pada hari yang sama memutar ulang animasinya.
        */}
        {isFocusTarget && flashProfile.flashWaves > 0 ? (
          <>
            <m.span
              key={`tint-${focusRequest.token}`}
              aria-hidden
              variants={flashVariants}
              initial="rest"
              animate="flash"
              className="pointer-events-none absolute inset-0 bg-accent-bg"
            />
            <m.span
              key={`line-${focusRequest.token}`}
              aria-hidden
              variants={flashVariants}
              initial="rest"
              animate="flash"
              className="pointer-events-none absolute inset-0 border-2 border-accent-bg"
            />
          </>
        ) : null}
        <span className="block text-[12px] text-text-main print:text-doc-ink">{hariLabel}</span>
        <span className="block text-[11px] text-text-muted print:text-doc-muted">
          {tanggalLabel}
        </span>
      </th>

      <JamCell
        field="masuk"
        ariaLabel={t('editor.jamMasukLabel', { hari: hariLabel, tanggal: tanggalLabel })}
        value={day.masuk}
        placeholder={jamDefault.masuk}
        format={formatJam}
        strip={strip}
        disabled={disabled}
        onCommit={commitJam}
      />

      <JamCell
        field="pulang"
        ariaLabel={t('editor.jamPulangLabel', { hari: hariLabel, tanggal: tanggalLabel })}
        value={day.pulang}
        placeholder={jamDefault.pulang}
        format={formatJam}
        strip={strip}
        disabled={disabled}
        onCommit={commitJam}
      />
      <td className="doc-cell-wrap px-2 py-1.5">
        {disabled ? (
          <p className="text-[12px] text-text-muted print:text-doc-ink">
            {day.kegiatan || day.alasan || ''}
          </p>
        ) : adaAlasan ? (
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12px] text-text-main print:text-doc-ink">{day.alasan}</p>
            <button
              type="button"
              aria-label={t('editor.hapusAlasan', { tanggal: tanggalLabel })}
              onClick={() => setDay(date, patchAlasan(''))}
              className="mt-0.5 grid size-5 shrink-0 place-items-center text-text-muted no-print hover:text-text-primary"
            >
              <X className="size-3.5" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <>
            <AutoGrowTextarea
              aria-label={t('editor.kegiatanLabel', { hari: hariLabel, tanggal: tanggalLabel })}
              value={day.kegiatan}
              placeholder={t('editor.ketikKegiatan')}
              focusToken={focusToken}
              onChange={(kegiatan) => setDay(date, patchKegiatan(kegiatan))}
            />
            {day.kegiatan.trim() === '' ? (
              <div className="mt-1">
                <ReasonPicker
                  options={alasanOptions}
                  onCommit={(alasan) => setDay(date, patchAlasan(alasan))}
                />
              </div>
            ) : null}
          </>
        )}
      </td>
    </tr>
  )
}

/**
 * Sel jam dengan format mengikuti setelan Pengaturan (24 atau 12 jam).
 *
 * Pengetikan dan pemilihan lewat `TimePicker`, yang menormalkan ke 24 jam format titik
 * sebelum dikomit. Untuk status Sakit dan Izin, jam ditampilkan sebagai strip dan tidak
 * dapat diisi (AGENTS.md bagian 11.3).
 */
function JamCell({
  field,
  ariaLabel,
  value,
  placeholder,
  format,
  strip,
  disabled,
  onCommit,
}: {
  field: 'masuk' | 'pulang'
  ariaLabel: string
  value: string | null
  placeholder: string
  format: JamFormat
  strip: boolean
  disabled: boolean
  onCommit: (field: 'masuk' | 'pulang', normalized: string) => void
}) {
  if (disabled) {
    return (
      <td className="doc-cell-fit px-2 py-1.5 text-center">
        {/* Layar: nilai tersimpan saja. Cetak: fallback ke jam default, sama seperti PDF. */}
        <span className="text-[12px] text-text-muted print:hidden">
          {strip ? JAM_STRIP : (value ?? '')}
        </span>
        <span className="hidden text-[12px] text-doc-ink print:inline">
          {strip ? JAM_STRIP : displayJam(value, placeholder)}
        </span>
      </td>
    )
  }

  if (strip) {
    return (
      <td className="doc-cell-fit px-2 py-1.5 text-center">
        <span className="text-[12px] text-text-main print:text-doc-ink">{JAM_STRIP}</span>
      </td>
    )
  }

  return (
    <td className="doc-cell-fit px-2 py-1.5 text-center">
      <TimePicker
        variant="cell"
        value={value ?? ''}
        placeholder={placeholder}
        format={format}
        label={ariaLabel}
        onChange={(next) => onCommit(field, next)}
      />
      {/* Placeholder tidak ikut tercetak, jadi sediakan teks jam untuk mode cetak. */}
      <span className="hidden text-[12px] text-doc-ink print:inline">
        {displayJam(value, placeholder)}
      </span>
    </td>
  )
}
