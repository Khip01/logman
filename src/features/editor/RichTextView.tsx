import { type InlineNode, parseBlocks } from '@/lib/domain/richText'

/**
 * Menampilkan isi Kegiatan dengan formatnya (AGENTS.md bagian 11.6).
 *
 * Komponen ini dipakai saat sel TIDAK sedang diedit, sehingga user melihat hasil formatnya
 * dan bukan penanda mentahnya. Saat sel difokus, `AutoGrowTextarea` yang tampil dan
 * komponen ini disembunyikan lewat CSS (`globals.css`), bukan lewat state React. Alasannya:
 * peralihan fokus terjadi sangat sering, dan mengubah state React untuk itu akan
 * me-render ulang baris setiap kali user berpindah sel.
 *
 * Menghasilkan elemen React, BUKAN HTML mentah. React meloloskan teks secara otomatis,
 * jadi isi Log Book tidak mungkin menyisipkan skrip.
 *
 * Tinggi baris dikunci 19.5px untuk SEMUA baris, termasuk judul. Dengan begitu tinggi sel
 * tidak berubah saat user berpindah antara mode baca dan mode edit, sehingga baris tabel
 * tidak melompat.
 */

/*
 * Ukuran dan tinggi baris WAJIB sama dengan textarea di `AutoGrowTextarea`
 * (`text-[12px] leading-[19.5px]`). Kalau berbeda, tinggi sel berubah saat user berpindah
 * antara mode baca dan mode edit, dan baris tabel akan melompat.
 */
const TINGGI_BARIS = 'text-[12px] leading-[19.5px]'

/** Ukuran judul per tingkat. Tinggi baris tetap sama dengan teks biasa. */
const KELAS_JUDUL: Record<number, string> = {
  1: 'text-[14px] font-semibold leading-[19.5px]',
  2: 'text-[13px] font-semibold leading-[19.5px]',
  3: 'text-[12px] font-semibold leading-[19.5px]',
}

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {/*
        Key memakai indeks dengan sengaja. Daftar ini adalah hasil parsing yang diturunkan
        sepenuhnya dari teks, jadi identitasnya memang POSISIONAL dan tidak pernah diacak
        ulang. Key dari isi akan salah ketika dua potongan teks kembar bersebelahan, karena
        keduanya menghasilkan key yang sama.
      */}
      {nodes.map((node, index) =>
        node.kind === 'teks' ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: urutan potongan bersifat posisional
          <span key={index}>{node.text}</span>
        ) : node.style === 'tebal' ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: urutan potongan bersifat posisional
          <strong key={index} className="font-semibold">
            <Inline nodes={node.children ?? []} />
          </strong>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: urutan potongan bersifat posisional
          <em key={index} className="italic">
            <Inline nodes={node.children ?? []} />
          </em>
        ),
      )}
    </>
  )
}

export function RichTextView({ text }: { text: string }) {
  const blok = parseBlocks(text)
  return (
    <>
      {blok.map((block, index) => {
        const kelas = block.type === 'judul' ? KELAS_JUDUL[block.level ?? 1] : TINGGI_BARIS
        return (
          // Baris kosong tetap punya tinggi lewat `TINGGI_BARIS`, sehingga jarak antar
          // paragraf yang sengaja dibuat user tidak hilang saat penanda disembunyikan.
          // biome-ignore lint/suspicious/noArrayIndexKey: urutan baris bersifat posisional
          <div key={index} className={kelas}>
            <Inline nodes={block.nodes} />
          </div>
        )
      })}
    </>
  )
}
