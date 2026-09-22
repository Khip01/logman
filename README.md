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

Perintah lain lewat argumen yang sama:

```bash
./run build       # typecheck + build produksi
./run lint        # lint dan format check (Biome)
./run typecheck   # cek tipe TypeScript
./run test        # unit test (Vitest: domain + komponen + server)
./run test:e2e    # end to end test (Playwright, butuh browser Chromium)
./run analyze     # build + cek anggaran ukuran bundle
```

Skrip bertahap agar debugging cepat:

```bash
./run test:domain        # hanya logika domain
./run test:server        # hanya server
./run test:e2e:editor    # satu spec e2e, misal editor
./run audit:motion       # aturan animasi
./run audit:a11y         # aksesibilitas semua halaman x semua tema
```

Catatan: `./run <argumen>` meneruskan ke skrip `pnpm` dengan nama yang sama,
jadi `./run test:e2e:seed` dan `./run test:e2e:perf` juga berlaku.

## Halaman

- `/` Log Book: navigasi bulan dan minggu, editor langsung per sel.
- `/settings` Pengaturan: profil, rentang magang, jam default, alasan, tema,
  ukuran kertas, tier animasi.
- `/export` Ekspor PDF per bulan. Ekspor ditolak selama ada hari yang belum
  lengkap (belum ada kegiatan maupun alasan).
- `/dev/components`, `/dev/motion`, `/dev/perf`, `/dev/seed`: halaman dev untuk
  pengujian dan pengukuran.

## Gate kualitas

Sebelum menandai pekerjaan selesai, semua gate ini lulus:

- Lint dan typecheck tanpa error.
- Unit test Vitest lulus.
- E2E Playwright lulus, termasuk snapshot visual.
- Audit animasi lulus.
- Audit aksesibilitas: 0 pelanggaran serious/critical.
- Anggaran bundle: JS awal di bawah 200 KB gzip.
- Long task saat mengetik di bawah ambang 50 ms.

## Data

Data runtime tersimpan lokal dan tidak masuk git:

- `data/config.json`: profil, rentang magang, jam default, alasan, tema,
  ukuran kertas, tier animasi.
- `data/logs.json`: entri kegiatan harian.
- `data/backups/`: rotasi backup sebelum penulisan.
- `data/logs/`: log aplikasi JSON lines dengan `traceId`.
- `data/exports/`: hasil PDF bila `folderExport` dikosongkan.

## Dokumentasi

Seluruh aturan, keputusan desain, dan konvensi proyek ada di [AGENTS.md](./AGENTS.md).
Baca dokumen itu sebelum mengubah apa pun. Status pengerjaan terkini ada di bagian 20
dokumen tersebut.

## Rilis

Rilis dibuat otomatis oleh workflow GitHub saat ada tag (`v*` atau pola angka):
workflow build produksi, memverifikasi anggaran bundle, lalu mengunggah arsip
`logman-<tag>.tar.gz` ke halaman GitHub Release.

## Lisensi

Apache 2.0. Lihat [LICENSE](./LICENSE).
