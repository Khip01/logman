import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { buildMonthGroups } from '../src/lib/domain/calendar'
import { dayNameId, formatTanggalTanpaHari, monthLabel } from '../src/lib/domain/date'
import { displayJam, effectiveStatus, JAM_STRIP } from '../src/lib/domain/editor'
import { PAGE_MARGIN_CM, paperSizeCss } from '../src/lib/domain/paper'
import { type ResolvedNama, resolveNamaMinggu } from '../src/lib/domain/pembimbing'
import type { AppConfig, DayEntry, LogData, WeekEntry } from '../src/lib/domain/types'

const here = dirname(fileURLToPath(import.meta.url))
const LETTERHEAD_PATH = join(here, '..', 'public', 'letterhead-polinema.png')

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderLetterhead(): string {
  return `
    <div class="letterhead">
      <img src="LETTERHEAD_SRC" alt="Logo Polinema" class="logo" />
      <div class="kop-text">
        <p class="kop-line kop-bold">KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</p>
        <p class="kop-line kop-bold">POLITEKNIK NEGERI MALANG</p>
        <p class="kop-line kop-bold">JURUSAN TEKNOLOGI INFORMASI</p>
        <p class="kop-line">Jalan Soekarno Hatta Nomor 9, Jatimulyo, Lowokwaru, Malang 65141</p>
        <p class="kop-line">Telepon (0341) 404424, 404425, Faksimile (0341) 404420</p>
        <p class="kop-line">Laman www.polinema.ac.id</p>
      </div>
    </div>
  `
}

function renderIdentity(config: AppConfig): string {
  return `
    <table class="identity-table">
      <tr><td class="id-label">Nama</td><td class="id-colon">:</td><td>${escapeHtml(config.profil.nama)}</td></tr>
      <tr><td class="id-label">NIM</td><td class="id-colon">:</td><td>${escapeHtml(config.profil.nim)}</td></tr>
      <tr><td class="id-label">Program Studi</td><td class="id-colon">:</td><td>${escapeHtml(config.profil.programStudi)}</td></tr>
      <tr><td class="id-label">Nama Mitra Industri</td><td class="id-colon">:</td><td>${escapeHtml(config.profil.mitraIndustri)}</td></tr>
    </table>
  `
}

function renderWeekTable(
  week: WeekEntry,
  days: Record<string, DayEntry>,
  jamDefault: AppConfig['jamDefault'],
): string {
  let rows = ''
  for (const emptyDay of week.days) {
    const saved = days[emptyDay.date] ?? emptyDay
    const status = effectiveStatus(saved)
    const strip = status === 'sakit' || status === 'izin'
    const hari = dayNameId(emptyDay.date)
    const tanggal = formatTanggalTanpaHari(emptyDay.date)
    const dowKey = hari.toLowerCase() as keyof typeof jamDefault
    const def = jamDefault[dowKey] ?? { masuk: '08.00', pulang: '16.00' }
    const masuk = strip ? JAM_STRIP : displayJam(saved.masuk, def.masuk)
    const pulang = strip ? JAM_STRIP : displayJam(saved.pulang, def.pulang)
    const kegiatan = escapeHtml(saved.kegiatan || saved.alasan || '')

    rows += `
      <tr>
        <td class="cell-hari">${hari}<br/><span class="tanggal">${tanggal}</span></td>
        <td class="cell-jam">${masuk}</td>
        <td class="cell-jam">${pulang}</td>
        <td class="cell-kegiatan"><div class="kegiatan-wrap">${kegiatan.replace(/\n/g, '<br/>')}</div></td>
      </tr>
    `
  }
  return `
    <table class="doc-table">
      <thead>
        <tr>
          <th>Hari, Tanggal</th>
          <th>Jam Masuk</th>
          <th>Jam Pulang</th>
          <th>Kegiatan</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function renderSignatureBlock(names: ResolvedNama): string {
  const label = (nama: string) => `(${escapeHtml(nama) || '...........................'})`
  return `
    <div class="signature-block">
      <div class="sig-student">
        <p>Mahasiswa,</p>
        <div class="sig-space"></div>
        <p>${label(names.mahasiswa)}</p>
      </div>
      <div class="sig-know">
        <p>Mengetahui,</p>
        <div class="sig-columns">
          <div class="sig-col">
            <p>Dosen Pembimbing,</p>
            <div class="sig-space"></div>
            <p>${label(names.dosen)}</p>
          </div>
          <div class="sig-col">
            <p>Pembimbing Lapangan,</p>
            <div class="sig-space"></div>
            <p>${label(names.pembimbing)}</p>
          </div>
        </div>
      </div>
    </div>
  `
}

function letterheadDataUri(): string {
  const buf = readFileSync(LETTERHEAD_PATH)
  return `data:image/png;base64,${buf.toString('base64')}`
}

export interface ExportOptions {
  config: AppConfig
  logs: LogData
  /** Kunci bulan YYYY-MM yang diekspor. */
  monthKey: string
  /** Path absolut atau relatif tempat PDF disimpan. */
  outputPath: string
}

/**
 * Membangun HTML dokumen ekspor untuk satu bulan. Murni dan dapat diuji tanpa browser.
 *
 * Engine dokumen: HTML + CSS @page. Preview di browser adalah dokumen itu sendiri
 * (AGENTS.md bagian 12). Satu halaman = satu minggu. Page break per minggu.
 * Letterhead tampil di setiap halaman.
 */
export function buildExportHtml(options: {
  config: AppConfig
  logs: LogData
  monthKey: string
  letterheadUri: string
}): string {
  const { config, logs, monthKey, letterheadUri } = options
  const mulai = config.magang.mulai
  const selesai = config.magang.selesai
  if (!mulai || !selesai) throw new Error('Rentang magang belum diatur.')

  const months = buildMonthGroups(mulai, selesai)
  const month = months.find((m) => m.key === monthKey)
  if (!month) throw new Error(`Bulan ${monthKey} tidak ditemukan dalam rentang magang.`)

  const pageSize = paperSizeCss(config.ukuranKertas)

  const lastWeek = month.weeks[month.weeks.length - 1]
  const signatureNames = resolveNamaMinggu(
    lastWeek ? logs.namaPenandaTangan[lastWeek.id] : undefined,
    {
      mahasiswa: config.profil.nama,
      dosen: config.dosenPembimbing,
      pembimbing: config.pembimbingLapanganDefault ?? '',
    },
  )

  let pagesHtml = ''
  for (let i = 0; i < month.weeks.length; i++) {
    const week = month.weeks[i]
    if (!week) continue
    const isLast = i === month.weeks.length - 1
    pagesHtml += `
      <div class="print-page">
        ${renderLetterhead().replace('LETTERHEAD_SRC', letterheadUri)}
        <h1 class="doc-title">LOG BOOK MAGANG</h1>
        <h2 class="doc-subtitle">${escapeHtml(month.label)} - Minggu ${week.weekOfMonth}</h2>
        ${i === 0 ? renderIdentity(config) : ''}
        ${renderWeekTable(week, logs.days, config.jamDefault)}
        ${isLast ? renderSignatureBlock(signatureNames) : ''}
      </div>
    `
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<style>
  @page { size: ${pageSize}; margin: ${PAGE_MARGIN_CM}cm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 0;
  }
  .print-page {
    break-after: page;
    page-break-after: always;
    width: 100%;
  }
  .print-page:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  .letterhead {
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    margin-bottom: 16px;
  }
  .letterhead .logo { height: 60px; width: auto; }
  .kop-text { flex: 1; text-align: center; }
  .kop-line { margin: 0; font-size: 10pt; line-height: 1.3; }
  .kop-bold { font-weight: bold; font-size: 11pt; }
  .doc-title { text-align: center; font-size: 14pt; font-weight: bold; margin: 12px 0 4px; }
  .doc-subtitle { text-align: center; font-size: 12pt; font-weight: normal; margin: 0 0 12px; }
  .identity-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12pt; }
  .identity-table td { padding: 2px 0; vertical-align: top; }
  .id-label { width: 160px; }
  .id-colon { width: 12px; }
  .doc-table { width: 100%; border-collapse: collapse; font-size: 12pt; }
  .doc-table th, .doc-table td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
  .doc-table thead th { background: #D0CECE; text-align: center; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc-table tbody tr { min-height: 1.8cm; }
  .doc-table tbody td { height: 1.8cm; }
  .cell-hari { white-space: nowrap; width: 1%; }
  .cell-hari .tanggal { font-size: 10pt; color: #333; }
  .cell-jam { text-align: center; white-space: nowrap; width: 1%; }
  .cell-kegiatan { width: auto; }
  .kegiatan-wrap { white-space: pre-wrap; word-break: break-word; min-height: 1.6cm; }
  .signature-block { margin-top: 32px; font-size: 12pt; }
  .sig-know { text-align: left; }
  .sig-columns { display: flex; justify-content: space-between; margin-top: 8px; }
  .sig-col { width: 45%; text-align: center; }
  .sig-student { text-align: center; width: 45%; margin-left: auto; margin-right: auto; margin-bottom: 24px; }
  .sig-space { height: 60px; }
</style>
</head>
<body>
${pagesHtml}
</body>
</html>`
}

/**
 * Mengekspor satu bulan ke PDF (AGENTS.md bagian 12).
 *
 * Engine dokumen: HTML + CSS @page. Playwright di sisi server merender HTML ini dengan
 * printBackground dan -webkit-print-color-adjust: exact agar shading header ikut tercetak.
 * Margin dan ukuran kertas diambil dari aturan @page, sehingga preview HTML dan PDF
 * memakai tata letak yang sama.
 */
export async function exportMonthToPdf(options: ExportOptions): Promise<void> {
  const { config, logs, monthKey, outputPath } = options

  const html = buildExportHtml({
    config,
    logs,
    monthKey,
    letterheadUri: letterheadDataUri(),
  })

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const dir = dirname(outputPath)
    mkdirSync(dir, { recursive: true })
    await page.pdf({
      path: outputPath,
      printBackground: true,
      preferCSSPageSize: true,
    })
  } finally {
    await browser.close()
  }
}

/** Membuat nama file PDF sesuai pola AGENTS.md bagian 12. */
export function buildExportFileName(nim: string, monthKey: string): string {
  const label = monthLabel(monthKey).replace(' ', '-')
  const safeNim = nim.trim() || 'NIM'
  return `LogBook_${safeNim}_${label}.pdf`
}
