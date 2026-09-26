import { X } from 'lucide-react'
import { m } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { TimePicker } from '@/components/ui/TimePicker'
import { alasanLabels } from '@/lib/domain/alasan'
import {
  displayJam,
  displayJamLuarBulan,
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
import { RichTextView } from './RichTextView'

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
  /** Nama hari sesuai bahasa dokumen, misal "Senin" atau "Monday". */
  hariLabel: string
  /** Tanggal lengkap sesuai bahasa dokumen, misal "21 September 2026". */
  tanggalLabel: string
  /** Benar bila baris tidak dapat diisi (bulan lain atau di luar rentang). */
  disabled: boolean
  /**
   * Kalimat alasan baris ini tidak relevan, sudah diterjemahkan ke bahasa dokumen.
   *
   * Dipakai untuk mengisi sel kegiatan yang kosong supaya pembaca dokumen tahu kenapa
   * jamnya strip. Kalau sel kegiatan sudah terisi, kalimat ini TIDAK ditampilkan agar
   * data user tidak tertutup (AGENTS.md bagian 11.9).
   */
  alasanLuarBulan: string
  /** Jam default untuk nama hari ini, dipakai sebagai placeholder. */
  jamDefault: { masuk: string; pulang: string }
}

export function EditorRow({
  date,
  hariLabel,
  tanggalLabel,
  disabled,
  alasanLuarBulan,
  jamDefault,
}: EditorRowProps) {
  const t = useT()
  // Penghitung render harness (AGENTS.md bagian 13). No-op pada build produksi.
  bumpRender(date)
  // Selector per tanggal: baris lain tidak ikut ter-render saat tanggal ini berubah.
  const stored = useLogsStore((s) => s.data.days[date])
  const setDay = useLogsStore((s) => s.setDay)
  const alasanOptions = useConfigStore((s) => s.config.alasan)
  // Label saja yang dibutuhkan dropdown. Turunannya dihitung ulang hanya saat daftar
  // alasan berubah, bukan tiap ketikan.
  const labelsAlasan = useMemo(() => alasanLabels(alasanOptions), [alasanOptions])
  const formatJam = useConfigStore((s) => s.config.formatJam)

  // Kilatan dan fokus dari banner validasi (AGENTS.md bagian 11.3).
  const focusRequest = useLogbookStore((s) => s.focusRequest)
  const clearFocus = useLogbookStore((s) => s.clearFocus)
  const motionTier = useUiStore((s) => s.motion)

  const day = stored ?? emptyDay(date)
  // Strip memakai daftar alasan dari config, sehingga alasan kustom bisa ikut strip.
  const strip = showsJamStrip(day, alasanOptions)
  const adaAlasan = Boolean(day.alasan && !day.kegiatan)

  const isFocusTarget = !disabled && focusRequest?.date === date
  const flashProfile = MOTION_TIER_PROFILE[motionTier]
  const flashVariants = buildRowFlashVariants(flashProfile)
  const flashMs = rowFlashDurationSeconds(flashProfile) * 1000
  const rowRef = useRef<HTMLTableRowElement>(null)
  const focusToken = isFocusTarget ? focusRequest.token : undefined

  /*
   * Mode baca atau mode edit kolom Kegiatan (AGENTS.md bagian 11.6). Saat sel tidak difokus,
   * yang tampil adalah hasil formatnya; saat difokus, teks dengan penandanya. Status ini
   * hanya dipakai untuk memberi tanda pada DOM; peralihan tampilannya sendiri dikerjakan
   * CSS lewat atribut `data-aktif`, supaya fokus dan blur tidak memicu render berlebih.
   */
  const [selAktif, setSelAktif] = useState(false)

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
            {day.kegiatan || day.alasan || alasanLuarBulan}
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
          <div
            data-kegiatan
            data-aktif={selAktif ? 'true' : 'false'}
            data-testid={`rich-${date}`}
            className="relative"
          >
            {/*
              Hasil format untuk mode baca. Selalu dirender (walau sedang diedit) supaya
              teks yang memakai penanda tidak pernah hilang dari DOM, dan supaya tidak ada
              pergeseran tinggi saat peralihan. Di mode edit ia disembunyikan CSS.
            */}
            <div className="rt-baca" aria-hidden={selAktif ? 'true' : undefined}>
              <RichTextView text={day.kegiatan} />
            </div>
            <AutoGrowTextarea
              aria-label={t('editor.kegiatanLabel', { hari: hariLabel, tanggal: tanggalLabel })}
              value={day.kegiatan}
              placeholder={t('editor.ketikKegiatan')}
              focusToken={focusToken}
              onFocusChange={setSelAktif}
              className="rt-teks"
              onChange={(kegiatan) => setDay(date, patchKegiatan(kegiatan))}
            />
            {day.kegiatan.trim() === '' ? (
              <div className="mt-1">
                <ReasonPicker
                  options={labelsAlasan}
                  onCommit={(alasan) => setDay(date, patchAlasan(alasan))}
                />
              </div>
            ) : null}
          </div>
        )}
      </td>
    </tr>
  )
}

/**
 * Sel jam dengan format mengikuti setelan Pengaturan (24 atau 12 jam).
 *
 * Pengetikan dan pemilihan lewat `TimePicker`, yang menormalkan ke 24 jam format titik
 * sebelum dikomit. Untuk alasan yang ditandai strip, jam ditampilkan sebagai strip dan tidak
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
        {/* Layar: nilai tersimpan saja. Cetak: baris luar bulan memakai strip, bukan
            jam default, sama seperti PDF (AGENTS.md bagian 11.9). */}
        <span className="text-[12px] text-text-muted print:hidden">
          {strip ? JAM_STRIP : (value ?? '')}
        </span>
        <span className="hidden text-[12px] text-doc-ink print:inline">
          {strip ? JAM_STRIP : displayJamLuarBulan(value)}
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
