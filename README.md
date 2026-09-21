# logman

Generator Log Book Magang. Aplikasi web lokal untuk menyusun kegiatan magang harian,
mengeditnya langsung seperti dokumen, lalu mengekspor PDF siap cetak dan tanda tangan.

## Menjalankan

```bash
./run
```

Perintah di atas memasang dependency bila belum ada, lalu menjalankan web dan API
sekaligus.

- Web: http://127.0.0.1:5199
- API: http://127.0.0.1:5198

Perintah lain lewat skrip yang sama:

```bash
./run build      # build produksi
./run test       # unit test
./run test:e2e   # end to end test
./run lint       # lint dan format check
./run analyze    # cek anggaran ukuran bundle
```

## Stack

Vite, React 19, TypeScript, Tailwind v4, Motion, Radix via shadcn, Lucide, Zustand,
Hono, Vitest, Playwright, Biome.

## Dokumentasi

Seluruh aturan, keputusan desain, dan konvensi proyek ada di [AGENTS.md](./AGENTS.md).
Baca dokumen itu sebelum mengubah apa pun. Status pengerjaan terkini ada di bagian 20
dokumen tersebut.

## Lisensi

Apache 2.0. Lihat [LICENSE](./LICENSE).
