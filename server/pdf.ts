import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import {
  buildMonthGroups,
  type DisabledReason,
  disabledReasonFor,
  disabledReasonText,
  type MagangRange,
} from '../src/lib/domain/calendar'
import { dayNameId, formatTanggalTanpaHari, monthLabel } from '../src/lib/domain/date'
import { FONT_DOKUMEN_STACK } from '../src/lib/domain/dokumen'
import { displayJam, displayJamLuarBulan, JAM_STRIP, showsJamStrip } from '../src/lib/domain/editor'
import { PAGE_MARGIN_CM, paperSizeCss } from '../src/lib/domain/paper'
import { type ResolvedNama, resolveNamaMinggu } from '../src/lib/domain/pembimbing'
import { escapeHtml, richTextToHtml } from '../src/lib/domain/richTextHtml'
import type {
  AppConfig,
  DayEntry,
  HariLuarBulan,
  LogData,
  WeekEntry,
} from '../src/lib/domain/types'
import { DEFAULT_LOCALE, isLocale, type Locale } from '../src/lib/i18n/locale'
import type { MessageKey } from '../src/lib/i18n/messages/id'
import { translate } from '../src/lib/i18n/translate'

const here = dirname(fileURLToPath(import.meta.url))
const LETTERHEAD_PATH = join(here, '..', 'public', 'letterhead-polinema.png')

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

function renderIdentity(config: AppConfig, locale: Locale): string {
  const baris: Array<[string, string]> = [
    ['logbook.nama', config.profil.nama],
    ['logbook.nim', config.profil.nim],
    ['settings.programStudi', config.profil.programStudi],
    ['settings.mitraIndustri', config.profil.mitraIndustri],
  ]
  return `
    <table class="identity-table">
      ${baris
        .map(
          ([key, nilai]) =>
            `<tr><td class="id-label">${escapeHtml(translate(locale, key as MessageKey))}</td><td class="id-colon">:</td><td>${escapeHtml(nilai)}</td></tr>`,
        )
        .join('\n      ')}
    </table>
  `
}

interface WeekTableOptions {
  /** Kunci bulan halaman ini, format `YYYY-MM`. */
  monthKey: string
  /** Rentang magang, dipakai untuk membedakan bulan lain dan di luar rentang. */
  range: MagangRange
  /** Perlakuan baris yang tidak relevan terhadap bulan halaman. */
  hariLuarBulan: HariLuarBulan
  /** Bahasa isi dokumen. Kop surat dan judul dokumen tetap bahasa Indonesia. */
  locale: Locale
}

function renderWeekTable(
  week: WeekEntry,
  days: Record<string, DayEntry>,
  jamDefault: AppConfig['jamDefault'],
  alasan: AppConfig['alasan'],
  options: WeekTableOptions,
): string {
  const { monthKey, range, hariLuarBulan, locale } = options
  let rows = ''
  for (const emptyDay of week.days) {
    const saved = days[emptyDay.date] ?? emptyDay
    /*
     * Baris yang tidak relevan terhadap bulan halaman. Perlakuan-nya sama untuk
     * 'bulan-lain', 'sebelum-magang', dan 'setelah-magang', karena ketiganya kondisi
     * visual yang sama, yaitu hari ini tidak milik halaman ini.
     */
    const alasanDisabled = disabledReasonFor(saved.date, monthKey, range)
    const luarBulan = alasanDisabled !== null
    // Menghapus baris tidak pernah menghilangkan data: minggu lintas bulan ikut masuk
    // ke grup bulan sebelumnya, jadi baris yang sama masih tercetak di halaman itu.
    if (luarBulan && hariLuarBulan === 'hapus') continue

    // Strip memakai helper yang SAMA dengan layar, jadi PDF tidak pernah berbeda dari
    // yang dilihat user. Aturan lama yang hardcode 'sakit' dan 'izin' sudah diganti
    // tanda `stripJam` milik alasannya (AGENTS.md bagian 11.8).
    const strip = showsJamStrip(saved, alasan)
    const hari = dayNameId(emptyDay.date, locale)
    const tanggal = formatTanggalTanpaHari(emptyDay.date, locale)
    /*
     * Kunci jam default HARUS diturunkan dari nama hari berbahasa Indonesia, bukan dari
     * `hari` yang ditampilkan. Kalau nama hari ikut bahasa dokumen, hasilnya "monday"
     * yang tidak ada di `jamDefault`, lalu `jamDefault[dowKey]` undefined dan baris ini
     * diam-diam jatuh ke 08.00/16.00 yang di-hardcode, tanpa error. Pola yang sama
     * dipakai `dayNameKey` di WeekEditorTable.tsx.
     */
    const dowKey = dayNameId(emptyDay.date, DEFAULT_LOCALE).toLowerCase() as keyof typeof jamDefault
    const def = jamDefault[dowKey] ?? { masuk: '08.00', pulang: '16.00' }
    // Baris luar bulan tidak memakai jam default, karena itu tebakan yang membuat
    // baris kosong terlihat terisi (AGENTS.md bagian 11.9).
    const jamMasuk = luarBulan
      ? displayJamLuarBulan(saved.masuk)
      : displayJam(saved.masuk, def.masuk)
    const jamPulang = luarBulan
      ? displayJamLuarBulan(saved.pulang)
      : displayJam(saved.pulang, def.pulang)
    const masuk = strip ? JAM_STRIP : jamMasuk
    const pulang = strip ? JAM_STRIP : jamPulang
    // Format teks (tebal, miring, judul) memakai parser yang SAMA dengan layar, sehingga
    // PDF tidak pernah berbeda dari yang dilihat user (AGENTS.md bagian 11.6).
    const isi = saved.kegiatan || saved.alasan || ''
    /*
     * Baris luar bulan yang kosong diberi kalimat alasan, supaya pembaca dokumen tahu
     * kenapa jamnya strip dan sel kegiatan kosong. Kalau baris itu sudah diisi user,
     * isi user yang ditampilkan dan alasannya disembunyikan: data asli tidak boleh
     * tertutup oleh kalimat.
     */
    const kegiatan =
      luarBulan && isi === ''
        ? `<span class="alasan-luar-bulan">${escapeHtml(disabledReasonText(alasanDisabled as DisabledReason, locale))}</span>`
        : richTextToHtml(isi)

    const kelas = luarBulan ? ' class="row-bulan-lain"' : ''
    rows += `
      <tr${kelas}>
        <td class="cell-hari">${hari}<br/><span class="tanggal">${tanggal}</span></td>
        <td class="cell-jam">${masuk}</td>
        <td class="cell-jam">${pulang}</td>
        <td class="cell-kegiatan"><div class="kegiatan-wrap">${kegiatan}</div></td>
      </tr>
    `
  }
  return `
    <table class="doc-table">
      <thead>
        <tr>
          <th>${escapeHtml(translate(locale, 'editor.hariTanggal'))}</th>
          <th>${escapeHtml(translate(locale, 'editor.jamMasuk'))}</th>
          <th>${escapeHtml(translate(locale, 'editor.jamPulang'))}</th>
          <th>${escapeHtml(translate(locale, 'editor.kegiatan'))}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function renderSignatureBlock(names: ResolvedNama, locale: Locale): string {
  const label = (nama: string) => `(${escapeHtml(nama) || '...........................'})`
  const ttd = (key: 'ttd.mahasiswa' | 'ttd.dosen' | 'ttd.pembimbing') =>
    `${escapeHtml(translate(locale, key))},`
  return `
    <div class="signature-block">
      <div class="sig-student">
        <p>${ttd('ttd.mahasiswa')}</p>
        <div class="sig-space"></div>
        <p>${label(names.mahasiswa)}</p>
      </div>
      <div class="sig-know">
        <p>${escapeHtml(translate(locale, 'ttd.mengetahui'))},</p>
        <div class="sig-columns">
          <div class="sig-col">
            <p>${ttd('ttd.dosen')}</p>
            <div class="sig-space"></div>
            <p>${label(names.dosen)}</p>
          </div>
          <div class="sig-col">
            <p>${ttd('ttd.pembimbing')}</p>
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

  /*
   * Bahasa isi dokumen. Nilai ini hanya mengubah isi surat, bukan kop surat dan judul
   * dokumen yang tetap bahasa Indonesia mengikuti identitas resmi kampus
   * (AGENTS.md bagian 21). Config lama tanpa key ini otomatis memakai `id`.
   */
  const locale: Locale = isLocale(config.bahasaDokumen) ? config.bahasaDokumen : DEFAULT_LOCALE

  // Hari kerja diteruskan supaya PDF punya baris yang sama persis dengan layar.
  const months = buildMonthGroups(mulai, selesai, locale, config.hariKerja)
  const month = months.find((m) => m.key === monthKey)
  if (!month) throw new Error(`Bulan ${monthKey} tidak ditemukan dalam rentang magang.`)

  const pageSize = paperSizeCss(config.ukuranKertas)
  const fontDokumen = FONT_DOKUMEN_STACK[config.fontDokumen]

  // Rentang magang diteruskan agar PDF bisa membedakan baris milik bulan lain, sebelum
  // magang, dan setelah magang (AGENTS.md bagian 11.9).
  const range: MagangRange = { mulai, selesai }
  const tableOptions: WeekTableOptions = {
    monthKey,
    range,
    hariLuarBulan: config.hariLuarBulan,
    locale,
  }

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
        <h2 class="doc-subtitle">${escapeHtml(month.label)} - ${escapeHtml(translate(locale, 'logbook.weekLabel'))} ${week.weekOfMonth}</h2>
        ${i === 0 ? renderIdentity(config, locale) : ''}
        ${renderWeekTable(week, logs.days, config.jamDefault, config.alasan, tableOptions)}
        ${isLast ? renderSignatureBlock(signatureNames, locale) : ''}
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
    font-family: ${fontDokumen};
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
  /*
   * Baris yang tidak relevan terhadap bulan halaman (AGENTS.md bagian 11.9).
   *
   * Miring adalah sinyal utama dan abu-abu hanya penguat, karena dokumen ini sering
   * difotokopi. Abu-abu terang bisa hilang di salinan, sedangkan miring selalu
   * terbaca di printer hitam-putih. Spesifisitas dinaikkan di atas '.doc-table td'
   * supaya warna border di bawah tidak menimpa aturan ini.
   */
  .doc-table tbody tr.row-bulan-lain > td {
    color: #666;
    font-style: italic;
    border-color: #a8a8a8;
  }
  .doc-table tbody tr.row-bulan-lain > td .tanggal { color: #666; }
  /*
   * Kalimat alasan pada baris luar bulan yang kosong. Warnanya sudah diwarisi dari
   * aturan baris di atas, jadi aturan ini hanya menjaga agar kalimat itu tidak ikut
   * tebal dan tidak mewarisi format judul dari parser rich text.
   * Sengaja TIDAK diberi warna sendiri, supaya tidak ada dua sumber kebenaran warna.
   */
  .kegiatan-wrap .alasan-luar-bulan { font-style: italic; }
  .cell-hari { white-space: nowrap; width: 1%; }
  .cell-hari .tanggal { font-size: 10pt; color: #333; }
  .cell-jam { text-align: center; white-space: nowrap; width: 1%; }
  .cell-kegiatan { width: auto; }
  .kegiatan-wrap { white-space: pre-wrap; word-break: break-word; min-height: 1.6cm; }
  /*
   * Format teks pada kolom Kegiatan (AGENTS.md bagian 11.6). Judul dibuat lebih tegas
   * tanpa mengubah tinggi baris, supaya jumlah halaman PDF tidak melonjak hanya karena
   * user memakai penanda judul.
   */
  .kegiatan-wrap .rt-judul { font-weight: 700; }
  .kegiatan-wrap .rt-judul-1 { font-size: 1.08em; }
  .kegiatan-wrap .rt-judul-2 { font-size: 1.03em; }
  .kegiatan-wrap .rt-judul-3 { font-size: 1em; }
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
