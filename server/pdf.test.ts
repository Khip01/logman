import { describe, expect, it } from 'vitest'
import { buildMonthGroups } from '../src/lib/domain/calendar'
import { parseConfig, parseLogData } from '../src/lib/domain/schema'
import type { AppConfig, LogData } from '../src/lib/domain/types'
import { buildExportFileName, buildExportHtml } from './pdf'

function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const { value } = parseConfig({
    ...overrides,
    profil: {
      nama: 'Akhmad Aakhif Athallah',
      nim: '2341760001',
      programStudi: 'D4 Teknik Informatika',
      mitraIndustri: 'PT Contoh Nusantara',
      ...(overrides.profil ?? {}),
    },
    magang: overrides.magang ?? { mulai: '2026-09-01', selesai: '2026-09-30' },
    ukuranKertas: overrides.ukuranKertas ?? 'A4',
  })
  return value
}

function makeLogs(overrides: Partial<LogData> = {}): LogData {
  const { value } = parseLogData({
    version: 1,
    updatedAt: new Date().toISOString(),
    days: {},
    ...overrides,
  })
  return value
}

describe('buildExportFileName', () => {
  it('memakai pola LogBook_<NIM>_<Bulan>-<Tahun>.pdf', () => {
    expect(buildExportFileName('2341760001', '2026-09')).toBe(
      'LogBook_2341760001_September-2026.pdf',
    )
  })

  it('memakai NIM placeholder bila kosong', () => {
    expect(buildExportFileName('  ', '2026-08')).toBe('LogBook_NIM_Agustus-2026.pdf')
  })
})

describe('buildExportHtml', () => {
  const letterheadUri = 'data:image/png;base64,dGVzdA=='

  it('melempar bila rentang magang belum diatur', () => {
    const config = makeConfig()
    config.magang = { mulai: null, selesai: null }
    expect(() =>
      buildExportHtml({ config, logs: makeLogs(), monthKey: '2026-09', letterheadUri }),
    ).toThrow('Rentang magang belum diatur')
  })

  it('melempar bila bulan di luar rentang', () => {
    expect(() =>
      buildExportHtml({
        config: makeConfig(),
        logs: makeLogs(),
        monthKey: '2026-12',
        letterheadUri,
      }),
    ).toThrow('tidak ditemukan')
  })

  it('menghasilkan kop, identitas, tabel, dan blok tanda tangan', () => {
    const html = buildExportHtml({
      config: makeConfig(),
      logs: makeLogs(),
      monthKey: '2026-09',
      letterheadUri,
    })

    expect(html).toContain('LOG BOOK MAGANG')
    expect(html).toContain('POLITEKNIK NEGERI MALANG')
    expect(html).toContain('Akhmad Aakhif Athallah')
    expect(html).toContain('2341760001')
    expect(html).toContain('Hari, Tanggal')
    expect(html).toContain('Jam Masuk')
    expect(html).toContain('Kegiatan')
    expect(html).toContain('Mengetahui,')
    expect(html).toContain(letterheadUri)
    expect(html).toContain('print-color-adjust: exact')
    expect(html).toContain('@page { size: A4; margin: 2.54cm; }')
    expect(html).toContain('page-break-after: always')
    // Tidak boleh memakai em dash (AGENTS.md bagian 0). U+2014.
    expect(html).not.toContain('&mdash;')
    expect(html).not.toContain('\u2014')
  })

  it('satu halaman per minggu', () => {
    const html = buildExportHtml({
      config: makeConfig(),
      logs: makeLogs(),
      monthKey: '2026-09',
      letterheadUri,
    })
    const pages = html.match(/class="print-page"/g)?.length ?? 0
    // 2026-09-01 sampai 2026-09-30: minggu 31 Agu (1-5 Sep), 7-12, 14-19, 21-26, 28 Sep-3 Okt.
    expect(pages).toBeGreaterThanOrEqual(4)
  })

  it('menampilkan strip untuk hari Sakit dan default jam untuk hari kosong', () => {
    const logs = makeLogs({
      days: {
        '2026-09-01': {
          date: '2026-09-01',
          masuk: null,
          pulang: null,
          kegiatan: '',
          alasan: 'Sakit',
          status: 'sakit',
        },
        '2026-09-02': {
          date: '2026-09-02',
          masuk: '07.45',
          pulang: '16.15',
          kegiatan: 'Memperbaiki bug autentikasi',
          alasan: null,
          status: 'terisi',
        },
      },
    })

    const html = buildExportHtml({
      config: makeConfig(),
      logs,
      monthKey: '2026-09',
      letterheadUri,
    })

    expect(html).toContain('Memperbaiki bug autentikasi')
    expect(html).toContain('07.45')
    expect(html).toContain('16.15')
    // Sel Sakit menampilkan strip jam.
    expect(html).toContain('>-</td>')
  })

  it('menyesuaikan ukuran kertas dari config', () => {
    const config = makeConfig({ ukuranKertas: 'F4' })
    const html = buildExportHtml({
      config,
      logs: makeLogs(),
      monthKey: '2026-09',
      letterheadUri,
    })
    expect(html).toContain('@page { size: 215mm 330mm; margin: 2.54cm; }')
  })

  it('memakai font dokumen dari config', () => {
    const times = buildExportHtml({
      config: makeConfig({ fontDokumen: 'times' }),
      logs: makeLogs(),
      monthKey: '2026-09',
      letterheadUri,
    })
    expect(times).toContain('font-family: "Times New Roman", Times, serif;')

    const arial = buildExportHtml({
      config: makeConfig({ fontDokumen: 'arial' }),
      logs: makeLogs(),
      monthKey: '2026-09',
      letterheadUri,
    })
    expect(arial).toContain('font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;')
  })

  it('memakai default penanda tangan dari config', () => {
    const config = makeConfig({
      dosenPembimbing: 'Dr. Budi Santoso',
      pembimbingLapangan: ['Siti Aminah'],
      pembimbingLapanganDefault: 'Siti Aminah',
    })
    const html = buildExportHtml({
      config,
      logs: makeLogs(),
      monthKey: '2026-09',
      letterheadUri,
    })
    expect(html).toContain('(Akhmad Aakhif Athallah)')
    expect(html).toContain('(Dr. Budi Santoso)')
    expect(html).toContain('(Siti Aminah)')
  })

  it('memakai override nama penanda tangan minggu terakhir', () => {
    const months = buildMonthGroups('2026-09-01', '2026-09-30')
    const september = months.find((m) => m.key === '2026-09')
    const lastWeek = september?.weeks[september.weeks.length - 1]
    if (!lastWeek) throw new Error('minggu terakhir tidak ditemukan')

    const config = makeConfig({
      dosenPembimbing: 'Dr. Budi Santoso',
      pembimbingLapangan: ['Siti Aminah', 'Andi Wijaya'],
      pembimbingLapanganDefault: 'Siti Aminah',
    })
    const logs = makeLogs({
      namaPenandaTangan: { [lastWeek.id]: { pembimbing: 'Andi Wijaya', dosen: 'Dr. Citra' } },
    })
    const html = buildExportHtml({ config, logs, monthKey: '2026-09', letterheadUri })
    expect(html).toContain('(Andi Wijaya)')
    expect(html).toContain('(Dr. Citra)')
    // Mahasiswa tetap memakai default karena tidak di-override.
    expect(html).toContain('(Akhmad Aakhif Athallah)')
  })
})
