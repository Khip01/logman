import type { MonthGroup, WeekEntry } from '@/lib/domain/types'
import { useConfigStore } from '@/stores/config'

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

/** Judul dan subjudul dokumen: LOG BOOK MAGANG plus bulan dan nomor minggu. */
export function PrintDocHeading({
  monthLabel,
  weekOfMonth,
}: {
  monthLabel: string
  weekOfMonth: number
}) {
  return (
    <div data-testid="print-heading" className="print-only mb-3 text-center font-doc text-doc-ink">
      <h1 className="text-[14pt] font-bold">LOG BOOK MAGANG</h1>
      <p className="text-[12pt]">
        {monthLabel} - Minggu {weekOfMonth}
      </p>
    </div>
  )
}

/** Tabel identitas dari config profil, hanya pada minggu pertama (sama seperti PDF). */
export function PrintIdentity() {
  const profil = useConfigStore((s) => s.config.profil)
  const baris: Array<[string, string]> = [
    ['Nama', profil.nama],
    ['NIM', profil.nim],
    ['Program Studi', profil.programStudi],
    ['Nama Mitra Industri', profil.mitraIndustri],
  ]
  return (
    <table
      data-testid="print-identity"
      className="print-only mb-3 w-full border-collapse font-doc text-[12pt] text-doc-ink"
    >
      <tbody>
        {baris.map(([label, value]) => (
          <tr key={label}>
            <td className="w-40 p-0 align-top">{label}</td>
            <td className="w-3 p-0 align-top">:</td>
            <td className="p-0 align-top">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Blok tanda tangan, hanya pada minggu terakhir (sama seperti PDF). */
export function PrintSignature() {
  return (
    <div
      data-testid="print-signature"
      className="print-only mt-8 font-doc text-[12pt] text-doc-ink"
    >
      <div className="mx-auto mb-6 w-[45%] text-center">
        <p>Mahasiswa,</p>
        <div className="h-[60px]" aria-hidden="true" />
        <p>(...........................)</p>
      </div>
      <div>
        <p className="text-left">Mengetahui,</p>
        <div className="mt-2 flex justify-between">
          <div className="w-[45%] text-center">
            <p>Dosen Pembimbing,</p>
            <div className="h-[60px]" aria-hidden="true" />
            <p>(...........................)</p>
          </div>
          <div className="w-[45%] text-center">
            <p>Pembimbing Lapangan,</p>
            <div className="h-[60px]" aria-hidden="true" />
            <p>(...........................)</p>
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
