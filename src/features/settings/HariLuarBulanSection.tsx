import { dayNameId, monthLabel } from '@/lib/domain/date'
import { HARI_LUAR_BULAN_LABEL_KEY, HARI_LUAR_BULAN_LIST } from '@/lib/domain/dokumen'
import type { HariLuarBulan } from '@/lib/domain/types'
import { useLocale, useT } from '@/lib/i18n'
import { BULAN, type Locale } from '@/lib/i18n/locale'
import type { MessageKey } from '@/lib/i18n/messages/id'
import { cn } from '@/lib/utils/cn'
import { useConfigStore } from '@/stores/config'
import { SettingsSection } from './SettingsSection'

/**
 * Perlakuan baris yang tidak relevan terhadap bulan halaman (AGENTS.md bagian 11.9).
 *
 * Minggu di kalender bisa melintasi dua bulan, jadi halaman "Juli 2026 Minggu 1" bisa
 * memuat baris "Senin 29 Juni 2026". Baris seperti itu tidak relevan terhadap halaman
 * ini dan punya bentuk yang sama dengan baris kosong: tidak ada kegiatan, dan jamnya
 * hanya tebakan dari jam default. Tanpa perlakuan khusus, baris kosong itu tercetak
 * seolah-olah sudah terisi.
 *
 * Ketiga alasan `disabledReasonFor` diperlakukan sama, karena kondisi visualnya sama:
 * hari tersebut tidak milik halaman ini.
 *
 * Pengaturan ini hanya memengaruhi dokumen (cetak dan ekspor PDF). Tabel di layar tetap
 * menampilkan semua baris sebagai read-only, supaya user tidak mengira data hilang
 * saat sedang mengedit.
 */

/**
 * Miniatur tabel dokumen untuk ilustrasi pilihan.
 *
 * Isinya DUMMY dan sengaja tidak memakai data user, supaya pilihan ini tetap punya
 * contoh yang jelas bahkan saat data Log Book masih kosong, yaitu saat penjelasan
 * justru paling dibutuhkan.
 *
 * Warnanya hitam-putih dan bukan warna tema, karena yang dipratinjau adalah hasil di
 * kertas, bukan tampilan aplikasi.
 */
/**
 * Tanggal contoh untuk miniatur.
 *
 * Dipilih agar dua baris BERURUTAN dan melintasi batas bulan: Senin 31 Agustus 2026
 * (bulan sebelumnya) lalu Selasa 1 September 2026 (bulan halaman). Jadi contoh ini
 * persis kasus yang dijelaskan seksi: hari pertama minggu milik bulan lalu, dan hari
 * kedua sudah milik bulan ini.
 *
 * Sifat tanggal ini hardcode dan disengaja, bukan ikut tanggal hari ini. Kalau ikut
 * tanggal nyata, contoh bisa saja jatuh pada minggu yang seluruhnya satu bulan, lalu
 * ilustrasinya jadi tidak menjelaskan apa pun.
 */
const PREVIEW_MONTH_KEY = '2026-09'
const PREVIEW_ROW_LUAR = '2026-08-31'
const PREVIEW_ROW_DALAM = '2026-09-01'

function DocPreview({
  mode,
  locale,
  t,
}: {
  mode: HariLuarBulan
  locale: Locale
  t: (k: MessageKey) => string
}) {
  const redup = 'italic text-[#666]'
  const normal = 'text-[#000]'

  /** Nama hari dan tanggal mengikuti bahasa antarmuka, bukan bahasa dokumen. */
  const label = (iso: string) => {
    const [y, m, d] = iso.split('-')
    return {
      hari: dayNameId(iso, locale),
      tanggal: `${Number(d)} ${BULAN[locale][Number(m) - 1]} ${y}`,
    }
  }

  const luar = label(PREVIEW_ROW_LUAR)
  const dalam = label(PREVIEW_ROW_DALAM)

  return (
    /*
     * `min-h` dipakai supaya kedua kotak putih sama tinggi, bukan hanya sama lebar.
     *
     * Tanpa itu, kartu "Samarkan" punya dua baris tabel sementara kartu "Hapus dari
     * tabel" cuma satu, jadi kotak putihnya 86 px vs 58 px dan tepinya tidak rata
     * meskipun kartu luarnya sudah sama tinggi. Angkanya diukur dari varian dua
     * baris, lalu diberi jeda 2 px supaya tetap berlaku di browser yang menghitung
     * tinggi baris sedikit berbeda. Isi tetap menempel di atas, sesuai miniatur dokumen
     * yang judulnya rata tengah.
     */
    <div className="min-h-[5.5rem] bg-white p-2 text-[7px] leading-[1.35]">
      <div className="mb-1 text-center text-[#000]">{monthLabel(PREVIEW_MONTH_KEY, locale)}</div>
      <table className="w-full border-collapse">
        <tbody>
          {mode === 'samarkan' ? (
            <tr>
              <td className={`w-1/3 border border-[#a8a8a8] px-1 py-1 ${redup}`}>
                {luar.hari}
                <br />
                {luar.tanggal}
              </td>
              <td className={`w-1/6 border border-[#a8a8a8] px-1 py-1 text-center ${redup}`}>-</td>
              <td className={`w-1/6 border border-[#a8a8a8] px-1 py-1 text-center ${redup}`}>-</td>
              {/*
               * Kalimat alasan ikut ditampilkan di sini, sama seperti di dokumen
               * sungguhan (AGENTS.md bagian 11.9). Tanpa itu, "-" di kolom jam terlihat
               * seperti kegagalan render, bukan keputusan yang disengaja.
               */}
              <td className={`border border-[#a8a8a8] px-1 py-1 ${redup}`}>
                {t('alasan.bulanLain')}
              </td>
            </tr>
          ) : null}
          <tr>
            <td className={`w-1/3 border border-[#000] px-1 py-1 ${normal}`}>
              {dalam.hari}
              <br />
              {dalam.tanggal}
            </td>
            <td className={`w-1/6 border border-[#000] px-1 py-1 text-center ${normal}`}>08.00</td>
            <td className={`w-1/6 border border-[#000] px-1 py-1 text-center ${normal}`}>16.00</td>
            <td className={`border border-[#000] px-1 py-1 ${normal}`} />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function HariLuarBulanSection() {
  const t = useT()
  const locale = useLocale()
  const hariLuarBulan = useConfigStore((s) => s.config.hariLuarBulan)
  const update = useConfigStore((s) => s.update)

  return (
    <SettingsSection id="hari-luar-bulan" title={t('settings.hariLuarBulan')}>
      <p className="mb-3 text-[12px] text-text-muted">{t('settings.hariLuarBulanDeskripsi')}</p>
      {/*
       * Grid kartu, bukan radio, mengikuti pola picker tema (AGENTS.md bagian 10).
       *
       * `items-stretch` (bawaan grid) plus `h-full` pada tombolnya membuat kedua kartu
       * sama tinggi. Tanpa itu, kartu dengan teks lebih pendek akan lebih pendek dan
       * tepinya tidak rata. Bagian teks diberi `min-h` supaya blok label dan deskripsi
       * mulai pada garis yang sama di kedua kartu, apa pun panjang deskripsinya.
       */}
      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
        {HARI_LUAR_BULAN_LIST.map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={hariLuarBulan === mode}
            onClick={() => update({ hariLuarBulan: mode })}
            className={cn(
              'flex h-full flex-col overflow-hidden border text-left',
              hariLuarBulan === mode
                ? 'border-border-light bg-bg-card'
                : 'border-border-base hover:border-border-light',
            )}
          >
            <DocPreview mode={mode} locale={locale} t={t} />
            <div className="flex flex-1 flex-col justify-between gap-2 border-t border-border-base px-3 py-2">
              <span className="flex min-h-[3.75rem] flex-col gap-1">
                <span className="text-[12px] text-text-main">
                  {t(HARI_LUAR_BULAN_LABEL_KEY[mode])}
                </span>
                <span className="text-[11px] leading-relaxed text-text-dim">
                  {t(
                    mode === 'samarkan'
                      ? 'settings.hariLuarBulan.samarkanKet'
                      : 'settings.hariLuarBulan.hapusKet',
                  )}
                </span>
              </span>
              <span className="flex h-2 shrink-0 items-start">
                {hariLuarBulan === mode ? (
                  <span className="size-2 shrink-0 bg-accent" aria-hidden />
                ) : null}
              </span>
            </div>
          </button>
        ))}
      </div>
    </SettingsSection>
  )
}
