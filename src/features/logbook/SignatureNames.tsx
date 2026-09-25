import { PenLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { resolveNamaMinggu } from '@/lib/domain/pembimbing'
import type { NamaMinggu } from '@/lib/domain/types'
import { useT } from '@/lib/i18n'
import { useConfigStore } from '@/stores/config'
import { useLogsStore } from '@/stores/logs'

/**
 * Nama penanda tangan untuk minggu yang sedang dibuka (AGENTS.md bagian 11.5).
 *
 * Ketiga nama bisa disesuaikan per minggu: Mahasiswa, Dosen Pembimbing, dan Pembimbing
 * Lapangan. Nilai default diambil dari Pengaturan; mengosongkan sebuah field berarti
 * kembali memakai default. Nilai ini yang tercetak di blok tanda tangan halaman minggu
 * tersebut, baik pada preview cetak maupun PDF ekspor.
 */
export function SignatureNames({ weekId }: { weekId: string }) {
  const t = useT()
  const profilNama = useConfigStore((s) => s.config.profil.nama)
  const dosenPembimbing = useConfigStore((s) => s.config.dosenPembimbing)
  const daftarPembimbing = useConfigStore((s) => s.config.pembimbingLapangan)
  const pembimbingDefault = useConfigStore((s) => s.config.pembimbingLapanganDefault)
  const override = useLogsStore((s) => s.data.namaPenandaTangan[weekId])
  const setNamaMinggu = useLogsStore((s) => s.setNamaMinggu)

  const resolved = resolveNamaMinggu(override, {
    mahasiswa: profilNama,
    dosen: dosenPembimbing,
    pembimbing: pembimbingDefault ?? '',
  })

  const [mahasiswa, setMahasiswa] = useState(resolved.mahasiswa)
  const [dosen, setDosen] = useState(resolved.dosen)
  const [pembimbing, setPembimbing] = useState(resolved.pembimbing)

  // Sinkronkan draft saat minggu berganti atau default berubah dari Pengaturan.
  useEffect(() => setMahasiswa(resolved.mahasiswa), [resolved.mahasiswa])
  useEffect(() => setDosen(resolved.dosen), [resolved.dosen])
  useEffect(() => setPembimbing(resolved.pembimbing), [resolved.pembimbing])

  function commit(field: keyof NamaMinggu, value: string) {
    setNamaMinggu(weekId, { [field]: value.trim() === '' ? null : value.trim() })
  }

  return (
    <div
      data-testid="signature-names"
      className="mb-4 border border-border-base bg-bg-card px-3 py-3 no-print"
    >
      <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-text-dim">
        <PenLine className="size-3.5" strokeWidth={1.75} />
        {t('ttd.judul')}
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field htmlFor={`sig-mahasiswa-${weekId}`} label={t('ttd.mahasiswa')}>
          <Input
            id={`sig-mahasiswa-${weekId}`}
            value={mahasiswa}
            placeholder={profilNama || t('ttd.namaMahasiswa')}
            onChange={(event) => setMahasiswa(event.target.value)}
            onBlur={(event) => commit('mahasiswa', event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
        </Field>

        <Field htmlFor={`sig-dosen-${weekId}`} label={t('ttd.dosen')}>
          <Input
            id={`sig-dosen-${weekId}`}
            value={dosen}
            placeholder={dosenPembimbing || t('ttd.namaDosen')}
            onChange={(event) => setDosen(event.target.value)}
            onBlur={(event) => commit('dosen', event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
        </Field>

        <Field label={t('ttd.pembimbing')}>
          <Combobox
            aria-label={t('ttd.pembimbing')}
            options={daftarPembimbing}
            value={pembimbing}
            placeholder={pembimbingDefault ?? t('ttd.pilihPembimbing')}
            onValueChange={setPembimbing}
            onSelect={(value) => commit('pembimbing', value)}
            onInputBlur={() => commit('pembimbing', pembimbing)}
          />
        </Field>
      </div>
    </div>
  )
}
