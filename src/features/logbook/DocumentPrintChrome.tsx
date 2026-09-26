import { monthLabel } from '@/lib/domain/date'
import { resolveNamaMinggu } from '@/lib/domain/pembimbing'
import type { MonthGroup, WeekEntry } from '@/lib/domain/types'
import type { MessageKey } from '@/lib/i18n/messages/id'
import { translate } from '@/lib/i18n/translate'

/**
 * Bahasa isi dokumen untuk lapisan cetak browser.
 *
 * Dibaca di luar React supaya `translate` bisa dipakai tanpa hook. Nilai ini BUKAN
 * bahasa antarmuka: yang dicetak adalah dokumen, dan dokumen punya bahasa sendiri
 * (AGENTS.md bagian 21). Config lama tanpa key `bahasaDokumen` otomatis memakai `id`.
 */
function dokumenLocale() {
  return useConfigStore.getState().config.bahasaDokumen
}

import { useConfigStore } from '@/stores/config'
import { useLogsStore } from '@/stores/logs'

/**
 * Bagian dokumen yang hanya tampil saat dicetak (AGENTS.md bagian 12).
 *
 * Preview di browser ADALAH dokumen itu sendiri: kop, judul, identitas, dan blok
 * tanda tangan dirender di sini dengan kelas print-only, sehingga layar tetap
 * menampilkan editor tanpa chrome dokumen. Struktur teks mengikuti server/pdf.ts
 * agar hasil cetak browser dan PDF ekspor sama.
 */

/** Kop surat Polinema, identik dengan renderLetterhead di server/pdf.ts. */
export function PrintLetterhead() {
  return (
    <div
      data-testid="print-letterhead"
      className="print-only mb-4 items-center gap-3 border-b-2 border-doc-border pb-2 font-doc print-only-flex"
    >
      <img
        src="/letterhead-polinema.png"
        alt="Logo Polinema"
        className="h-[60px] w-auto shrink-0"
      />
      <div className="flex-1 text-center font-doc text-doc-ink">
        <p className="text-[11pt] leading-snug font-bold">
          KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
        </p>
        <p className="text-[11pt] leading-snug font-bold">POLITEKNIK NEGERI MALANG</p>
        <p className="text-[11pt] leading-snug font-bold">JURUSAN TEKNOLOGI INFORMASI</p>
        <p className="text-[10pt] leading-snug">
          Jalan Soekarno Hatta Nomor 9, Jatimulyo, Lowokwaru, Malang 65141
        </p>
        <p className="text-[10pt] leading-snug">
          Telepon (0341) 404424, 404425, Faksimile (0341) 404420
        </p>
        <p className="text-[10pt] leading-snug">Laman www.polinema.ac.id</p>
      </div>
    </div>
  )
}

/**
 * Judul dan subjudul dokumen: LOG BOOK MAGANG plus bulan dan nomor minggu.
 *
 * `monthKey` dipakai, bukan label yang sudah jadi, karena nama bulan harus mengikuti
 * bahasa DOKUMEN. Label dari grup bulan mengikuti bahasa antarmuka, jadi kalau
 * dipassing apa adanya, subjudul akan ikut berubah ke bahasa antarmuka (bug yang
 * pernah terjadi di sini).
 */
export function PrintDocHeading({
  monthKey,
  weekOfMonth,
}: {
  monthKey: string
  weekOfMonth: number
}) {
  const locale = dokumenLocale()
  return (
    <div data-testid="print-heading" className="print-only mb-3 text-center font-doc text-doc-ink">
      <h1 className="text-[14pt] font-bold">LOG BOOK MAGANG</h1>
      <p className="text-[12pt]">
        {monthLabel(monthKey, locale)} - {translate(locale, 'logbook.weekLabel')} {weekOfMonth}
      </p>
    </div>
  )
}

/** Tabel identitas dari config profil, hanya pada minggu pertama (sama seperti PDF). */
export function PrintIdentity() {
  const profil = useConfigStore((s) => s.config.profil)
  const locale = dokumenLocale()
  const baris: Array<[string, string]> = [
    ['logbook.nama', profil.nama],
    ['logbook.nim', profil.nim],
    ['settings.programStudi', profil.programStudi],
    ['settings.mitraIndustri', profil.mitraIndustri],
  ]
  return (
    <table
      data-testid="print-identity"
      className="print-only mb-3 w-full border-collapse font-doc text-[12pt] text-doc-ink"
    >
      <tbody>
        {baris.map(([key, value]) => (
          <tr key={key}>
            <td className="w-40 p-0 align-top">{translate(locale, key as MessageKey)}</td>
            <td className="w-3 p-0 align-top">:</td>
            <td className="p-0 align-top">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Blok tanda tangan, hanya pada minggu terakhir (seperti PDF).
 *
 * Nama diambil dari resolver yang sama dengan PDF: override minggu bila ada, jika tidak
 * default dari Pengaturan. Nama kosong ditampilkan sebagai titik-titik, siap diisi tangan.
 */
export function PrintSignature({ weekId }: { weekId: string }) {
  const profilNama = useConfigStore((s) => s.config.profil.nama)
  const dosenPembimbing = useConfigStore((s) => s.config.dosenPembimbing)
  const pembimbingDefault = useConfigStore((s) => s.config.pembimbingLapanganDefault)
  const override = useLogsStore((s) => s.data.namaPenandaTangan[weekId])
  const { mahasiswa, dosen, pembimbing } = resolveNamaMinggu(override, {
    mahasiswa: profilNama,
    dosen: dosenPembimbing,
    pembimbing: pembimbingDefault ?? '',
  })

  const label = (nama: string) => `(${nama || '...........................'})`
  const locale = dokumenLocale()
  const ttd = (key: 'ttd.mahasiswa' | 'ttd.dosen' | 'ttd.pembimbing') =>
    `${translate(locale, key)},`

  return (
    <div
      data-testid="print-signature"
      className="print-only mt-8 font-doc text-[12pt] text-doc-ink"
    >
      <div className="mx-auto mb-6 w-[45%] text-center">
        <p>{ttd('ttd.mahasiswa')}</p>
        <div className="h-[60px]" aria-hidden="true" />
        <p>{label(mahasiswa)}</p>
      </div>
      <div>
        <p className="text-left">{translate(locale, 'ttd.mengetahui')}</p>
        <div className="mt-2 flex justify-between">
          <div className="w-[45%] text-center">
            <p>{ttd('ttd.dosen')}</p>
            <div className="h-[60px]" aria-hidden="true" />
            <p>{label(dosen)}</p>
          </div>
          <div className="w-[45%] text-center">
            <p>{ttd('ttd.pembimbing')}</p>
            <div className="h-[60px]" aria-hidden="true" />
            <p>{label(pembimbing)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Penentu minggu pertama dan terakhir, dipakai LogbookPage untuk identitas/tanda tangan. */
export function weekPosition(
  month: MonthGroup,
  week: WeekEntry | undefined,
): {
  isFirst: boolean
  isLast: boolean
} {
  const first = month.weeks[0]
  const last = month.weeks[month.weeks.length - 1]
  return {
    isFirst: Boolean(week && first && week.id === first.id),
    isLast: Boolean(week && last && week.id === last.id),
  }
}
