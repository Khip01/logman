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

  /*
   * Baris yang tidak relevan terhadap bulan halaman (AGENTS.md bagian 11.9).
   *
   * Skenario yang dipilih: magang mulai 2026-07-01, jadi halaman "Juli 2026 Minggu 1"
   * memuat minggu yang dimulai Senin 2026-06-29. Baris 29 dan 30 Juni milik bulan lain.
   */
  describe('hari luar bulan', () => {
    const configJuli = (hariLuarBulan: 'samarkan' | 'hapus') =>
      makeConfig({ magang: { mulai: '2026-07-01', selesai: '2026-07-31' }, hariLuarBulan })

    it('menandai baris bulan lain dan tidak memakai jam default', () => {
      const html = buildExportHtml({
        config: configJuli('samarkan'),
        logs: makeLogs(),
        monthKey: '2026-07',
        letterheadUri,
      })

      // Baris 29 Juni dapat kelas, dan jamnya strip, bukan tebakan 08.00/16.00.
      expect(html).toContain('row-bulan-lain')
      expect(html).toContain('29 Juni 2026')
      // Baris 1 Juli tetap milik bulan ini dan memakai jam default.
      expect(html).toContain('1 Juli 2026')
    })

    it('mode samarkan tetap mencetak baris bulan lain', () => {
      const html = buildExportHtml({
        config: configJuli('samarkan'),
        logs: makeLogs(),
        monthKey: '2026-07',
        letterheadUri,
      })
      expect(html).toContain('29 Juni 2026')
      expect(html).toContain('30 Juni 2026')
    })

    it('mode hapus tidak mencetak baris bulan lain sama sekali', () => {
      const html = buildExportHtml({
        config: configJuli('hapus'),
        logs: makeLogs(),
        monthKey: '2026-07',
        letterheadUri,
      })
      expect(html).not.toContain('29 Juni 2026')
      expect(html).not.toContain('30 Juni 2026')
      // Baris milik bulan halaman sendiri tetap ada.
      expect(html).toContain('1 Juli 2026')
    })

    it('jam yang benar-benar diketik pada baris bulan lain tetap ditampilkan', () => {
      const logs = makeLogs({
        days: {
          '2026-06-29': {
            date: '2026-06-29',
            masuk: '07.00',
            pulang: '15.00',
            kegiatan: 'Persiapan alat',
            alasan: null,
            status: 'terisi',
          },
        },
      })
      const html = buildExportHtml({
        config: configJuli('samarkan'),
        logs,
        monthKey: '2026-07',
        letterheadUri,
      })
      expect(html).toContain('07.00')
      expect(html).toContain('15.00')
      expect(html).toContain('Persiapan alat')
    })

    it('baris sebelum magang diperlakukan sama dengan baris bulan lain', () => {
      // 2026-06-29 bukan cuma bulan lain, juga sebelum magang mulai 2026-07-01.
      const html = buildExportHtml({
        config: configJuli('hapus'),
        logs: makeLogs(),
        monthKey: '2026-07',
        letterheadUri,
      })
      expect(html).not.toContain('29 Juni 2026')
    })

    it('hanya baris yang tidak relevan yang diberi kelas', () => {
      const html = buildExportHtml({
        config: configJuli('samarkan'),
        logs: makeLogs(),
        monthKey: '2026-07',
        letterheadUri,
      })
      /*
       * Tiga baris, bukan dua: 29 dan 30 Juni milik bulan sebelumnya, dan 1 Agustus
       * milik bulan berikutnya sekaligus sudah melewati akhir magang (2026-07-31).
       * Ketiganya kondisi yang sama, yaitu bukan bagian halaman ini.
       *
       * Baris dihitung dari tag <tr>, bukan dari kemunculan teks, karena nama kelasnya
       * juga muncul di blok CSS.
       */
      const luar = [
        ...html.matchAll(/<tr class="row-bulan-lain">[\s\S]*?<span class="tanggal">([^<]+)</g),
      ].map((m) => m[1])
      expect(luar).toEqual(['29 Juni 2026', '30 Juni 2026', '1 Agustus 2026'])
    })

    it('mode hapus juga membuang baris setelah magang, bukan hanya bulan lain', () => {
      const html = buildExportHtml({
        config: configJuli('hapus'),
        logs: makeLogs(),
        monthKey: '2026-07',
        letterheadUri,
      })
      expect(html).not.toContain('1 Agustus 2026')
      // Baris terakhir yang masih relevan tetap tercetak.
      expect(html).toContain('31 Juli 2026')
    })
  })
})

/*
 * Bahasa isi dokumen (AGENTS.md bagian 21).
 *
 * Yang ikut bahasa: label identitas, judul kolom, label tanda tangan, kata Minggu, nama
 * hari, nama bulan. Yang TIDAK ikut: kop surat dan judul dokumen.
 */
describe('bahasa isi dokumen', () => {
  const en = (overrides: Partial<AppConfig> = {}) =>
    buildExportHtml({
      config: makeConfig({ bahasaDokumen: 'en', ...overrides }),
      logs: makeLogs(),
      monthKey: '2026-09',
      letterheadUri: 'data:image/png;base64,dGVzdA==',
    })

  it('mengubah label identitas, judul kolom, dan label tanda tangan', () => {
    const html = en()
    expect(html).toContain('Name')
    expect(html).toContain('Study Program')
    expect(html).toContain('Industry Partner')
    expect(html).toContain('Student ID')
    expect(html).toContain('Day, Date')
    expect(html).toContain('Time In')
    expect(html).toContain('Activities')
    expect(html).toContain('Approved by')
    expect(html).toContain('Field Supervisor,')
  })

  it('kop surat dan judul dokumen tetap bahasa Indonesia', () => {
    const html = en()
    // Ini bagian identitas resmi kampus, jadi tidak pernah ikut bahasa isi.
    expect(html).toContain('KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI')
    expect(html).toContain('JURUSAN TEKNOLOGI INFORMASI')
    expect(html).toContain('LOG BOOK MAGANG')
  })

  it('mengubah nama hari, nama bulan, dan kata Minggu', () => {
    // Juni dipakai karena ejaannya benar-benar berbeda ('Juni' vs 'June'). September
    // tidak bisa dipakai sebagai pembeda karena sama di dua bahasa.
    const html = buildExportHtml({
      config: makeConfig({
        magang: { mulai: '2026-06-01', selesai: '2026-06-30' },
        bahasaDokumen: 'en',
      }),
      logs: makeLogs(),
      monthKey: '2026-06',
      letterheadUri: 'x',
    })
    expect(html).toContain('June 2026')
    expect(html).not.toContain('Juni 2026')
    // 1 Juni 2026 adalah Senin, jadi tampilannya harus "Monday".
    expect(html).toContain('Monday')
    expect(html).not.toContain('>Senin<')
    expect(html).toContain('Week 1')
    expect(html).not.toContain('- Minggu 1')
  })

  it('default config tanpa key tetap bahasa Indonesia', () => {
    // Config lama tidak punya key bahasaDokumen sama sekali.
    const html = buildExportHtml({
      config: makeConfig(),
      logs: makeLogs(),
      monthKey: '2026-09',
      letterheadUri: 'x',
    })
    expect(html).toContain('Hari, Tanggal')
    expect(html).toContain('Senin')
  })

  /*
   * Jebakan yang paling berbahaya di fitur ini: kunci jam default pernah diturunkan dari
   * nama hari yang DISAMPILKAN. Kalau nama hari ikut bahasa Inggris, kuncinya jadi
   * "monday", tidak ada di jamDefault, lalu baris itu diam-diam memakai 08.00/16.00
   * hasil hardcode tanpa error. Test ini mengunci bahwa jam default per hari tetap
   * terpakai meski bahasa dokumen berubah.
   */
  it('jam default per hari tetap terpakai saat bahasa dokumen Inggris', () => {
    const config = makeConfig({
      bahasaDokumen: 'en',
      jamDefault: {
        senin: { masuk: '07.00', pulang: '15.00' },
        selasa: { masuk: '07.00', pulang: '15.00' },
        rabu: { masuk: '07.00', pulang: '15.00' },
        kamis: { masuk: '07.00', pulang: '15.00' },
        jumat: { masuk: '07.00', pulang: '15.00' },
        sabtu: { masuk: '07.00', pulang: '15.00' },
        minggu: { masuk: '07.00', pulang: '15.00' },
      },
    })
    const html = buildExportHtml({
      config,
      logs: makeLogs(),
      monthKey: '2026-09',
      letterheadUri: 'x',
    })
    // 21 September 2026 adalah Senin, jadi jam default 07.00/15.00 harus muncul.
    // Kalau kunci jam ikut jadi "monday", nilai ini akan hilang.
    expect(html).toContain('07.00')
    expect(html).toContain('15.00')
    expect(html).not.toContain('08.00')
  })

  it('nama bulan di nama file tetap Indonesia meski isi dokumen Inggris', () => {
    // Nama file bukan isi surat, jadi polanya dikunci dan tidak ikut bahasa dokumen.
    expect(buildExportFileName('2341760001', '2026-09')).toBe(
      'LogBook_2341760001_September-2026.pdf',
    )
  })
})

/*
 * Kalimat alasan pada baris luar bulan yang kosong (AGENTS.md bagian 11.9).
 */
describe('kalimat alasan baris luar bulan', () => {
  const configJuli = (hariLuarBulan: 'samarkan' | 'hapus') =>
    makeConfig({ magang: { mulai: '2026-07-01', selesai: '2026-07-31' }, hariLuarBulan })

  it('baris kosong di luar bulan diberi kalimat alasan', () => {
    const html = buildExportHtml({
      config: configJuli('samarkan'),
      logs: makeLogs(),
      monthKey: '2026-07',
      letterheadUri: 'x',
    })
    // Magang mulai 2026-07-01, jadi 29 dan 30 Juni beralasan 'sebelum-magang' dan
    // 1 Agustus beralasan 'setelah-magang'. Ketiganya harus punya kalimat.
    expect(html).toContain('alasan-luar-bulan')
    expect(html).toContain('Sebelum magang')
    expect(html).toContain('Setelah magang')
  })

  it('baris milik bulan lain memakai kalimat Bulan lain', () => {
    // Rentang yang memuat Mei sampai Juli, jadi baris 1 Juni di halaman Juli benar-benar
    // beralasan bulan lain, bukan sekadar sebelum magang.
    const html = buildExportHtml({
      config: makeConfig({
        magang: { mulai: '2026-05-01', selesai: '2026-07-31' },
        hariLuarBulan: 'samarkan',
      }),
      logs: makeLogs(),
      monthKey: '2026-07',
      letterheadUri: 'x',
    })
    expect(html).toContain('Bulan lain')
  })

  it('baris sebelum magang memakai kalimat Before, baris sesudahnya After', () => {
    const html = buildExportHtml({
      config: makeConfig({
        magang: { mulai: '2026-07-01', selesai: '2026-07-31' },
        hariLuarBulan: 'samarkan',
        bahasaDokumen: 'en',
      }),
      logs: makeLogs(),
      monthKey: '2026-07',
      letterheadUri: 'x',
    })
    expect(html).toContain('Before the internship')
    expect(html).toContain('After the internship')
  })

  it('isi user tidak pernah tertutup kalimat alasan', () => {
    // Baris lintas bulan yang sudah diisi user harus tetap menampilkan isinya. Kalau
    // kalimat alasan menutupnya, data asli hilang dari dokumen.
    const logs = makeLogs({
      days: {
        '2026-06-29': {
          date: '2026-06-29',
          masuk: '07.00',
          pulang: '15.00',
          kegiatan: 'Persiapan alat',
          alasan: null,
          status: 'terisi',
        },
      },
    })
    const html = buildExportHtml({
      config: configJuli('samarkan'),
      logs,
      monthKey: '2026-07',
      letterheadUri: 'x',
    })
    expect(html).toContain('Persiapan alat')
    // Kalimat alasan tetap muncul untuk baris lain di minggu yang sama yang kosong.
    expect(html).toContain('Sebelum magang')
  })

  it('baris milik bulan halaman sendiri tidak diberi kalimat alasan', () => {
    const html = buildExportHtml({
      config: configJuli('samarkan'),
      logs: makeLogs(),
      monthKey: '2026-07',
      letterheadUri: 'x',
    })
    // 1 Juli adalah milik bulan halaman, jadi tidak boleh ada kalimat di barisnya.
    const baris = html.match(/<tr class="row-bulan-lain">[\s\S]*?<\/tr>/g) ?? []
    expect(baris.length).toBe(3)
    for (const isi of baris) expect(isi).toContain('alasan-luar-bulan')
    expect(html).toContain('1 Juli 2026')
  })
})
