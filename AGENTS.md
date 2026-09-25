# logman

Generator Log Book Magang. Aplikasi web lokal untuk menyusun Log Book kegiatan magang
(format dokumen resmi kampus), mengeditnya langsung seperti dokumen, lalu mengekspor PDF
siap cetak dan tanda tangan.

Dokumen ini adalah sumber kebenaran tunggal (single source of truth) untuk aturan,
konvensi, dan keputusan desain proyek. Setiap perubahan perilaku WAJIB disertai
pembaruan dokumen ini.

---

## 0. Cara kerja agen (WAJIB DIBACA DULU)

1. Baca seluruh dokumen ini sebelum menulis kode.
2. Jangan menyimpang dari keputusan di dokumen ini tanpa persetujuan eksplisit pemilik.
3. Setiap perubahan fungsional: perbarui bagian dokumen yang relevan pada commit yang sama.
4. Prioritas urutan keputusan bila ada konflik: keamanan client side > stabilitas >
   performa > keindahan animasi > kecepatan rilis. Semua tetap dalam batas aturan di sini.
5. Mutasi layanan eksternal apa pun (Google Workspace, Git remote, deployment) butuh
   persetujuan eksplisit dari pemilik per aksi. Jangan pernah push, release, atau
   memanggil API mutasi tanpa ACC.
6. Jangan mengarang isi, struktur data, atau perilaku yang belum diputuskan. Jika ada
   yang belum jelas, tulis sebagai `TODO(pertanyaan)` dan tanyakan.
7. Selama development, test HANYA bagian yang tersentuh perubahan (lihat bagian 14.1).
   Full suite hanya di akhir, per-intah, berhenti saat ada gagal. Jangan mengulang
   gate yang sudah lulus tanpa perubahan kode. Jangan merangkai pkill+audit+build
   dalam satu script panjang.
8. Sebelum `pkill` atau mematikan proses/port, cek dulu apakah proses/port benar-benar
   masih hidup. Bila perlu mematikan, lakukan inkremental dengan timeout bertahap
   (lihat bagian 14.2). Jangan asal `pkill` berulang sampai kena timeout tool.

### Aturan kerja wajib (ditegakkan setiap kali membuat fitur)

Dokumen ini adalah PRD sekaligus kontrak kerja. Setiap kali mengerjakan apa pun,
urutan ini WAJIB dijalankan:

1. SEBELUM menulis kode, buka dan baca kembali bagian dokumen yang relevan dengan
   fitur yang sedang dikerjakan. Jangan mengandalkan ingatan. Sebutkan di ringkasan
   kerja bagian mana yang jadi acuan (misal: "acuan bagian 6 dan 8.2").
2. SEBELUM menulis kode, periksa checklist singkat berikut terhadap rencana:
   - Apakah ada aturan kalender (bagian 6) yang tersentuh?
   - Apakah ada animasi, dan apakah mematuhi properti terlarang (bagian 8.2)?
   - Apakah ada warna, dan apakah hanya lewat token (bagian 10)?
   - Apakah ada ikon, dan apakah memakai lucide tanpa emoji (bagian 9)?
   - Apakah menyentuh dokumen cetak, dan apakah mematuhi bagian 11 dan 12?
   - Apakah memengaruhi performa, dan apakah anggaran bagian 13 masih aman?
   - Apakah logika murni ini seharusnya ada di `lib/domain/` dan diuji (bagian 4, 14)?
   - Apakah butuh mutasi eksternal, dan apakah sudah ada ACC pemilik (bagian 0.5)?
3. SAAT menulis kode, patuhi penempatan folder (bagian 4), konvensi kode (bagian 17),
   dan gaya output (bagian 0).
4. SETELAH selesai, jalankan checklist bagian 19 dan perbarui dokumen ini pada commit
   yang sama bila perilaku berubah.
5. Jika sebuah permintaan bertentangan dengan dokumen ini, JANGAN diam-diam
   menyimpang. Berhenti, tunjukkan bagian mana yang bertentangan, dan minta keputusan
   pemilik lebih dulu.
6. Jika menemukan aturan di dokumen ini yang ternyata salah atau kurang, ajukan
   perubahan eksplisit, jangan langsung mengubahnya.

Ringkasan status pekerjaan (fase mana yang sedang dikerjakan, apa yang sudah selesai,
apa yang berikutnya) dipelihara di bagian 20 pada dokumen ini, agar sesi baru agen
langsung tahu posisinya.

### Gaya output agen

- Bahasa percakapan: Indonesia. Bahasa kode, identifier, komentar kode, dan commit:
  mengikuti konvensi teknis (Inggris) kecuali konten dokumen Log Book yang berbahasa
  Indonesia.
- Dilarang em dash. Gunakan tanda hubung biasa, koma, atau titik.
- Dilarang emoji di output maupun di dalam file proyek, termasuk sebagai ikon.
- Ringkas dan langsung. Hindari basa-basi dan pengulangan.

---

## 1. Tujuan proyek dan konteks

Pemilik harus menyetor laporan kegiatan magang bulanan ke kampus. Laporan berbentuk
dokumen cetak (PDF) berisi tabel kegiatan harian Senin sampai Sabtu, satu halaman per
minggu, yang dicetak, ditandatangani basah oleh mahasiswa, dosen pembimbing, dan
pembimbing lapangan.

Aplikasi ini:
- Menyimpan profil mahasiswa dan rentang tanggal magang.
- Menampilkan daftar Log Book per bulan dan per minggu secara otomatis dari rentang.
- Menyediakan editor yang menyerupai dokumen: user mengedit langsung di sel tabel.
- Merekam kegiatan harian beserta jam masuk, jam pulang, dan alasan bila hari kosong.
- Menyimpan otomatis saat user mengetik.
- Menghasilkan preview A4 dan mengekspor PDF siap cetak.

Bukan tujuan (out of scope saat ini):
- Multi-user, autentikasi, atau backend terpusat.
- Sinkronisasi cloud.
- Edit kolaboratif real-time.
- Aplikasi mobile native.

---

## 2. Keputusan yang sudah dikunci

Daftar ini hasil diskusi perencanaan. Jangan diubah tanpa persetujuan pemilik.

### 2.1 Lokasi dan repo

- Lokasi: `/home/khip/App/log-book-magang/logman`
- Remote: `https://github.com/Khip01/logman.git`, branch `main`.
- Lisensi: Apache 2.0.

### 2.2 Bias dan prinsip

- Ini proyek yang dirawat oleh agen AI, bukan manusia. Struktur folder harus berfungsi
  sebagai peta navigasi bagi agen.
- Ketat pada performa dan stabilitas client side. Pemilik siap menerima kerumitan demi
  hasil yang aman.
- Animasi UI ekspresif dan mulus, tetapi dibatasi properti murah (lihat bagian 8).
- Tech stack harus sangat dipahami oleh model agen untuk menulis, men-debug, membaca
  log, dan menguji.

---

## 3. Tech stack (final)

| Area | Pilihan | Alasan |
| --- | --- | --- |
| Build | Vite 8 | Ringan, minim magic, HMR instan, banyak dipahami agen |
| UI | React 19 + TypeScript | Standar, paling fasih bagi model agen |
| Compiler | React Compiler aktif | Auto-memoization, hilangkan kelas bug memoisasi manual |
| Styling | Tailwind v4 | Utility menempel di JSX, agen tahu titik edit persisnya |
| Varian | CVA + clsx + tailwind-merge | Pola standar shadcn, ringkas dan konsisten |
| Animasi | Motion (`motion/react`) + LazyMotion | Deklaratif, fasih bagi agen, bundle fitur dimuat terpisah |
| Animasi util | tw-animate-css | Keyframe utilitas untuk Tailwind |
| Komponen | Radix via shadcn/ui | Aksesibilitas dan keyboard beres, direstyle total |
| Ikon | lucide-react | SVG stroke konsisten, tree-shakable, fasih bagi agen |
| State | Zustand (selector) | Sekitar 1 KB, cegah re-render berantai |
| Lint/format | Biome | Satu tool, cepat, error ramah agen |
| Server | Hono | Server mini untuk IO file, PDF, log |
| Unit test | Vitest + Testing Library | Cepat, jsdom, terintegrasi Vite |
| E2E test | Playwright + @axe-core/playwright | Browser nyata, screenshot, a11y, PDF |
| Bundle analisis | rollup-plugin-visualizer | Anggaran ukuran bundle terukur |
| Paket manager | pnpm | Cepat, hemat disk, konsisten |

Ditolak dan alasannya (jangan dipakai tanpa persetujuan):
- Next.js App Router: overkill untuk tool lokal single-user, menambah footgun RSC,
  hydration, dan semantik caching yang sulit di-debug tanpa melihat layar.
- SCSS: kalah dari CSS custom properties untuk tema runtime, menambah toolchain tanpa
  manfaat nyata. Tailwind v4 sudah punya nesting dan layer reuse.
- LaTeX/Typst sebagai engine dokumen: menambah renderer kedua dan dependency binari.
- ESLint + Prettier: digantikan Biome.
- Emoji sebagai ikon: dilarang.

---

## 4. Struktur folder

Struktur adalah peta navigasi agen. Jangan menambah folder tingkat atas tanpa persetujuan.

```
logman/
├── AGENTS.md            # dokumen ini
├── run                  # ./run -> jalankan dev (Vite + server Hono)
├── run.cmd              # launcher Windows
├── run.ps1              # launcher PowerShell
├── LICENSE, NOTICE      # lisensi Apache-2.0 dan atribusi
├── CHANGELOG.md         # riwayat rilis, bahasa Inggris
├── packaging/           # pintu masuk desktop: .desktop, .bat, .vbs, .command
├── package.json
├── biome.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── .github/
│   └── workflows/
│       ├── ci.yml       # lint, typecheck, unit, build+budget, e2e, a11y, perf
│       └── release.yml  # tag v* -> build produksi + GitHub Release
├── src/
│   ├── app/             # routing dan halaman. Tiap route lazy-loaded.
│   ├── components/
│   │   ├── ui/          # primitif shadcn yang sudah direstyle
│   │   │   └── icons/   # ikon SVG buatan sendiri (non-Lucide)
│   │   └── shared/      # Sidebar, TopHeader, StatusBar, Shell
│   ├── features/        # per fitur: UI + hook + logikanya sendiri
│   │   ├── logbook/
│   │   ├── editor/
│   │   ├── settings/    # termasuk pencarian menu (bagian 22)
│   │   └── export/
│   ├── motion/          # layer preset animasi terregistrasi
│   ├── lib/
│   │   ├── domain/      # logika murni: tanggal, kepemilikan bulan, validasi
│   │   ├── i18n/        # katalog pesan, locale, mesin terjemahan (bagian 21)
│   │   ├── repo/        # LogRepository + HttpLogRepository + InMemoryLogRepository
│   │   ├── log/         # logger terstruktur dengan traceId
│   │   └── utils/       # helper umum
│   ├── stores/          # Zustand store
│   └── styles/
│       ├── tokens.css   # 9 tema sebagai CSS custom properties + @theme Tailwind
│       └── globals.css  # base, scrollbar, print CSS, reduced-motion
├── server/              # Hono: config, logs, PDF, backup, dialog folder, logging
├── data/                # data runtime (gitignored)
│   ├── config.json
│   ├── logs.json
│   ├── backups/
│   ├── exports/         # hasil PDF default bila folderExport dikosongkan
│   └── logs/            # log aplikasi (JSON lines)
├── e2e/                 # Playwright: spec, snapshot, fixture
├── scripts/             # audit animasi saat build, utilitas
├── public/              # aset statis (logo letterhead, favicon)
├── dev/                 # halaman dev: /dev/components, /dev/motion, /dev/perf
└── dist/                # hasil build produksi (gitignored)
```

Aturan penempatan (jangan dilanggar):
- Logika yang bisa diuji tanpa React WAJIB di `src/lib/domain/`. Murni, tanpa side effect.
- Akses data HANYA lewat `LogRepository`. UI tidak boleh memanggil HTTP langsung.
- Komponen atomik di `components/ui/`. Komposisi besar di `components/shared/`.
- Satu fitur, satu folder di `features/`. Jangan campur antar fitur.

---

## 5. Model data

### 5.1 `data/config.json` (konfigurasi, file terpisah dari list log)

```
{
  "profil": {
    "nama": "string",
    "nim": "string",
    "programStudi": "string (default: Sarjana Terapan Teknik Informatika)",
    "mitraIndustri": "string (default: PT Naraya Telematika)"
  },
  "magang": {
    "mulai": "YYYY-MM-DD",
    "selesai": "YYYY-MM-DD"
  },
  "jamDefault": {
    "senin": { "masuk": "08.00", "pulang": "16.00" },
    "selasa": { "...": "..." },
    "rabu": { "...": "..." },
    "kamis": { "...": "..." },
    "jumat": { "...": "..." },
    "sabtu": { "...": "..." }
  },
  "alasan": ["Libur Nasional", "Cuti Bersama", "Izin", "Sakit", "Tanpa Keterangan"],
  "tema": "hitam-pekat",
  "tierAnimasi": "penuh",
  "ukuranKertas": "A4",
  "folderExport": "string (path lokal, kosong berarti pakai default data/exports)",
  "formatJam": "24",
  "fontDokumen": "times",
  "contentScale": 1,
  "bahasa": "id",
  "tampilkanDevUi": false,
  "dosenPembimbing": "string",
  "pembimbingLapangan": ["string", "..."],
  "pembimbingLapanganDefault": "string atau null"
}
```

- `magang.mulai` dan `magang.selesai` WAJIB diisi sebelum daftar Log Book muncul.
  Tanpa rentang, halaman daftar hanya menampilkan arahan ke Settings.
- `alasan` adalah daftar yang bisa dikelola user. Selain dropdown, user boleh mengetik
  teks bebas yang tidak ada di daftar.
- `jamDefault` per hari. Bila user mengosongkan jam pada form, nilai default ini dipakai.
- `formatJam` hanya memengaruhi cara jam DITAMPILKAN dan DIMASUKKAN di UI, nilainya `24`
  atau `12`. Nilai jam yang disimpan selalu 24 jam format titik (`08.00`), dan dokumen
  cetak serta PDF selalu 24 jam format titik sesuai template resmi.
- `fontDokumen` memilih font saat CETAK dan pada PDF (tabel, kop, blok tanda tangan),
  nilainya `times` atau `arial`. Di layar tabel memakai font UI (Inter), sehingga UI
  aplikasi selalu konsisten. Nilai rangkaian font disimpan sekali di
  `FONT_DOKUMEN_STACK` (`src/lib/domain/dokumen.ts`) dan dipakai server PDF, sedangkan
  `tokens.css` menyalin rangkaian yang sama di `[data-doc-font]`. Keduanya WAJIB sinkron.
- `contentScale` mengatur skala ukuran konten Log Book di LAYAR, nilai bawaan 1 dengan
  preset `0.9`, `1`, `1.15`, dan `1.3`. Hanya memengaruhi tampilan layar; dokumen cetak
  dan PDF selalu 12 pt sesuai template resmi.
- `bahasa` mengatur bahasa antarmuka, nilai `id` atau `en` dengan default `id`. Hanya
  memengaruhi teks antarmuka. Dokumen cetak dan PDF SELALU bahasa Indonesia karena
  mengikuti template kampus (bagian 21).
- `folderExport` kosong berarti ekspor ditulis ke folder default `data/exports` di dalam
  project (tercakup `.gitignore` lewat `data/`).
- `tampilkanDevUi` default `false`. Bila mati, menu Dev di sidebar disembunyikan DAN
  route `/dev/*` diblokir (dialihkan ke Log Book). Menyala hanya saat user mengaktifkan
  opsi di Settings.
- `dosenPembimbing` nama default Dosen Pembimbing untuk blok tanda tangan.
- `pembimbingLapangan` daftar nama pembimbing lapangan yang bisa dipilih per minggu.
  `pembimbingLapanganDefault` nama yang terpilih secara default, selalu salah satu dari
  daftar atau null bila daftar kosong.

### 5.2 `data/logs.json` (satu file untuk semua log)

- Satu file JSON global. BUKAN satu file per bulan.
- Berisi seluruh minggu dan seluruh entri hari.
- Struktur internal bebas dirancang, namun harus mendukung: identifikasi minggu,
  tanggal tiap hari, jam masuk, jam pulang, isi kegiatan, status hari (terisi, kosong,
  libur, sakit, izin), dan alasan bila kosong.
- Menyimpan juga `namaPenandaTangan`: peta `weekId` ke override nama penanda tangan
  (`mahasiswa`, `dosen`, `pembimbing`). Field yang tidak ada jatuh ke default config.
  Nama mahasiswa defaultnya `profil.nama`, dosen defaultnya `dosenPembimbing`, dan
  pembimbing defaultnya `pembimbingLapanganDefault`.
- Perubahan disimpan otomatis (lihat bagian 7).

### 5.3 Backup

- `data/backups/` menyimpan rotasi beberapa versi terakhir `logs.json` dan `config.json`.
- Rotasi dibuat sebelum penulisan yang menimpa, supaya salah edit bisa dipulihkan.
- Autosave menimpa file utama secara langsung, jadi backup bukan opsional.

### 5.4 Akses data (DIP)

- Interface `LogRepository` dan `ConfigRepository` di `src/lib/repo/`.
- Implementasi `HttpLogRepository` untuk runtime, `InMemoryLogRepository` untuk test dan CI.
- `LogRepository.patchDays` menyimpan perubahan hari, `patchNamaMinggu` menyimpan
  override nama penanda tangan satu minggu, `replaceAll` menimpa seluruh data.
- CI dan test TIDAK boleh menyentuh filesystem nyata.
- Menambah backend baru tidak boleh mengubah UI.

---

## 6. Aturan kalender: bulan, minggu, dan kepemilikan baris

Ini aturan paling mudah salah. Baca dengan teliti. Semua logika ini WAJIB murni dan diuji.

1. Minggu adalah wadah (container). Satu minggu berisi baris hari Senin sampai Sabtu.
2. Kepemilikan baris hari mengikuti BULAN dari TANGGAL hari itu, bukan bulan minggunya.
3. Sebuah minggu boleh berisi baris dari dua bulan berbeda. Ini wajar dan harus didukung.
4. Contoh: minggu Senin 31 Agustus sampai Sabtu 5 September.
   - Baris Senin 31 Agustus menjadi milik grup Agustus (minggu terakhir Agustus).
   - Baris Selasa 1 September sampai Sabtu 5 September menjadi milik grup September
     (minggu 1 September).
5. Baris yang bukan milik bulan yang sedang dibuka TETAP DITAMPILKAN, namun jam masuk,
   jam pulang, dan kegiatan di-DISABLE dan diberi warna redup, seperti tanggal di
   kalender. Tanggalnya tetap terlihat.
6. Minggu yang melewati batas bulan MUNCUL DI DUA bulan. Saat ekspor bulanan, PDF bulan
   ini dan bulan berikutnya memuat minggu tersebut, masing-masing dengan baris yang
   relevan terisi dan baris lainnya disabled.
7. Nomor minggu (M1, M2, ...) DI-RESET PER BULAN. Minggu pertama tiap bulan adalah M1.
8. Aturan yang sama menangani minggu pertama rentang magang yang tidak mulai hari Senin.
   Hari sebelum `magang.mulai` berperilaku persis seperti baris milik bulan lain:
   tampil, disabled, redup. Tidak ada perlakuan khusus terpisah.
9. Setelah `magang.selesai`, perlakuan sama: tampil, disabled, redup.

Konsekuensi: satu fungsi murni menentukan, untuk setiap (tanggal, bulan yang sedang
dibuka), apakah baris tersebut aktif atau disabled. Fungsi inilah sumber kebenaran dan
wajib punya unit test lengkap, termasuk kasus lintas bulan, lintas tahun, dan rentang
partial di kedua ujungnya.

Catatan implementasi navigasi (fase 5):
- Halaman Log Book menampilkan SATU bulan aktif pada satu waktu, dengan tombol maju dan
  mundur. Bulan yang memuat hari ini dipilih otomatis; bila hari ini di luar rentang,
  bulan pertama yang dipakai. Pilihan disimpan di store `logbook`, struktur bulan tetap
  diturunkan dari rentang.
- Pemilih minggu di halaman berupa tab M1, M2, ... untuk bulan aktif.
- Karena minggu lintas bulan muncul di dua grup, memilih minggu SELALU menyertakan bulan
  konteks (`selectWeek(weekId, monthKey)`). Tanpa konteks itu, baris milik bulan yang
  salah yang akan dianggap aktif.
- Rail sidebar (saat tertutup) menampilkan label bulan 3 huruf. Mengkliknya membuka
  popover berisi daftar minggu bulan itu, sehingga user tetap bisa memilih minggu tanpa
  membuka drawer.

---

## 7. Autosave dan status simpan

- User mengetik di sel, perubahan disimpan otomatis ke server, yang menulis ke JSON.
- Debounce 500 ms. Jangan menyerialkan seluruh file tiap ketikan, hanya bagian berubah.
- Optimistic update: UI berubah langsung, penyimpanan menyusul.
- Status bar sticky di bawah (posisi seperti status bar VS Code), selalu terlihat,
  menampilkan salah satu status:
  - Tersimpan (sejak perubahan terakhir sudah tersimpan)
  - Menyimpan (sedang menulis)
  - Ada perubahan (menunggu debounce)
  - Gagal (tampilkan aksi coba lagi)
- Status bar juga menampilkan status simpan konfigurasi dari Settings.
- Pojok kanan status bar menampilkan versi aplikasi (`logman v<versi>`). Nilainya
  dibaca dari `version` di `package.json` lewat `define` di `vite.config.ts`, sehingga
  tidak pernah basi. Akses dibungkus `appVersion()` di `src/lib/appVersion.ts` supaya
  dev dan test tetap aman.
- Autosave menimpa langsung, maka rotasi backup di bagian 5.3 wajib berjalan.

---

## 8. Animasi

### 8.1 Tier animasi (manual, bukan otomatis)

- Tier ada di Settings. TIDAK ADA autodetect. Default: Penuh.
- Nilai: `penuh`, `seimbang`, `minimal`, `mati`.
- Tier hanya mengurangi gerakan sekunder (stagger, gelombang, animasi idle, partikel),
  bukan menghilangkan karakter UI. Di tier `mati` semua transisi non-esensial hilang.
- Hormati `prefers-reduced-motion` sebagai tambahan, dan tetap sediakan override manual.
- Tier aktif disimpan di `config.json` dan diterapkan lewat atribut di `<html>`.
- Sumber kebenaran profil tier: `src/motion/tiers.ts` (`MOTION_TIER_PROFILE`). Menambah
  atau mengubah kadar animasi dilakukan di file itu, bukan tersebar di komponen.
- Settings WAJIB menampilkan PRATINJAU mini window untuk tier yang sedang dipilih, di
  bawah kontrol tier. Pratinjau memperlihatkan gerakan panel, stagger baris, dan denyut
  idle sesuai tier, plus tombol "Putar ulang". Pratinjau memakai preset dari
  `buildTierPreviewVariants` di `src/motion/presets.ts`.
- Animasi idle di pratinjau (dan di mana pun) WAJIB di-pause saat tab tidak aktif,
  memakai `useDocumentVisible`.

### 8.2 Aturan properti (disiplin performa, ditegakkan)

DILARANG menganimasikan properti pemicu layout:
`width`, `height`, `top`, `left`, `right`, `bottom`, `margin`, `padding`, `border-width`,
`font-size`.

WAJIB menganimasikan hanya properti murah:
`transform`, `opacity`.

Aturan tambahan:
- Blur dan box-shadow besar hanya statis, tidak dianimasikan.
- `will-change` dipakai hemat dan DILEPAS setelah animasi selesai. Jangan ditumpuk terus.
- Animasi idle (misal gradient bergerak) di-pause saat tab tidak aktif.
- Accordion tinggi memakai `grid-template-rows` transition atau `scaleY` dengan
  transform-origin, bukan animasi `height`.
- Transisi warna hanya pada properti spesifik (`color`, `background-color`,
  `border-color`) dan hanya pada elemen shell. DILARANG `transition: all` dan DILARANG
  memakai selector `*` untuk transisi.
- Transisi dimatikan selama pengetikan agar tidak ada repaint di jalur input.

PENGECUALIAN SEMPIT yang didokumentasikan (jangan diperluas tanpa persetujuan):
- Reveal transisi tema menganimasikan `clip-path` pada pseudo-element
  `::view-transition-new(root)`. Ini lapisan snapshot compositor milik View Transitions
  API, bukan elemen DOM hidup, dan hanya berjalan saat tier mengizinkan. Semua properti
  lain tetap tunduk pada aturan di atas. Implementasi: `src/lib/theme/themeTransition.ts`.

CATATAN PENTING soal efek border dan kilau (bagian 22): DILARANG menganimasikan
`border-color`, `border-width`, `background-position`, `box-shadow`, maupun `clip-path`
untuk membuat efek ini. Semuanya dibuat dari elemen berukuran TETAP yang hanya
dianimasikan `transform` dan `opacity`. Pendinginan border memakai `box-shadow` yang
STATIS (nilai tidak berubah), sesuai aturan "box-shadow besar hanya statis".

### 8.3 Layer preset animasi

- Semua animasi hidup di `src/motion/` sebagai preset terregistrasi.
- DILARANG menulis `motion.div` tersebar di banyak komponen. Gunakan preset.
- Menambah animasi berarti menambah preset di registry, bukan menyebar logika.
- Setiap preset punya perilaku yang jelas untuk tiap tier.
- Animasi berat dimuat on demand dengan LazyMotion, bukan global.
- Elemen anak yang dianimasikan WAJIB memakai `variants`, `initial`, dan `animate`
  secara eksplisit. Jangan hanya memasang `variants` lalu mengandalkan propagasi dari
  induk, karena elemen yang dipasang ulang (misalnya `key` berubah) akan langsung
  tampil pada keadaan akhir tanpa animasi.
- Preset yang tersedia: `overlayVariants`, `sidebarVariants`, `staggerListVariants`,
  `listItemVariants`, `pageVariants`, `pulseVariants`, `buildTierPreviewVariants`
  (pratinjau tier di Settings), `buildRowFlashVariants` (kilatan baris dari banner
  validasi, bagian 11.3), serta `buildSectionGlintLayerVariants`,
  `buildSectionShineVariants`, dan `buildSectionBorderVariants` (kilau seksi Pengaturan,
  bagian 22). Pasangan `rowFlashDurationSeconds` dan `sectionGlintDurationSeconds` memberi
  lama animasi yang dipakai bersama oleh varian dan oleh pemanggilnya.

### 8.3.1 Jebakan `AnimatePresence initial={false}` (WAJIB DIINGAT)

- DILARANG memberi `initial={false}` pada `AnimatePresence` yang membungkus konten
  halaman. Nilai itu menyebar lewat konteks ke SELURUH komponen Motion di dalam pohon,
  sehingga semua animasi masuk (pratinjau tier, kartu, panel) ikut dilewati tanpa error
  apa pun. Gejalanya: animasi mount tidak pernah jalan, tetapi animasi yang dipicu
  perubahan state (misalnya drawer) tetap jalan. Ini pernah terjadi dan sulit dilacak.
- Halaman cukup memakai `initial="hidden"` biasa pada `m.div`. Animasi masuk halaman
  pada muat pertama memang diinginkan.
- `initial={false}` pada komponen `m.*` biasa tidak menyebar ke anak, jadi masih aman
  bila memang perlu mematikan animasi satu elemen saja.

### 8.3.2 Pengecualian `layout` pada tombol yang tinggi mengikuti sisa ruang

Tombol buka/tutup sidebar tingginya mengikuti sisa ruang, sehingga berubah saat daftar
bulan bertambah atau label bulan dibuka. Aturan "hanya transform dan opacity" tetap
dipertahankan pada level PROP:

- DILARANG menganimasikan `height`, `width`, `top`, `left`, `margin`, `padding`, dan
  sejenisnya lewat prop animasi Motion.
- Untuk perpindahan tinggi, tombol memakai prop `layout` Motion. Perpindahan itu
  diterapkan lewat `transform` pada elemen pembungkus internal, sehingga tetap patuh
  pada aturan. Ini juga SATU-SATUNYA kemunculan `layout` dan hanya di dalam
  `src/components/shared/Sidebar.tsx`.
- Transisi yang dipakai adalah `popTransition` dari `src/motion/presets.ts`.
- Konsekuensinya, `LazyMotion` di `src/motion/MotionProvider.tsx` TIDAK memakai mode
  `strict`, karena strict memblokir fitur `layout` DAN memblokir prop `layout` diam
  tanpa error. Pengganti penjaganya adalah `scripts/audit-motion.mjs` yang kini ikut
  menolak impor Motion global dan membatasi prop `layout` di luar Sidebar.

### 8.4 Arah visual

- Animasi harus terasa ekspresif dan khas, bukan default HTML/CSS dasar.
- Boleh memakai spring, stagger, shared layout, transisi halaman, gelombang halus.
- Tetap tunduk pada seluruh batasan di atas.

---

## 9. Ikon

- Semua ikon dari `lucide-react`. DILARANG emoji sebagai ikon, kapan pun.
- Ukuran default 16 sampai 20 px. `strokeWidth` 1.75 untuk body, 2 untuk aksi utama.
- Warna ikon mengikuti `currentColor` agar otomatis ikut tema.
- Ikon yang beranimasi dibungkus Motion, bukan GIF atau emoji.
- Ikon non-Lucide (logo, favicon) sebagai SVG buatan sendiri di `components/ui/icons/`,
  satu file per ikon.
- Rail sidebar saat collapse TIDAK memakai ikon untuk bulan, melainkan teks 3 huruf
  (Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des).
- Logo letterhead Polinema memakai PNG hasil ekstraksi dari docx
  (`public/letterhead-polinema.png`), bukan ikon UI, karena bagian resmi dokumen cetak.
- Favicon: SVG monokrom, huruf L, senada aksen.

---

## 10. Tema

- 9 tema, dipilih lewat CSS custom properties di `<html data-theme="...">`.
- Daftar tema:
  - Gelap: `hitam-pekat` (default, seperti proxman), `hitam-abu`, `hitam-pastel`.
  - Terang: `putih-bersih`, `putih-pastel`, `putih-tulang`, `putih-gdocs`,
    `putih-word`, `word-dark`.
- Aksen SELALU monokrom: putih pada tema gelap, hitam pada tema terang.
  DILARANG aksen biru atau warna merek pihak ketiga. Tema boleh terinspirasi suasana
  Google Docs atau Microsoft Word, tetapi aksen tetap milik kita.
- Warna status tetap: hijau (sukses), kuning (peringatan), merah (gagal).
- Token kilau seksi (`--glint-shine`, `--glint-glow`, dan gradien bersama
  `--glint-fill` yang dibangun dari `--glint-shine`) juga tinggal di `tokens.css` dan
  diatur PER TEMA, supaya kilau terasa menyatu dengan suasana temanya: tema gelap memakai
  kilau terang, tema terang memakai kilau gelap yang lembut, dan tema bernuansa (pastel,
  tulang, Google Docs, Word) memakai kilau yang mengikuti warna aksennya. Tetap monokrom,
  tidak ada warna merek pihak ketiga (bagian 22).
- Ganti tema WAJIB beranimasi halus. Urutan penerapan (implementasi:
  `src/lib/theme/themeTransition.ts`):
  1. Tema diterapkan di dalam callback View Transitions, agar snapshot lama masih
     memakai tema sebelumnya.
  2. Snapshot baru di-reveal melingkar (`clip-path` pada `::view-transition-new(root)`)
     dari titik klik kartu tema. Ini satu-satunya animasi `clip-path` yang diizinkan
     (lihat pengecualian sempit di bagian 8.2).
  3. Selama transisi berjalan, kelas `theme-transitioning` di `<html>` mematikan
     transisi warna per elemen agar snapshot menangkap keadaan final, bukan keadaan
     di tengah transisi.
- Fallback wajib: bila View Transitions tidak didukung, atau tier `mati`, atau user
  memakai `prefers-reduced-motion`, tema diterapkan langsung dan transisi warna halus
  dari kelas `.theme-t` yang mengambil alih. Jangan pernah membuat tema gagal berubah.
- Durasi reveal per tier diambil dari `MOTION_TIER_PROFILE[tier].revealDuration`.
- Pemilih tema berupa grid kartu swatch, tiap kartu miniatur shell aplikasi dalam tema
  tersebut. Hover terangkat, terpilih diberi ring dan badge centang beranimasi.
- PENTING: atribut `data-theme` pada kartu miniatur hanya dipasang di area miniatur,
  BUKAN di seluruh kartu, agar label tema terang tidak ikut menjadi gelap di atas
  latar aplikasi.
- DILARANG radio button atau checkbox bawaan browser yang polos. Gunakan komponen
  kustom: toggle switch, segmented control, kartu pilihan, slider.
- Semua token warna hanya di `src/styles/tokens.css`. DILARANG menulis nilai hex warna
  langsung di komponen.
- Setiap blok tema menetapkan `color-scheme` (`dark` untuk tema gelap, `light` untuk
  tema terang). Ini membuat kontrol native browser (misal pemilih tanggal, scrollbar,
  autofill) memakai palet yang benar. Tanpa ini, ikon pemilih tanggal nyaris tak
  terlihat di sebagian tema terang. Kontrol native yang masih kurang jelas diganti
  komponen bertema (lihat `DateInput` dan `TimePicker` di bagian 10.1).
- Area dokumen A4 tetap bersih: monokrom, tanpa aksen, tanpa animasi. Preview harus sama
  dengan hasil cetak.
- Font dan ukuran layer dokumen diatur lewat token `--doc-font-family` dan
  `--content-scale`, bukan nilai hex atau angka yang ditulis di komponen. Pilihan font
  dipasang sebagai `data-doc-font` di `<html>`, sedangkan skala konten ditulis sebagai
  custom property runtime. Lihat bagian 5.1 dan 11.2.

### 10.1 Primitif UI (`src/components/ui/`)

- Satu komponen, satu file. Ekspor lewat barrel `src/components/ui/index.ts`.
- Varian memakai CVA. Nama variant dan size harus konsisten antar komponen.
- Radix hanya untuk perilaku dan aksesibilitas. Tampilan selalu direstyle total ke token
  kita. DILARANG membiarkan gaya bawaan Radix atau shadcn apa adanya.
- Komponen yang tersedia:
  - Dasar: `Button`, `Card` (+ Header/Title/Description/Content/Footer), `Badge`,
    `Separator`, `Kbd`, `Spinner`, `EmptyState`.
  - Form: `Input`, `Textarea`, `Label`, `Field`, `Switch`, `Checkbox`, `Slider`,
    `Select`, `Combobox`, `SegmentedControl`, `DateInput`, `TimePicker`.
  - Overlay: `Dialog`, `Popover`, `Tooltip` (+ `SimpleTooltip`).
- `Combobox` mendukung pilih dari daftar DAN teks bebas. Ini dipakai untuk kolom alasan
  hari kosong (bagian 11.3) dan pemilih Pembimbing Lapangan (bagian 11.5).
- `DateInput` menyembunyikan indikator kalender bawaan browser (yang warnanya mengikuti
  `color-scheme` dan nyaris tak terlihat di sebagian tema) dan memakai ikon Lucide
  bertema. Ikon tetap membuka pemilih bawaan lewat `showPicker` bila didukung.
- `TimePicker` adalah input jam dengan pemicu popover berisi grid jam, menit, dan toggle
  AM/PM pada format 12 jam. Nilai yang disimpan selalu 24 jam format titik.
- `SegmentedControl` memakai shared layout Motion untuk indikator geser. Selalu beri
  `aria-label`.
- Tombol bahaya memakai varian `danger` bergaya outline merah. Latar merah solid dengan
  teks putih DILARANG karena gagal rasio kontras AA.
- Setiap primitif baru WAJIB didaftarkan di galeri `/dev/components` (bagian 15).
- Aksesibilitas adalah syarat, bukan tambahan:
  - Semua kontrol harus punya nama yang dapat dibaca (label, `aria-label`, atau
    `aria-labelledby`). Slider tanpa nama pernah lolos dan ditangkap axe.
  - Teks kecil (11 sampai 13 px) wajib memenuhi kontras WCAG AA 4.5:1 pada SEMUA tema.
  - DILARANG memakai utilitas `opacity-*` pada teks untuk menandai "nonaktif", karena
    menurunkan kontras. Gunakan token warna redup atau `Badge` status.
  - Teks status memakai token `--status-ok-text`, `--status-warn-text`,
    `--status-error-text` yang nilainya berbeda untuk tema gelap dan terang. DILARANG
    memakai warna status mentah (`--status-ok` dan sejenisnya) sebagai warna teks.
  - Verifikasi otomatis: `pnpm audit:a11y` (menyapu semua halaman x semua tema).

---

## 11. Dokumen dan editor

### 11.1 Referensi template asli

Sumber: `Log Book Template.docx` (diektrak ke `docs/reference/`).

Fakta terverifikasi dari template:
- Ukuran halaman A4, 210 x 297 mm. Margin 2.54 cm semua sisi.
- Font dokumen: Times New Roman 12 pt.
- Kop surat (letterhead) berisi logo Polinema di sisi kiri dan teks:
  KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI / POLITEKNIK NEGERI MALANG /
  JURUSAN TEKNOLOGI INFORMASI, beserta alamat dan telepon.
- Tabel kegiatan: 4 kolom (Hari, Tanggal | Jam Masuk | Jam Pulang | Kegiatan).
- Tinggi baris minimum 1.80 cm, dengan aturan `atLeast` (baris tumbuh mengikuti isi).
- 6 baris kegiatan: Senin sampai Sabtu.
- Header tabel berwarna shading abu `#D0CECE`.
- Blok tanda tangan: Mahasiswa, dan Mengetahui (Dosen Pembimbing serta Pembimbing
  Lapangan).
- Nilai default jam pada template: 08.00 masuk, 16.00 pulang.

### 11.2 Perilaku editor (direct manipulation)

- User mengedit LANGSUNG di sel tabel. Tidak ada dialog input.
- Sel berisi `input` atau `textarea` borderless yang mengisi penuh sel. Saat tidak
  fokus tampak seperti teks dokumen, saat fokus muncul outline tipis.
- DILARANG memakai `contenteditable` (rawan cursor lompat dan paste berformat).
- Tinggi baris minimum 1.80 cm dan TUMBUH mengikuti isi. Textarea di-set
  `height = scrollHeight` setiap ketikan. TIDAK ADA scrollbar di dalam sel.
- Sel WAJIB punya padding yang cukup, konten tidak boleh dempet garis tabel.
- Lebar kolom Hari/Tanggal, Jam Masuk, dan Jam Pulang mengikuti lebar konten, melar bila
  panjang (misal `field-sizing: content` dengan `white-space: nowrap`).
- Kolom Kegiatan berlebar tetap dan membungkus ke baris baru (`white-space: pre-wrap`),
  TIDAK melar mengikuti konten. Hanya kolom ini yang berperilaku demikian.
- Tabel dirender simple: border 1 px, tanpa sudut membulat, tanpa bayangan berlebih.
  Di LAYAR, warna tabel (surface, garis, teks) mengikuti tema aktif agar tidak tampak
  sebagai kotak putih di tema gelap. Saat CETAK, tabel kembali ke kertas putih dengan
  header shading `#D0CECE` sesuai template. Hindari tampilan tabel HTML kuno yang jelek.
- Ukuran teks tabel di layar adalah 16 px dikali `contentScale`, sehingga user bisa
  membesarkan konten Log Book tanpa ikut memperbesar UI aplikasi. Saat cetak, ukuran
  dikunci kembali ke 12 pt resmi lewat `@media print`, jadi hasil cetak tidak pernah
  ikut membesar.
- Skala konten diterapkan lewat kelas `.content-scaled` (memakai `zoom`) pada kontainer
  halaman Log Book, dan dinolkan pada `@media print`. Ini properti statis, bukan animasi.
- JEBAKAN `zoom` + `position: fixed`: perhitungan posisi fixed mengabaikan `zoom`, jadi
  elemen fixed (popover, tooltip) akan salah tempat bila berada di dalam pohon ber-zoom.
  Karena itu SEMUA konten overlay WAJIB memakai portal (sudah diterapkan di
  `PopoverContent`), dan elemen fixed aplikasi (sidebar, status bar) berada DI LUAR
  `.content-scaled`.
- Di LAYAR tabel memakai font UI (`--font-sans`, Inter) agar konsisten dengan seluruh
  aplikasi. Font dokumen (`fontDokumen`: Times New Roman atau Arial) hanya dipakai saat
  CETAK dan pada PDF; override `font-family: var(--font-doc)` ada di `@media print`.
- Sel jam di dalam tabel menampilkan angka dan ikon sebagai satu grup terpusat dengan
  `gap-1.5`, supaya angka jam tidak menempel ke ikonnya.
- Format jam DISIMPAN memakai titik 24 jam, misal `08.00`, sesuai template. Tampilan di
  UI mengikuti `formatJam` (24 atau 12 jam) dan bisa diisi lewat `TimePicker`; dokumen
  cetak dan PDF selalu 24 jam format titik.
- Tanggal ditulis format Indonesia, misal `Senin, 5 Januari 2026`.
- Navigasi keyboard: Tab berpindah antar sel, Enter menambah baris baru di kolom Kegiatan.

### 11.3 Hari kosong

- Setiap hari yang kosong WAJIB punya alasan sebelum ekspor.
- Alasan dipilih dari dropdown yang bisa dikelola user, ATAU diketik bebas.
- Khusus Sakit dan Izin: jam masuk dan jam pulang ditampilkan sebagai strip (bukan angka),
  dan kolom Kegiatan diisi alasan tersebut.
- Banner validasi di atas tabel menampilkan daftar hari yang belum lengkap sebelum ekspor.
  Judulnya menyebut jumlah hari, dan banner sukses menyebut bulan aktif.
- Setiap hari pada banner adalah tombol yang dapat ditekan. Menekannya memindahkan user
  ke minggu hari itu, memberi kilatan pada barisnya, lalu memfokuskan field "Ketik
  kegiatan". Jadi user bisa langsung mengetik tanpa klik tambahan.
- Kilatan baris HANYA memakai `opacity` (bagian 8.2): `border-width` dan `box-shadow`
  DILARANG dianimasikan, dan baris tabel TIDAK digeser agar tidak menimpa baris tetangga.
  Kadar kilatan mengikuti tier animasi lewat `flashWaves` di `MOTION_TIER_PROFILE`
  (penuh 3 gelombang, seimbang 2, minimal 1, mati tanpa kilatan). Fokus tetap terjadi di
  semua tier, termasuk `mati`.
- Permintaan fokus disimpan sebagai `focusRequest` (`{ date, token }`) di store logbook.
  `token` naik setiap permintaan supaya klik berulang pada hari yang sama tetap memutar
  ulang animasi dan memfokuskan ulang. Permintaan dibersihkan sendiri setelah kilatan
  selesai, agar baris tidak terfokus lagi saat user berpindah minggu dan kembali.
- Ekspor DITOLAK selama masih ada hari yang belum lengkap: server membalas 422 dengan
  daftar tanggalnya, dan tombol Ekspor di halaman Ekspor dinonaktifkan. Ekspor baru
  jalan setiap hari terisi kegiatan atau punya alasan.

### 11.4 Navigasi

- Sidebar bersifat overlay: menumpuk DI ATAS konten dengan backdrop, TIDAK mendorong
  lebar konten. Backdrop hanya tampil di viewport sempit (`lg:hidden`).
- Saat collapse, sidebar menjadi rail sempit selebar 52 px yang selalu tampil, dengan
  tiga kelompok: tombol logo di atas, ikon aksi cepat (Log Book, Pengaturan, Ekspor)
  di bawahnya, lalu daftar tombol bulan yang dapat digulir, dan TERAKHIR tombol buka
  yang tingginya mengisi seluruh sisa ruang sampai dasar rail. Area klik tombol buka
  sengaja sangat besar supaya pointer tidak perlu presisi.
- Kelompok ikon aksi cepat di rail WAJIB punya `border-b border-border-base`, sebagai
  pemisah terhadap daftar bulan di bawahnya. Ini memasangkan pemisah antar bagian yang
  sudah ada di drawer, supaya keduanya konsisten.
- Klik ikon bulan di rail membuka popover berisi minggu bulan itu (M1, M2, ...). Bulan
  aktif di rail ditandai `aria-current`, dan minggu yang sedang dibuka juga ditandai,
  sehingga user tidak perlu menebak.
- HIGHLIGHT MINGGU AKTIF WAJIB memakai bulan konteks: `week.id === activeWeekId` DAN
  `month.key === activeMonthKey`. Minggu lintas bulan muncul di dua grup dengan id yang
  sama, jadi tanpa syarat bulan konteks keduanya ikut menyala, dan itu salah.
- Di drawer, menekan item bulan HANYA membuka atau menutup daftar minggunya
  (`aria-expanded`). Menekan item bulan TIDAK memilih bulan. Bulan yang dipakai
  mengikuti minggu yang dipilih user, jadi tidak ada dua sumber kebenaran.
- Drawer mengikuti urutan: header logo, nav utama, area gulir berisi daftar bulan, nav
  dev (bila menyala), lalu tombol tutup di BASIS drawer. Tombol tutup itu kembar dengan
  tombol buka di rail: sama-sama memakai ikon garis pemisah plus panah, hanya arahnya
  berlawanan, dan sama-sama `min-h-20` serta tingginya mengisi sisa ruang. Tidak ada lagi
  strip di tepi kanan drawer maupun tombol tutup di header.
- Isi kedua tombol itu selalu di tengah sumbu vertikal tombolnya. Saat tombol tumbuh
  lebih tinggi dari `min-h-20`, isinya ikut bergeser ke tengah, bukan tertinggal di tepi
  bawah. `justify-end` DILARANG di sini karena membuat isi menempel ke tepi bawah dan
  tampak menembus status bar.
- Tombol tutup di drawer memakai trik penyelarasan: isinya dibungkus SATU container yang
  lebarnya `--sidebar-rail-width` dan tingginya `h-full`, lalu container itu ditempel ke
  KANAN tombol (`justify-end` pada tombol, isi di-center di dalam container). Hasilnya
  ikon tombol tutup sejajar dengan ikon rail saat collapsed, tanpa padding atau margin
  manual. Ini satu-satunya tempat `justify-end` diizinkan, karena yang di-justify adalah
  container, bukan isi tombol.
- Status bar adalah elemen FULL WIDTH di paling bawah. Rail dan drawer sama-sama berhenti
  di atasnya (`bottom-[var(--statusbar-height)]`), sehingga tepi bawah keduanya sejajar.
  DILARANG membiarkan rail `inset-y-0` sementara drawer berhenti di atas status bar:
  kombinasi itu membentuk "notch" di sudut kiri bawah.
- Label "Bulan" di dalam area gulir memakai `sticky top-0` dengan latar `--bg-sidebar`,
  sehingga ia menggulir bersama daftar namun berhenti di atas dan tetap terlihat (perilaku
  sliver). Label ini TIDAK punya margin, padding horizontal, atau garis pemisah sendiri:
  pemisah antar bagian sudah disediakan border pada blok nav di sekitarnya, dan label
  tidak boleh terlihat melayang. Daftar bulan punya `min-h-40` supaya tidak pernah terasa
  sempit saat drawer pendek.
- Hanya daftar bulan yang dapat digulir. Header, nav dev, dan tombol tutup tetap di
  tempatnya.
- Membuka sidebar SELALU membuka bulan yang sedang aktif. Jadi sidebar selalu fokus ke
  bulan dan minggu yang sedang dilihat user, bukan ke keadaan sebelum refresh.
- POSISI SCROLL DIINGAT PER HALAMAN selama sesi. Kontainer scroll aplikasi
  (`[data-testid="app-main"]`) tidak pernah diganti saat berpindah halaman, jadi tanpa
  pengelolaan posisi halaman lama terbawa ke halaman baru (halaman pendek tampak mentok
  bawah, halaman panjang tampak di tengah). Aturan:
  - Posisi disimpan saat path berubah, dan dipulihkan sebelum paint di halaman tujuan.
  - Halaman yang belum pernah dikunjungi SELALU mulai dari atas (default 0).
  - Ingatan hanya di memori sesi, BUKAN `sessionStorage`. Refresh atau tab baru mulai
    dari atas.
  - Berganti minggu atau bulan di Log Book (path tetap `/`) TIDAK mengubah posisi.
  - Implementasi: `src/lib/utils/scrollMemory.ts` dipakai `Shell.tsx` lewat
    `ScrollRestore`. DILARANG memakai scroll listener, karena itu menambah biaya pada
    setiap frame gulir; penulisan cukup sekali per navigasi (bagian 13).
- PENANDA BULAN AKTIF (`data-active`) mengikuti BULAN DARI MINGGU YANG SEDANG DIPILIH,
  bukan status buka/tutup. Tepat SATU bulan ditandai, dan penanda itu tetap ada walau
  bulannya tertutup maupun bulan lain sedang dibuka. Penanda hanya berpindah saat user
  memilih minggu di bulan lain. Bulan aktif TIDAK diberi border, latar, atau label
  tambahan, hanya warna teks yang lebih terang.
- Membuka atau menutup sebuah bulan TIDAK memilih bulan, dan memilih minggu TIDAK
  menyentuh keadaan buka/tutup bulan lain. Bulan yang sedang terbuka dibiarkan terbuka
  sampai user sendiri yang menutupnya. Mekanisme "tutup semua bulan lain" DILARANG.
- Menu dan route `/dev/*` hanya muncul bila `tampilkanDevUi` menyala (default mati).
  Saat mati, URL `/dev/*` dialihkan ke Log Book.
- Animasi sidebar memakai spring dan stagger. Tombol buka/tutup yang tingginya berubah
  memakai prop `layout` Motion (lihat pengecualian di bagian 8.3.2).

### 11.5 Nama penanda tangan

- Blok tanda tangan dokumen berisi tiga nama: Mahasiswa, Dosen Pembimbing, dan
  Pembimbing Lapangan.
- Mahasiswa defaultnya `profil.nama`. Dosen defaultnya `config.dosenPembimbing` (satu
  nama). Pembimbing Lapangan defaultnya `config.pembimbingLapanganDefault`, dipilih dari
  daftar `config.pembimbingLapangan` yang bisa berisi lebih dari satu nama.
- Daftar Pembimbing Lapangan dikelola di Settings: tambah lewat tombol plus, hapus lewat
  tombol silang, dan tandai satu sebagai default.
- Ketiga nama bisa disesuaikan PER MINGGU di halaman Log Book. Override disimpan di
  `logs.json` (`namaPenandaTangan`), dan mengosongkan sebuah field berarti kembali ke
  default config.
- Resolusi nama memakai satu fungsi murni bersama (`resolveNamaMinggu` di
  `src/lib/domain/pembimbing.ts`) yang dipakai preview cetak dan `server/pdf.ts`, supaya
  layar dan PDF selalu sama.

---

## 12. Render dokumen dan ekspor

- Engine dokumen: HTML + CSS `@page`. Preview di browser ADALAH dokumen itu sendiri.
  Satu sumber kebenaran, bukan dua renderer.
- Ekspor PDF: Playwright di sisi server, dengan `printBackground` dan
  `-webkit-print-color-adjust: exact` agar shading header dan logo ikut tercetak.
- Ukuran kertas: A4 (default), F4, Letter.
- Satu halaman = satu minggu, berisi 6 baris Senin sampai Sabtu.
- Ekspor menghasilkan PDF PER BULAN, multi-halaman. Page break per minggu.
- Bila satu minggu melebihi tinggi satu halaman, letterhead tetap tampil di setiap
  halaman, sesuai perilaku template asli.
- Kop surat dan blok tanda tangan ikut lengkap di dokumen. Nama pada blok tanda tangan
  (Mahasiswa, Dosen Pembimbing, Pembimbing Lapangan) diambil dari `resolveNamaMinggu`
  yang sama dengan preview cetak, sehingga layar dan PDF selalu konsisten (bagian 11.5).
- Preview cetak di browser memakai elemen print-only: kop surat, judul dan subjudul
  dokumen, tabel identitas pada minggu pertama, dan blok tanda tangan pada minggu
  terakhir. Chrome aplikasi (sidebar, header, status bar, navigator, banner) memakai
  `no-print`. Satu halaman cetak = satu minggu yang sedang dibuka.
- Ukuran kertas dan margin `@page` ditulis runtime lewat tag style
  `#logman-page-style` mengikuti config `ukuranKertas`, dari satu sumber di
  `src/lib/domain/paper.ts` yang juga dipakai render PDF server.
- Pola nama file: `LogBook_<NIM>_<Bulan>-<Tahun>.pdf`.
- Hasil ekspor disimpan ke folder lokal `folderExport`. Bila kosong, dipakai folder
  default `data/exports` di dalam project (tercakup `.gitignore`). Path default itu
  diberikan server lewat `GET /api/env` dan ditampilkan sebagai placeholder field.
- Field folder ekspor hanya-baca dan diisi lewat dialog folder native yang dibuka
  SERVER (`POST /api/pick-folder`), karena browser tidak memberi path absolut ke server.
  Dialog dibuka di lokasi yang sedang diatur bila path itu ada, selain itu di folder
  default, sehingga tidak pernah membuka home atau root tanpa alasan. Bila dialog native
  tidak tersedia, server menjawab `unsupported` dan UI berubah menjadi mode isi manual.
- Data mentah tetap tersimpan sebagai JSON walau tidak diekspor.

---

## 13. Performa (gate keras)

Anggaran dan aturan ini diuji di CI. Kegagalan berarti CI merah.

- JS awal (first load) gzip di bawah 200 KB. Peringatan pada 170 KB.
- TIDAK BOLEH ada long task di atas 50 ms saat user mengetik di editor.
- TIDAK BOLEH ada layout shift tak terduga saat load.
- Skenario animasi utama dijalankan di CI, gagal bila ada frame drop besar.
- Linter kustom menolak: animasi properti terlarang (bagian 8.2) dan impor Motion
  global (wajib LazyMotion).
- Jumlah render: satu ketikan hanya boleh me-render ulang sel yang bersangkutan,
  bukan tabel atau halaman.

Teknik wajib:
- Zustand dengan selector. DILARANG subscribe ke seluruh store.
- Autosave debounced, hanya menyerialkan bagian yang berubah.
- LazyMotion dengan `domAnimation` untuk fitur animasi.
- Code splitting per route. Setiap halaman di `src/app/App.tsx` dimuat dengan `lazy`
  dan dibungkus `Suspense`. Shell, provider, dan primitif inti tetap di bundle awal.
  Halaman dev (`/dev/*`) juga lazy, karena tidak dipakai user akhir.
- Definisi "JS awal" untuk anggaran: entry chunk plus chunk yang di-import statis oleh
  entry. Chunk lazy TIDAK dihitung, karena baru dimuat saat route dibuka.
  `scripts/analyze-bundle.mjs` menghitungnya dengan cara ini.
- Catatan penting: kode baru yang ditambahkan ke bundle awal harus dipertimbangkan
  dampaknya. Halaman dev pernah tidak sengaja menarik primitif ke bundle awal dan
  menaikkannya ke 161 KB gzip. Code splitting per route adalah pengaman standar.
- Ingatan posisi scroll per halaman TIDAK memakai scroll listener, dan itu disengaja.
  Listener akan berjalan pada setiap frame gulir; sebaliknya, penulisan posisi cukup
  sekali per navigasi di dalam `useLayoutEffect` (bagian 11.4). Jangan menggantinya
  dengan pendekatan berbasis listener.

Yang TIDAK dijadikan gate CI (jujur soal keterbatasan):
- FPS dan smoothness nyata pada perangkat spesifik. Runner CI tidak punya GPU yang
  representatif, jadi angka FPS di CI flaky dan menyesatkan. Ini divalidasi manual di
  PC pemilik.
- Lighthouse untuk localhost SPA tidak dijadikan patokan.

---

## 14. Testing

### 14.1 Strategi test bertahap (WAJIB saat development)

Testing dipecah agar debugging tidak menunggu seluruh suite berjalan ber-menit-menit.

**Saat development / debugging (perbaikan kecil):**
- Jalankan HANYA test yang relevan dengan bagian yang diubah. Contoh:
  - Ubah `src/lib/domain/*` -> `pnpm test:domain`
  - Ubah `server/pdf.ts` -> `pnpm test:server`
  - Ubah e2e ekspor -> `pnpm test:e2e:export` (atau `pnpm playwright test e2e/<spec>.ts`)
  - Ubah satu file komponen -> unit/component test file itu saja
- Sebelum menjalankan, tentukan dulu: perubahan ini memengaruhi test mana saja?
  Jalankan set itu saja. Kalau gagal, perbaiki, lalu re-run set yang sama (atau
  subset yang lebih kecil bila kegagalan sudah menyempit).
- DILARANG menjalankan `pnpm test` + `pnpm test:e2e` + audit penuh setiap kali
  memperbaiki satu kesalahan. Itu membuang waktu development.
- DILARANG menggabungkan banyak gate + pkill + server start dalam SATU perintah
  shell panjang. Itu lama, sulit dibatalkan, dan bila diganggu di tengah malah
  merusak hasil (browser audit mati, dsb). Jalankan perintah kecil satu per satu.
- Sebelum menjalankan gate apa pun, cek dulu log hasil sebelumnya di `/tmp` atau
  ingat hasil di sesi ini. Kalau sudah lulus dan kode sejak itu tidak berubah,
  JANGAN diulang. Hanya jalankan yang belum lulus / yang tersentuh perubahan.

**Saat final / sebelum commit / penandaan selesai:**
- SATU KALI saja, jalankan full gate: lint, typecheck, unit penuh, e2e penuh,
  audit motion, audit a11y, bundle (sesuai checklist bagian 19).
- Urutan ringan ke berat, perintah terpisah, berhenti bila ada yang gagal
  (perbaiki dulu, jangan lanjut menumpuk kegagalan):
  1. `pnpm lint`
  2. `pnpm typecheck`
  3. `pnpm test`
  4. `pnpm audit:motion`
  5. `pnpm test:e2e` (butuh port bebas; cek port dulu, jangan pkill membabi buta)
  6. start server singkat -> `pnpm audit:a11y` -> stop server (perintah terpisah)
  7. `pnpm build` lalu `node scripts/analyze-bundle.mjs`
- Full suite adalah gate kualitas akhir, bukan alat debugging harian.
- Bila sebagian gate di sesi yang sama SUDAH lulus dan tidak ada perubahan kode
  sejak itu, final cukup menjalankan sisa gate yang belum lulus. Catat di ringkasan
  mana yang lulus kapan, supaya tidak mengulang e2e 50 test hanya karena satu
  file markdown berubah.

**Pemetaan cepat perubahan -> test:**

| Yang diubah | Test yang dijalankan saat development |
|---|---|
| `src/lib/domain/*` | `pnpm test:domain` |
| `src/components/ui/*` | `pnpm vitest run src/components/ui` |
| `src/components/shared/*` | `pnpm vitest run src/components/shared` + e2e spec halaman terkait bila render berubah |
| `README.md` / dokumen saja | `pnpm lint` saja; full suite tidak perlu bila tanpa perubahan kode |
| Aset `public/*` yang tidak dirujuk kode | hapus + `pnpm test:e2e:visual` (memastikan tidak ada regresi visual) |
| `src/features/*` (1 fitur) | unit/component test fitur itu + e2e spec fitur itu saja |
| `server/*` | `pnpm test:server` + e2e spec terkait bila endpoint berubah |
| `e2e/<spec>.ts` saja | `pnpm playwright test e2e/<spec>.ts` |
| `dev/DevSeedPage.tsx` | `pnpm playwright test e2e/seed.spec.ts` |
| Print chrome / print CSS | `pnpm playwright test e2e/print.spec.ts` |
| `src/lib/utils/perf.ts` / `dev/DevPerfPage.tsx` | `pnpm vitest run src/lib/utils` + `pnpm test:e2e:perf` |
| Snapshot visual / UI produk | `pnpm test:e2e:visual` (baseline: `--update-snapshots` bila disengaja) |
| CSS/token tema | `pnpm audit:a11y` (atau spec a11y terkait), bukan full e2e |
| Animasi/motion | `pnpm audit:motion` + e2e motion/dev terkait |

Bila ragu mana yang terpengaruh, pilih yang paling dekat dengan file yang diubah,
bukan yang paling luas.

### 14.2 Disiplin shell: cek dulu, pkill inkremental

Port already in use atau proses nyangkut BUKAN alasan untuk langsung `pkill` massal
berulang-ulang sampai kena timeout tool.

**Urutan wajib:**
1. Cek dulu: `ss -ltnp | grep <port>` atau `lsof -i :<port>` atau `pgrep -af <pattern>`.
   Kalau port/proses sudah tidak ada, JANGAN pkill. Selesai.
2. Kalau proses benar ada dan harus dimatikan, pakai timeout inkremental:
   - Tahap 1: `timeout 5 pkill -<sig> <pattern>` (atau `kill <pid>`), cek lagi.
   - Tahap 2: masih ada? `timeout 10 pkill -<sig> <pattern>`, cek lagi.
   - Tahap 3: masih ada? baru sinyal lebih keras / kill PID spesifik, timeout sedang.
   - Berhenti begitu proses/port bersih. Jangan loop tanpa batas.
3. Selalu awali dengan cek, bukan dengan kill. Timeout tiap tahap wajib dipasang
   (`timeout N ...`) supaya perintah tidak menggantung sampai timeout tool opencode.
4. Untuk port bentrok saat test: lebih baik pakai port lain (env var port) bila
   program mendukung, seperti yang dilakukan manusia. Kill adalah opsi terakhir,
   bukan reaksi pertama.
5. DILARANG menggabungkan pkill + wait server + audit + build dalam satu script
   shell raksasa. Itu lama, sulit dibatalkan, dan mengganggu di tengah akan merusak
   hasil (misalnya menutup browser audit a11y). Satu tujuan = satu perintah kecil.
5. JANGAN pernah mencampur pkill, wait server, audit, dan build dalam satu script
   shell multi-baris. Perintah panjang begini lama, sulit dibatalkan dengan aman,
   dan mengganggu di tengah merusak hasil (misalnya menutup browser audit a11y).
   Satu tujuan = satu perintah kecil.

Contoh pola yang benar:

```bash
# 1. cek
ss -ltnp | grep 5199 || echo "port free"
# 2. bila perlu matikan, bertahap
timeout 5 pkill -f "vite" || true
sleep 1
ss -ltnp | grep 5199 || echo "port free"
# 3. hanya bila masih hidup, tahap berikutnya
timeout 10 pkill -f "vite" || true
```

### 14.3 Jenis test

- **Vitest (domain):** perhitungan tanggal, kepemilikan baris per bulan, minggu lintas
  bulan dan lintas tahun, rentang partial, validasi hari kosong, format jam titik,
  format tanggal Indonesia, parser rentang magang. Wajib cepat dan deterministik.
- **Vitest + Testing Library (komponen):** editor menerima ketikan, Tab pindah sel,
  Enter menambah baris Kegiatan, validasi muncul, ganti tema mengubah `data-theme`,
  tier animasi berubah. Termasuk primitif UI: Switch, SegmentedControl, Combobox.
- **Playwright (e2e):** alur isi rentang magang, isi satu minggu, ekspor PDF,
  verifikasi PDF bisa dibuka dan jumlah halaman benar.
- **Playwright (dev tooling):** galeri `/dev/components` menampilkan semua seksi,
  dialog bisa dibuka, katalog `/dev/motion` menampilkan semua preset. Termasuk test
  regresi animasi (memastikan animasi masuk benar-benar berjalan, lihat bagian 8.3.1).
- **Visual snapshot:** screenshot dibandingkan dengan baseline. Ini GATE CI.
- **Aksesibilitas:** `@axe-core/playwright` dijalankan di e2e DAN lewat `pnpm audit:a11y`
  (semua halaman x semua tema). Pelanggaran impact serious dan critical adalah GATE CI.
- **Perf gate:** ukuran bundle, long task saat mengetik, jumlah render.

Artefak CI wajib diunggah saat gagal: screenshot, trace Playwright, laporan visualizer.
Tujuannya agar agen bisa "melihat" kegagalan tanpa akses layar.

---

## 15. Fasilitas dev untuk agen

Karena agen tidak bisa melihat layar pemilik, fasilitas ini wajib ada:

- `/dev/components`: galeri semua komponen UI yang sudah direstyle. Setiap primitif baru
  WAJIB ditambahkan di sini, dengan contoh semua varian dan ukuran. Setiap seksi punya
  `data-testid` berpola `galeri-<nama-seksi>` agar bisa diuji.
- `/dev/motion`: katalog semua preset animasi, bisa dipratinjau per tier. Setiap preset
  punya `data-testid` berpola `motion-<nama>`.
- `/dev/perf`: menampilkan ukuran bundle, jumlah render, dan long task dalam satu
  tampilan, supaya progres terlihat tanpa membuka CI.
- Skrip audit: `pnpm audit:motion` (aturan animasi) dan `pnpm audit:a11y` (aksesibilitas
  semua halaman x semua tema, memakai axe lewat `scripts/axe-check.mjs`).
- Log terstruktur: JSON lines dengan `traceId`, sehingga satu aksi bisa dilacak dari UI
  sampai penulisan disk. Lokasi: `data/logs/`.
- Error boundary PER FITUR, selain global. Satu fitur gagal tidak mematikan aplikasi.
  Error yang tertangkap menyimpan stack lengkap agar agen bisa membacanya.
- Mode seed/demo: `/dev/seed` berisi tombol yang mengisi satu bulan (hanya hari yang
  bisa diisi) dengan data contoh untuk pengujian cepat, lewat batch patch autosave.
  Tindakan ini menimpa isi hari terpilih.

---

## 16. CI/CD

Mengikuti pola yang sudah dipakai di proyek proxman.

### `ci.yml` (push ke main dan pull_request)

Job:
1. `lint`: Biome check.
2. `typecheck`: `tsc --noEmit`.
3. `unit`: Vitest (domain + komponen).
4. `build`: Vite build, cek anggaran bundle, audit aturan animasi, unggah laporan
   visualizer.
5. `e2e`: Playwright, snapshot visual, a11y. Unggah screenshot dan trace.
6. `perf`: harness long task dan jumlah render.

Catatan CI:
- Server Hono di CI memakai `InMemoryLogRepository` dan direktori `data/` sementara.
  CI tidak boleh menulis ke filesystem nyata.
- Playwright butuh Chromium, tersedia di runner GitHub.

### `release.yml` (tag `v*`)

- Build produksi, verifikasi anggaran bundle, lalu GitHub Release.
- Catatan rilis diambil dari `CHANGELOG.md` lewat `scripts/release-notes.mjs`, BUKAN dari
  `generate_release_notes`. Alasan: repo ini menerima commit langsung ke `main` tanpa PR,
  sehingga catatan otomatis GitHub kosong dan hanya menyisakan tautan "Full Changelog".
  Skrip gagal keras bila seksi untuk tag tidak ditemukan atau kosong, supaya rilis tidak
  pernah terbit tanpa catatan. Uji lokal: `pnpm release:notes v0.1.0`.
- TIDAK ada arsip tar.gz. Distribusi memakai tag git plus pintasan desktop di
  `packaging/`, karena arsip hanya berisi `dist/` yang tidak bisa dijalankan sendiri.

---

## 17. Konvensi kode

- TypeScript strict. Dilarang `any` implisit. Preferensi `unknown` lalu dipersempit.
- Komponen fungsi. Hook untuk state. Tidak ada class component.
- Nama file komponen: PascalCase. Nama file non-komponen: kebab-case.
- Satu komponen, satu file. Ekspor bernama untuk util, default untuk halaman route.
- Fungsi domain murni: tanpa I/O, tanpa React, tanpa akses global. Mudah diuji.
- Komentar kode seperlunya, menjelaskan "mengapa", bukan "apa".
- Varian komponen memakai CVA. Tidak ada cabang `className` bertumpuk.
- Klas Tailwind panjang digabung dengan `tailwind-merge` melalui helper `cn`.
- Dilarang `transition-all`. Dilarang selector `*` untuk transisi.
- Dilarang impor Motion global. Wajib lewat LazyMotion dan preset `src/motion/`.
- Dilarang `console.*` langsung di `src/` (termasuk `console.error`). Satu-satunya
  pengecualian adalah implementasi logger sendiri di `src/lib/log/` yang memakai
  console sebagai sink tampilan. Semua pelaporan lain lewat `log` dari `@/lib/log/`
  dengan `traceId`, karena record ikut terkirim ke server dan tersimpan di
  `data/logs/`. `FeatureErrorBoundary` memakai pola yang sama.

---

## 18. Urutan pengerjaan

1. Bootstrap repo: Vite, Tailwind, Biome, React Compiler, struktur folder, `run`,
   dan dokumen ini.
2. Design system: 9 token tema, primitif shadcn direstyle, ikon, shell, layer motion,
   galeri `/dev/components` dan `/dev/motion`.
3. Data layer: server Hono, skema config dan logs, repository, autosave, backup,
   logger traceId.
4. Settings: profil, rentang magang, jam default, alasan, tema, ukuran kertas,
   tier animasi.
5. Navigasi bulan dan minggu, plus logika kepemilikan baris.
6. Editor A4: edit inline, auto-grow, navigasi keyboard.
7. Render dokumen: letterhead, blok tanda tangan, print CSS.
8. Ekspor PDF, validasi, dan mode seed.
9. Testing: Vitest, Playwright, snapshot, a11y, harness performa, `/dev/perf`.
10. Audit animasi saat build dan workflow CI.
11. Polish: error boundary per fitur, logging, README, sinkronisasi dokumen ini.
12. Fase 11 (di luar roadmap, dari kritik pemilik): tabel bertema, rail sidebar yang
    lengkap dengan strip buka/tutup, gate dev UI, time picker kustom dan format 12/24,
    warna kontrol native bertema, serta nama penanda tangan global dan per minggu.
13. Fase 12 (di luar roadmap, dari kritik pemilik kedua): setelan font dokumen dan skala
    konten, sidebar dengan tombol buka/tutup kembar di dasar rail dan drawer, label
    Bulan sticky, fokus otomatis ke bulan aktif, pemilih folder ekspor lewat dialog
    native dengan default `data/exports`, dan versi aplikasi di status bar.
14. Fase 13 (di luar roadmap): perbaikan highlight minggu lintas bulan di sidebar, dan
    banner hari belum diisi yang dapat diklik dengan kilatan baris sesuai tier animasi
    serta fokus otomatis ke field kegiatan.
15. Fase 14 (di luar roadmap): ingatan posisi scroll per halaman selama sesi, sehingga
    berpindah halaman tidak lagi mewarisi posisi halaman sebelumnya.
16. Fase 15 (di luar roadmap): lisensi, NOTICE, CHANGELOG, README bahasa Inggris,
    launcher Windows, pintasan desktop, judul halaman, dan release tanpa arsip.
17. Fase 16 (di luar roadmap): bahasa antarmuka ID dan EN dengan dokumen cetak yang
    selalu berbahasa Indonesia (bagian 21).
18. Fase 17 (di luar roadmap): pencarian menu Pengaturan dengan saran dua lapis, sorotan
    kata, dan lompatan ke seksi tujuan (bagian 22).


---

## 19. Checklist sebelum menandai pekerjaan selesai

- [ ] Tidak ada emoji dan em dash di file yang diubah.
- [ ] Tidak ada animasi properti terlarang (bagian 8.2).
- [ ] Tidak ada nilai hex warna di luar `tokens.css`.
- [ ] Tidak ada impor Motion global.
- [ ] Domain logic murni dan ada unit test-nya.
- [ ] Anggaran performa masih terpenuhi.
- [ ] Dokumen ini diperbarui bila perilaku berubah.
- [ ] Semua teks antarmuka baru memakai `useT()` dan kedua katalog pesan tetap sinkron
      (bagian 21). Tidak ada teks dokumen cetak yang ikut diterjemahkan.
- [ ] Seksi Pengaturan baru memakai `SettingsSection` dan terdaftar di
      `SETTINGS_SECTIONS`, sehingga ikut muncul di pencarian (bagian 22).
- [ ] Visual snapshot diperbarui bila perubahan UI memang disengaja.
- [ ] Mutasi eksternal sudah mendapat ACC eksplisit dari pemilik.
- [ ] Selama development test berjalan bertahap (bagian 14.1); full suite hanya
      dijalankan SATU KALI di tahap final ini, perintah per gate, berhenti saat gagal.
- [ ] Gate yang sudah lulus di sesi yang sama tidak diulang tanpa perubahan kode
      terkait (bagian 14.1).
- [ ] Tidak ada `pkill` massal tanpa cek; kill proses memakai pola inkremental
      ber-timeout (bagian 14.2). Tidak ada script shell panjang yang mencampur
      pkill + audit + build.

---

## 20. Status pekerjaan (dipelihara setiap sesi)

Perbarui bagian ini setiap menyelesaikan atau memulai fase, agar sesi agen berikutnya
langsung tahu posisinya.

- Fase saat ini: seluruh fase 0 sampai 17b selesai dan **v0.1.0 SUDAH DITANDATANGANI
  dan dirilis**. Seluruh roadmap bagian 18 tuntas; fase 11 sampai 17b adalah iterasi
  lanjutan setelah roadmap.
- Sudah selesai:
  - Perencanaan lengkap dan seluruh keputusan terkunci (bagian 2 sampai 18).
  - Aset referensi: `docs/reference/Log-Book-Template.docx`,
    `docs/reference/extracted-metrics.md`, `public/letterhead-polinema.png`.
  - Bootstrap: `package.json`, Vite 8 + React 19 + TS, Tailwind v4, Biome,
    React Compiler (lewat `oxc-transform-react`), Vitest, Playwright, konfigurasi
    tsconfig/vite/vitest/playwright, skrip `./run`.
  - Design system dasar: `src/styles/tokens.css` (9 tema), `globals.css` (pemetaan
    Tailwind, print CSS, View Transitions), favicon.
  - Shell: Sidebar (rail statis + drawer overlay), TopHeader, StatusBar sticky,
    FeatureErrorBoundary, AppProviders (LazyMotion + Tooltip).
  - Halaman: Logbook (placeholder rentang belum diatur), Settings (pemilih 9 tema dan
    4 tier animasi berfungsi), tiga halaman dev.
  - Primitif UI lengkap di `src/components/ui/`: Button, Card, Badge, Separator, Kbd,
    Spinner, EmptyState, Input, Textarea, Label, Field, Switch, Checkbox, Slider,
    Select, Combobox, SegmentedControl, Dialog, Popover, Tooltip.
  - Galeri `/dev/components` berisi semua primitif, katalog `/dev/motion` berisi semua
    preset animasi per tier.
  - Transisi tema beranimasi: reveal melingkar dari titik klik lewat View Transitions,
    dengan fallback langsung.
  - Profil tier animasi `src/motion/tiers.ts` plus pratinjau mini window di Settings.
  - Code splitting per route, JS awal turun ke sekitar 129 KB gzip.
  - Token kontras aksesibilitas (`--status-*-text`) ditambahkan untuk tema gelap dan
    terang.
  - Store Zustand: `ui` (tema, tier animasi, sidebar), `saveStatus`, `logbook`,
    `config`, `logs`.
  - Server Hono dengan `/api/health`, `/api/config` (GET/PUT), `/api/logs`
    (GET/PATCH/PUT), `/api/backups`, `/api/restore`, `/api/logs-client`,
    `/api/logs-recent`, dan penyajian `dist/`.
  - Skrip: `scripts/analyze-bundle.mjs`, `scripts/audit-motion.mjs`,
    `scripts/axe-check.mjs`.
  - CI: `.github/workflows/ci.yml` dan `release.yml`.
  - Fase 3 data layer:
    - Logika murni `src/lib/domain/`: `date.ts` (aritmetika tanggal, format Indonesia),
      `calendar.ts` (buildMonthGroups, disabledReasonFor, isDayActive, mondaysInRange,
      buildWeekDays), `schema.ts` (parseConfig, parseDayEntry, parseLogData,
      applyDayPatch, normalizeJam), `types.ts`.
    - Akses data DIP: `src/lib/repo/` (interface + InMemory + Http), `src/lib/log/`
      (JSON Lines + traceId), `src/lib/autosave/debouncedSaver.ts` (debounce 500ms,
      merge patch, flush, cancel).
    - Penyimpanan server: `server/store.ts` (tulis atomik + backup rotasi maks 20 +
      restore), `server/logger.ts` (JSON Lines harian), `server/index.ts`.
    - Bootstrap aplikasi: `src/app/useAppData.ts` (useBootstrapData,
      useUiPreferenceSync, useDeriveMonths, useFlushOnHidden).
    - Halaman Logbook membuat daftar minggu dari rentang magang (minggu lintas bulan
      muncul di dua grup bulan), Settings mengautosave profil, rentang magang, tema,
      dan tier animasi.
    - Status bar menampilkan status simpan autosave (Tersimpan/Menyimpan/Ada
      perubahan/Gagal) dengan `data-testid="save-status"`.
    - E2E memakai direktori `data-e2e` terpisah; `reuseExistingServer` selalu false
      dengan sengaja agar test tidak menyentuh data nyata.
  - Fase 4 Settings lengkap:
    - `src/lib/domain/alasan.ts`: sanitizeAlasan, addAlasan, removeAlasan (murni,
      dedupe tanpa beda huruf, unit test lengkap).
    - `src/features/settings/JamInput.tsx`: input jam format titik dengan validasi dan
      normalisasi saat blur atau Enter. `input type="time"` sengaja tidak dipakai karena
      format tampilannya mengikuti locale.
    - `src/features/settings/JamDefaultSection.tsx`: jam default Senin sampai Sabtu,
      plus tombol kembali ke 08.00 sampai 16.00.
    - `src/features/settings/AlasanSection.tsx`: kelola daftar alasan (tambah, hapus,
      kembalikan bawaan). Duplikat ditolak tanpa membedakan huruf besar/kecil.
    - `src/features/settings/DokumenEksporSection.tsx`: ukuran kertas (A4, F4, Letter),
      folder ekspor, dan pratinjau pola nama file.
    - `parseConfig` kini memakai `sanitizeAlasan` dan MEMPERTAHANKAN daftar alasan
      kosong, karena user boleh menghapus semua. Sebelumnya daftar kosong dikembalikan
      ke default, sehingga penghapusan tidak bertahan setelah reload.
    - Seksi "Belum tersedia" (ComingSoonSection) dihapus dari Settings.
  - Fase 5 navigasi bulan dan minggu:
    - `src/lib/domain/calendar.ts` ditambah helper murni: `pickInitialMonthKey`,
      `pickInitialWeekId`, `findWeek`, `findMonthOfWeek`, `disabledReasonText`, plus
      tipe `DisabledReason`. Selector tema pilihan tetap diturunkan dari rentang.
    - `src/stores/logbook.ts` menegakkan `selectWeek(weekId, monthKey)`: pilihan minggu
      SELALU menyertakan bulan konteks, karena minggu lintas bulan muncul di dua grup.
      `setActiveMonth` memindahkan minggu aktif ke minggu pertama bulan baru bila minggu
      lama tidak ada di sana.
    - `src/app/useAppData.ts` memilih bulan dan minggu awal secara otomatis dan menjaga
      pilihan tetap valid saat data berubah.
    - `LogbookPage` menampilkan satu bulan aktif, tombol maju dan mundur, tab minggu
      M1, M2, ..., dan tabel enam baris hari. Baris non-aktif diredupkan dan diberi badge
      alasan (Bulan lain, Sebelum magang, Setelah magang).
    - Rail sidebar menampilkan label bulan 3 huruf. Mengklik satu bulan membuka popover
      berisi daftar minggu, sehingga minggu tetap bisa dipilih tanpa membuka drawer.
    - E2E dijalankan SERIAL (`workers: 1`, `fullyParallel: false`) karena aplikasi
      single-user dengan satu `config.json`, sehingga spec paralel saling menimpa
      rentang magang. Spec baru `e2e/navigation.spec.ts` menguji kepemilikan baris
      minggu lintas bulan.
  - Verifikasi lulus: lint, typecheck, Vitest (137 test), Playwright (36 test),
    audit motion, audit a11y 0 pelanggaran (5 halaman x 9 tema), anggaran bundle
    (JS awal 141.6 KB gzip).
  - Fase 6 editor A4:
    - `src/lib/domain/editor.ts`: logika murni editor (statusFromAlasan, displayJam,
      patchAlasan, patchKegiatan, validateDay, collectIncompleteDates) plus unit test.
    - `src/features/editor/AutoGrowTextarea.tsx`: textarea borderless yang tumbuh
      mengikuti isi tanpa scrollbar. Tinggi diukur ulang setiap nilai berubah.
    - `src/features/editor/EditorRow.tsx`: satu baris hari dengan sel jam (normalisasi
      titik saat commit), textarea kegiatan, dan pemilih alasan. Setiap baris membaca
      data sendiri dari store lewat selector per tanggal, sehingga satu ketikan hanya
      me-render ulang baris itu.
    - `src/features/editor/ReasonPicker.tsx`: menahan draft alasan lokal, hanya commit
      saat user memilih atau blur, supaya combobox tidak hilang di tengah pengetikan.
    - `src/features/editor/WeekEditorTable.tsx`: tabel dokumen enam baris dengan kelas
      CSS `doc-table`.
    - `src/features/editor/ValidationBanner.tsx`: menghitung hari belum lengkap.
    - `src/components/shared/WeekProgress.tsx`: penghitung hari terisi per minggu,
      terpisah agar tidak memicu re-render tabel.
    - `src/components/ui/Combobox.tsx`: ditulis ulang tanpa Radix Portal (dropdown
      absolut dalam DOM tabel). Ditambah `onSelect`, `onInputBlur`, dan
      `onMouseDown preventDefault` pada opsi.
    - `src/styles/globals.css`: kelas `.doc-table`, `.doc-cell-fit`
      (`field-sizing: content`), `.doc-cell-wrap`.
    - `src/lib/domain/date.ts`: ditambah `formatTanggalTanpaHari`.
    - `src/lib/domain/schema.ts`: `normalizeJam` kini memad jam satu digit dan
      menerima jam bulat tanpa menit.
    - `src/app/useAppData.ts`: `useDeriveMonths` tidak lagi bergantung pada data hari,
      sehingga ketikan tidak membangun ulang seluruh struktur bulan.
    - `LogbookPage.tsx`: menampilkan `WeekEditorTable` dan `ValidationBanner`.
    - E2E baru `e2e/editor.spec.ts` (8 test): baris disabled, ketik langsung, Enter
      tambah baris, auto-grow, normalisasi jam, strip Sakit/Izin, hapus alasan, alasan
      bebas, banner validasi.
  - Verifikasi lulus: lint, typecheck, Vitest (165 test), Playwright (44 test),
    audit motion, audit a11y 0 pelanggaran (5 halaman x 9 tema), anggaran bundle
    (JS awal 141.5 KB gzip).
  - Fase 7 ekspor PDF:
    - `server/pdf.ts`: `buildExportHtml` (murni, unit test) dan `exportMonthToPdf`
      (Playwright `page.pdf` dengan `printBackground` dan `preferCSSPageSize`).
      Letterhead di-embed sebagai data URI dari `public/letterhead-polinema.png`
      agar PDF tidak bergantung server web saat render. Kop, identitas, tabel
      enam baris, dan blok tanda tangan per halaman. Subjudul memakai tanda hubung
      biasa, bukan em dash.
    - `buildExportFileName`: pola `LogBook_<NIM>_<Bulan>-<Tahun>.pdf`.
    - Endpoint `POST /api/export` (`{monthKey}`) menyimpan ke `folderExport` atau
      `data/exports`, lalu mengembalikan `fileName` dan path.
    - Endpoint `GET /api/export/download?file=` menyajikan PDF; menolak nama file
      dengan path separator, `..`, atau ekstansi bukan `.pdf`.
    - Route `/export` + nav sidebar Ekspor. `ExportPage` menampilkan daftar bulan
      (jumlah minggu, hari, terisi) dan tombol Ekspor per bulan yang memanggil
      API lalu mengunduh lewat link download.
    - `/export` masuk daftar halaman `scripts/axe-check.mjs`.
    - Token `--doc-muted` diubah dari `#9a9a9a` ke `#666666` agar label tanggal
      11px di editor memenuhi kontras AA 4.5:1 di atas kertas putih.
    - Unit test baru `server/pdf.test.ts` (nama file, struktur HTML, strip jam,
      ukuran kertas, penolakan rentang kosong).
    - E2E baru `e2e/export.spec.ts` (6 test): daftar bulan, POST ekspor, bulan
      di luar rentang, body tanpa monthKey, download aman path traversal, unduh
      dari UI.
  - Verifikasi lulus: lint, typecheck, Vitest (172 test), Playwright (50 test),
    audit motion, audit a11y 0 pelanggaran (6 halaman x 9 tema), anggaran bundle
    (JS awal 142.9 KB gzip).
  - Fase 8 render/preview dokumen, validasi ekspor, dan mode seed:
    - `src/lib/domain/paper.ts`: `paperSizeCss` dan `pageStyleContent` sebagai
      sumber tunggal ukuran kertas + margin 2.54 cm untuk `@page`. Dipakai Shell
      (tag style `#logman-page-style`) dan `server/pdf.ts`.
    - `src/features/logbook/DocumentPrintChrome.tsx`: kop surat, judul dokumen,
      tabel identitas, dan blok tanda tangan sebagai elemen `print-only`, struktur
      teks mengikuti `server/pdf.ts`.
    - `LogbookPage` menyusun chrome dokumen di sekitar tabel minggu aktif;
      navigator, banner, InfoRow, dan header halaman memakai `no-print`.
      `WeekEditorTable` menyembunyikan baris header M-minggu saat cetak.
    - `EditorRow`: sel jam menyediakan teks fallback untuk cetak (placeholder
      tidak ikut tercetak), baris disabled memakai tinta penuh saat cetak, tombol
      hapus alasan dan `ReasonPicker` `no-print`.
    - `globals.css`: kelas `.print-only`/`.print-only-flex`, override
      `--sidebar-rail-width` di `.app-frame` untuk melepas margin rail saat cetak
      tanpa `!important`, dan `print-color-adjust` pada header tabel.
    - Validasi ekspor: `monthIncompleteDates` di domain (dipakai banner, halaman
      Ekspor, dan server). `POST /api/export` membalas 422 dengan daftar tanggal
      bila hari belum lengkap; tombol Ekspor dinonaktifkan per bulan.
    - Mode seed: `src/lib/domain/seed.ts` (`buildSeedPatch`, murni, deterministik)
      plus `/dev/seed` (`dev/DevSeedPage.tsx`) yang mengisi hari yang bisa diisi
      lewat batch patch autosave. Nav dev dan daftar halaman a11y ikut diperbarui.
    - E2E baru `e2e/print.spec.ts` (3 test) dan `e2e/seed.spec.ts` (2 test);
      `e2e/export.spec.ts` diperluas menjadi 8 test termasuk penolakan 422.
    - Perbaikan hermetisitas e2e: `data-e2e` persist antar run, sehingga
      `editor.spec` (bersihkan logs), `settings-advanced.spec` (reset jam default),
      `data.spec` (paksa tema awal berbeda), dan `settings.spec` (paksa tier
      beranimasi sebelum uji View Transitions) kini menyetel ulang state lewat API.
  - Verifikasi lulus: lint, typecheck, Vitest (183 test), Playwright (57 test),
    audit motion, audit a11y 0 pelanggaran (7 halaman x 9 tema), anggaran bundle
    (JS awal 143.3 KB gzip).
  - Fase 9 snapshot visual, harness performa, dan /dev/perf:
    - `src/lib/utils/perf.ts`: harness DEV-only. `bumpRender` menghitung render
      per kunci (tanggal baris), monitor `PerformanceObserver` longtask dengan
      ambang 50 ms, dipaparkan ke `window.__logmanPerf` untuk e2e dan /dev/perf.
      No-op pada build produksi.
    - `EditorRow` memanggil `bumpRender(date)` sehingga e2e bisa memastikan satu
      ketikan hanya me-render baris tanggal terkait (bagian 13).
    - `/dev/perf` kini menampilkan tiga panel: ukuran bundle (dari
      `public/bundle-stats.json` yang ditulis `analyze-bundle.mjs`), jumlah render
      per tanggal, dan daftar long task dengan tombol monitor/reset/bersihkan.
    - `e2e/perf.spec.ts` (2 test gate): ketikan cepat tanpa long task di atas
      50 ms (setelah warm-up Vite), dan render count hanya baris target.
    - `e2e/visual.spec.ts` (3 test gate): screenshot Log Book, Pengaturan, dan
      Ekspor. Rentang dikunci satu minggu (21-26 Sep 2026), tema putih-bersih,
      tier mati, animasi dibekukan. Baseline di `e2e/visual.spec.ts-snapshots/`.
      Perbarui dengan `--update-snapshots` bila perubahan UI disengaja.
    - CI: job `perf` menjalankan `pnpm test:e2e:perf` (bagian 16 job 6).
    - `public/bundle-stats.json` masuk `.gitignore`.
  - Verifikasi lulus: lint, typecheck, Vitest (189 test), Playwright (62 test),
    audit motion, audit a11y 0 pelanggaran (7 halaman x 9 tema), anggaran bundle
    (JS awal 142.9 KB gzip).
  - Fase 10 polish dan sinkronisasi:
    - `src/components/shared/FeatureErrorBoundary.tsx` kini melaporkan gagal
      render lewat `log.error` (scope `fitur.gagal`) dengan `traceId` dan
      `componentStack`, bukan `console.error` langsung.
    - Bagian 17 ditambah konvensi: dilarang `console.*` langsung di `src/`;
      pengecualian hanya implementasi logger `src/lib/log/` sebagai sink.
    - Unit test baru `FeatureErrorBoundary.test.tsx` (3 test): anak sehat,
      fallback + pelaporan logger, tombol coba lagi.
    - `public/letterhead-polinema-alt.jpeg` dihapus karena tidak dirujuk kode
      mana pun (logo dokumen hanya `letterhead-polinema.png`).
    - `README.md` ditulis ulang dengan perintah yang benar-benar ada
      (`./run <argumen>` meneruskan ke skrip pnpm), cakupan gate kualitas,
      daftar halaman, lokasi data runtime, dan alur rilis tag.
  - Verifikasi lulus: lint, typecheck, Vitest (192 test), Playwright (62 test),
    audit motion, audit a11y 0 pelanggaran (7 halaman x 9 tema), anggaran bundle
    (JS awal 142.9 KB gzip).
  - Fase 11 perbaikan UI hasil kritik pemilik:
    - Tabel Log Book bertema di layar lewat token `--doc-surface`, `--doc-surface-head`,
      `--doc-line` (alias token tema), dan dikembalikan ke kertas putih di `@media print`.
    - `color-scheme` per tema di `tokens.css`, plus `DateInput` (ikon kalender Lucide
      bertema) untuk pemilih tanggal.
    - Rail sidebar diperkaya: ikon Pengaturan dan Ekspor selalu tampil, pemisah antar
      kelompok, dan strip buka lebar rail di bawah. Drawer bisa ditutup dari strip tepi,
      tombol, backdrop, atau Escape.
    - Menu dan route `/dev/*` di balik `tampilkanDevUi` (default mati), dengan toggle di
      Settings seksi "Tampilan". Route diblokir bila mati.
    - `TimePicker` kustom bertema dengan grid jam, menit, dan toggle AM/PM. Format jam
      12/24 diatur di `JamDefaultSection`; nilai selalu disimpan 24 jam format titik.
    - Nama penanda tangan: config `dosenPembimbing`, `pembimbingLapangan`,
      `pembimbingLapanganDefault`, seksi `PenandaTanganSection`, override per minggu di
      `logs.json` lewat `applyNamaMingguPatch` dan `PATCH /api/logs/nama-minggu`, UI
      `SignatureNames` di Log Book, dan dipakai `PrintSignature` serta `server/pdf.ts`.
    - Unit test baru: `jamFormat.test.ts`, `pembimbing.test.ts`, dan tambahan kasus
      `schema.test.ts`, `repo.test.ts`, `ui.test.tsx`; e2e baru untuk sidebar, format jam,
      pembimbing, dan nama penanda tangan per minggu.
  - Verifikasi lulus: lint, typecheck, Vitest (254 test), Playwright (70 test),
    audit motion, audit a11y 0 pelanggaran (7 halaman x 9 tema), anggaran bundle
    (JS awal 145.0 KB gzip).
  - Fase 12 perbaikan UI lanjutan (kritik pemilik kedua):
    - Setelan font dokumen (`fontDokumen`: Times New Roman atau Arial) yang hanya
      memengaruhi layer dokumen, plus setelan skala tampilan konten Log Book
      (`contentScale`) yang hanya memengaruhi layar. Keduanya di
      `DokumenEksporSection`, diterapkan lewat `data-doc-font` dan `--content-scale`.
    - Sidebar dirombak: rail kini memuat ikon Log Book, tombol buka berada di dasar
      rail, drawer punya tombol tutup di dasarnya (kembar dengan tombol buka), strip
      tepi kanan dan tombol tutup di header dihapus. Label "Bulan" kini sticky di dalam
      area gulir (sliver), dan membuka drawer selalu membuka bulan aktif.
    - Bulan aktif di drawer diberi gaya terpilih sendiri (`aria-current`), jadi user
      tahu bulan mana yang sedang dipakai walau tidak ada bulan yang dibuka.
    - Folder ekspor: default `data/exports`, field hanya-baca dengan tombol dialog
      folder native (`POST /api/pick-folder`, `server/pickFolder.ts`), tombol reset ke
      default, dan fallback mode isi manual bila dialog tidak tersedia.
    - Versi aplikasi tampil di pojok kanan status bar, dibaca dari `package.json`.
    - Unit test baru: `dokumen.test.ts`, `pickFolder.test.ts`, dan tambahan
      `schema.test.ts` serta `repo.test.ts`. E2E baru untuk font dokumen, skala konten,
      picker folder, reset folder, versi, dan fokus bulan aktif di sidebar.
    - Catatan aturan baru: prop `layout` Motion hanya boleh di `Sidebar.tsx`
      (bagian 8.3.2), sehingga `MotionProvider` tidak lagi memakai mode `strict` dan
      `scripts/audit-motion.mjs` ikut mengawasi prop `layout` dan impor Motion global.
  - Fase 12b penyempurnaan setelah tinjauan pemilik:
    - Di LAYAR tabel Log Book kembali memakai font UI (Inter); font dokumen (Times atau
      Arial) hanya berlaku saat cetak dan pada PDF. Sebelumnya tabel di layar ikut memakai
      font dokumen, sehingga terlihat tidak konsisten.
    - Sel jam memusatkan angka dan ikon sebagai satu grup dengan jarak `gap-1.5`, jadi
      angka tidak lagi menempel ke ikon.
    - Menekan item bulan hanya membuka/menutup daftar minggunya (`aria-expanded`), TIDAK
      memilih bulan. Penanda bulan aktif mengikuti bulan dari minggu yang sedang dipilih,
      tepat satu bulan, dan tetap menyala walau bulannya tertutup.
    - Memilih minggu TIDAK lagi menutup bulan lain; keadaan buka/tutup tiap bulan
      dibiarkan apa adanya sampai user sendiri yang menutupnya.
    - Bulan aktif tidak diberi border, latar, atau label "aktif", hanya teks lebih terang.
    - Label "Bulan" tidak lagi melayang: tanpa margin, padding horizontal, atau garis
      pemisah sendiri.
    - Status bar dijadikan FULL WIDTH di paling bawah; rail dan drawer sama-sama berhenti
      di atasnya, sehingga tidak ada notch di sudut kiri bawah.
    - Tombol buka/tutup sidebar memakai ikon garis pemisah plus panah yang sama dan
      `min-h-20`. Isi tombol tutup dibungkus container selebar rail yang ditempel ke kanan,
      sehingga ikonnya sejajar dengan ikon rail saat collapsed.
    - `PopoverContent` dipastikan memakai portal, karena konten fixed di dalam pohon
      ber-`zoom` (skala konten) akan salah posisi. Aturan ini masuk bagian 11.2.
  - Fase 13 perbaikan highlight dan banner hari belum diisi:
    - Highlight minggu aktif di sidebar kini memakai bulan konteks. Sebelumnya minggu
      lintas bulan menyala di dua grup sekaligus, karena id minggu memang sama.
    - Banner "hari belum punya kegiatan atau alasan" kini interaktif: tiap hari adalah
      tombol yang mengarahkan user ke minggu hari itu, memberi kilatan pada barisnya
      sesuai tier animasi, lalu memfokuskan field "Ketik kegiatan".
    - Profil tier menambah `flashWaves`, dan preset baru `buildRowFlashVariants` beserta
      pasangan `rowFlashDurationSeconds` mengatur kilatan itu. Fokus tetap terjadi di
      semua tier, termasuk `mati`.
    - Unit test baru: `findWeekOfDate` (calendar), `focusRequest` (store logbook),
      `buildRowFlashVariants` dan `rowFlashDurationSeconds` (presets). E2E baru untuk
      lompat dari banner, kebersihan kilatan, dan highlight lintas bulan.
  - Fase 14 ingatan posisi scroll per halaman:
    - `<main>` adalah satu kontainer scroll yang tidak pernah diganti, sehingga posisi
      halaman lama dulu terbawa ke halaman baru. Kini posisi disimpan saat path berubah
      dan dipulihkan sebelum paint.
    - Modul murni baru `src/lib/utils/scrollMemory.ts`, dipakai `Shell.tsx` lewat
      komponen `ScrollRestore`. Sengaja TANPA scroll listener, jadi menggulir tidak
      menambah biaya (bagian 13).
    - Unit test `scrollMemory.test.ts` (9 test) dan E2E `e2e/scroll.spec.ts` (2 test).
  - Verifikasi fase 14 lulus: lint, typecheck, Vitest (299 test), Playwright (83 test),
    audit motion, audit a11y 0 pelanggaran (7 halaman x 9 tema), anggaran bundle
    (JS awal 145.7 KB gzip).
  - Fase 14b: menambahkan border pemisah antara kelompok ikon aksi cepat dan daftar
    bulan di rail, yang sebelumnya hilang sehingga kedua bagian tampak menyatu.
  - Fase 15 lisensi dan distribusi:
    - `LICENSE` (Apache-2.0) dilengkapi baris hak cipta dan tautan repo, serta `NOTICE`
      berisi atribusi wajib sesuai Pasal 4(d). Pemilik: Akhmad Aakhif Athallah (Khip01),
      tahun 2026.
    - `CHANGELOG.md` dibuat dalam bahasa Inggris dengan format `## Unreleased` lalu satu
      seksi per versi, mengikuti kebiasaan repo pemilik.
    - `README.md` ditulis ulang dalam bahasa Inggris: kebutuhan sistem, cara menjalankan,
      daftar halaman, bagian bahasa, data runtime, rilis, dan lisensi. Status pengujian
      SENGAJA tidak ditulis di README dan baru akan didokumentasikan saat v1.0.
    - Launcher lintas platform: `run.cmd` dan `run.ps1` melengkapi `run` yang sudah ada.
    - `packaging/` berisi pintu masuk desktop: `logman.desktop` (dengan placeholder
      `@REPO_DIR@`), `install-desktop.sh`, `Logman.bat`, `Logman.vbs`, dan
      `Logman.command`.
    - `release.yml` tidak lagi membuat arsip tar.gz maupun mengunggah artifact. Alasan:
      arsip hanya berisi `dist/` yang bukan program yang bisa dijalankan. Distribusi
      memakai tag git plus pintasan desktop, dan paket npm global tidak dipakai karena
      nama `logman` sudah terpakai pihak lain serta server perlu direktori data nyata.
    - Identitas judul: `index.html` memakai "Log Book Manager", dan
      `src/lib/domain/pageTitle.ts` menjaga pola judul per halaman beserta unit test-nya.
    - Metadata `package.json` dilengkapi `repository`, `homepage`, `bugs`, dan `keywords`.
  - Fase 16 bahasa antarmuka: lihat bagian 21 untuk aturan lengkapnya.
    - Modul baru `src/lib/i18n/`: `messages/id.ts` (sumber kebenaran key), `messages/en.ts`
      (bertipe `Catalog`), `locale.ts` (tabel hari dan bulan per bahasa), `translate.ts`,
      `useT.ts`, dan `index.ts` sebagai pintu impor.
    - `config.bahasa` menjadi SATU-SATUNYA sumber bahasa. Store bahasa terpisah dibuat
      lalu dihapus agar tidak ada dua sumber kebenaran.
    - Seluruh antarmuka memakai `useT()`: shell, Log Book, editor, Pengaturan, Ekspor,
      dan halaman dev. Daftar berlabel menyimpan key (`labelKey`) sehingga label ikut
      bahasa aktif.
    - Dokumen cetak dan PDF dikunci ke bahasa Indonesia. Pemanggil di lapisan dokumen
      sengaja tidak mengirim locale.
    - Seksi "Bahasa" ditambahkan di Pengaturan (`data-testid="section-bahasa"`), atribut
      `lang` pada `<html>` ikut bahasa aktif, dan judul tab mengikuti halaman serta bahasa.
    - Test baru: `i18n.test.ts`, `pageTitle.test.ts`, dan `e2e/bahasa.spec.ts`.
      `e2e/settings-advanced.spec.ts` dikembalikan ke label Indonesia
      ("Perlihatkan UI pengembangan") dan ditambah reset data penanda tangan agar
      hermetik.
  - Verifikasi fase 15 dan 16 lulus: lint, typecheck, Vitest (318 test), Playwright
    (88 test), audit motion, audit a11y 0 pelanggaran, anggaran bundle (JS awal
    154.5 KB gzip).
  - Fase 17 pencarian Pengaturan: lihat bagian 22 untuk aturan lengkapnya.
    - Modul murni baru `src/lib/domain/settingsSearch.ts` berisi registry sembilan seksi
      plus `searchSettings` dua lapis, `settingsSectionDomId`, dan `settingsSectionIcon`.
    - Komponen baru: `SettingsSearch.tsx` (combobox dua lapis dengan sorotan kata),
      `SettingsSection.tsx` (pembungkus seksi: id stabil, `scroll-mt-20`, kilatan
      sasaran), dan `SettingsFlash.tsx` (konteks permintaan lompatan ber-token).
    - Judul seksi diseragamkan. Sebelumnya empat seksi memakai `SectionTitle` lokal dan
      lima menulis `<h2>` sendiri; kini semuanya lewat `SettingsSection`.
    - Bar pencarian sticky di atas area gulir. PENTING: bar itu sengaja berada di luar
      `m.div` ber-animasi masuk halaman, karena `transform` pada induk yang beranimasi
      mengurung `position: sticky`.
    - Teks keras yang kini menjadi key karena dapat dicari: nama font dokumen
      (`FONT_DOKUMEN_LABEL_KEY`) dan tombol "Putar ulang" di `TierPreview`.
    - Test baru: `settingsSearch.test.ts` (28 test) dan `e2e/settings-search.spec.ts`
      (11 test). Baseline visual Pengaturan diregenerasi.
    - PERBAIKAN setelah tinjauan pemilik: key React saran disusun dari `sectionId` dan
      `match.start`, sehingga DUPLIKAT dan membuat hasil pencarian lama menyantol di atas
      hasil baru saat user mengetik atau menghapus ketikan. Kini setiap saran membawa
      `key` unik dari key pesannya. Tiga test e2e regresi ditambahkan.
  - Fase 17b kilau seksi sasaran pencarian:
    - Komponen baru `src/features/settings/GlintTrail.tsx` plus kelas CSS
      (`.glint-layer`, `.glint-front`, `.glint-ring`, `.glint-cover`, `.glint-shine`).
      Efeknya dibangun dari elemen berukuran tetap yang hanya dianimasikan `transform`
      dan `opacity`, sehingga `border-color`, `background-position`, `box-shadow`, dan
      `clip-path` tidak perlu dianimasikan (bagian 8.2 tetap utuh).
    - Profil tier menambah `sectionShine` dan `sectionBorder`. Preset baru:
      `buildSectionGlintLayerVariants`, `buildSectionShineVariants`,
      `buildSectionBorderVariants`, `sectionGlintDurationSeconds`, dan
      `sectionGlintTotalSeconds`.
    - Token kilau per tema: `--glint-shine`, `--glint-glow`, dan gradien bersama
      `--glint-fill` yang dibangun dari `--glint-shine`. Tema gelap memakai kilau terang,
      tema terang memakai kilau gelap yang lembut, dan tema bernuansa mengikuti warna
      aksennya.
    - `SettingsFlashProvider` membersihkan permintaan setelah rangkaian kilau selesai,
      supaya memilih saran yang sama dua kali tetap memutar ulang animasinya.
    - Penyempurnaan setelah peninjauan hasil visual user:
      - Border dan isian body memakai SATU gradien bersama (`--glint-fill`). Sebelumnya
        border memakai warna solid tersendiri sehingga tampak lebih tajam daripada isian
        body, walaupun warnanya senada.
      - Isian body diubah dari pita yang melintas lewat (translasi `y`) menjadi ISIAN yang
        tumbuh dari atas (`scaleY` dengan `transform-origin: top`), lalu fade out bersama
        border.
      - Gradien dibuat menipis kontinu dari puncak ke dasar. Sebelumnya paruh atasnya
        hampir rata sehingga isian terbaca sebagai blok.
      - Kadar alpha tema terang dinaikkan dan tema gelap diturunkan supaya gradiennya
        terbaca sepanjang tinggi seksi.
    - PERBAIKAN yang ditemukan saat verifikasi: keyframe `opacity` sapuan lama hanya
      empat nilai sementara `times` enam nilai, sehingga sapuan mati sebelum mencapai
      dasar seksi. Jumlah nilai keyframe WAJIB sama dengan jumlah `times`. Setelah isian
      memakai `scaleY`, keyframe `opacity` per-sapuan tidak lagi dipakai.
    - Verifikasi terukur: isian dan penutup border memakai durasi, kurva, dan penundaan
      yang sama; isian mengalir sampai dasar seksi (delta piksel menipis kontinu di tema
      gelap maupun terang); tepi ATAS menyala dan tepi BAWAH persis sama dengan latar di
      ketiga tier (penuh, seimbang, minimal); ukuran seksi tidak berubah
      (720x407 sebelum dan sesudah).
  - Verifikasi fase 17 dan 17b lulus: lint, typecheck, Vitest (356 test), Playwright
    (102 test), audit motion, audit a11y 0 pelanggaran termasuk audit tambahan khusus
    dropdown pencarian dan kilau aktif pada enam tema, anggaran bundle (JS awal
    154.9 KB gzip).
  - Rilis v0.1.0: `CHANGELOG.md` dikonsolidasikan (blok `Unreleased` dilebur ke
    `v0.1.0`), tanggal rilis 2026-09-25, dan tag `v0.1.0` dibuat dengan GPG signed lalu
    di-push. `release.yml` membangun bundle, memeriksa anggaran, dan menerbitkan GitHub
    Release dengan catatan dari CHANGELOG (tanpa arsip).
  - `release.yml` diperbaiki setelah rilis pertama terbit dengan catatan KOSONG:
    `generate_release_notes` menyusun catatan dari daftar PR dan kontributor, sementara
    repo ini menerima commit langsung ke `main` tanpa PR. Catatan kini diambil dari
    `CHANGELOG.md` lewat `scripts/release-notes.mjs` (`pnpm release:notes <tag>`), yang
    gagal keras bila seksi tag tidak ada.
  - Sumber versi disatukan. `server/index.ts` kini membaca `version` dari `package.json`
    lewat `readAppVersion()` (dengan fallback `0.0.0` plus peringatan log), bukan lagi
    string keras. Satu sumber kebenaran versi: `package.json`.
  - Perbaikan gate e2e setelah CI merah pada commit `58482a9`:
    - `e2e/bahasa.spec.ts` kini MENGISI SENDIRI rentang magang di `beforeEach` dan
      memulihkannya di `afterEach`. Sebelumnya spec ini hanya hermetik untuk `bahasa`,
      padahal testnya membuka Log Book yang butuh rentang terisi. Direktori `data-e2e`
      dipakai bersama semua spec dan defaultnya rentang KOSONG, sehingga halaman
      menampilkan empty state dan test gagal di CI.
    - `e2e/data.spec.ts` menambah `afterEach` yang memulihkan rentang valid, karena spec
      ini sengaja mengosongkan lalu membalik rentang.
    - `e2e/perf.spec.ts` memakai ambang long task dari `PERF_LONG_TASK_MS`, dengan default
      50 ms di lokal dan 200 ms di CI. Runner CI jauh lebih lambat sehingga pekerjaan yang
      sama bisa tercatat lebih dari dua kali; gate lokal tetap ketat.
    - `e2e/settings-search.spec.ts` membandingkan ukuran seksi memakai toleransi sub-pixel
      (< 0.5 px), bukan `toBe`, karena `boundingBox()` bisa berbeda di digit terakhir.
    - Pelajaran: setiap spec e2e WAJIB memulihkan config yang ia ubah, bukan hanya
      `bahasa`. `data-e2e` dipakai bersama, jadi apa pun yang ditinggalkan satu spec akan
      dilihat spec berikutnya.
  - Verifikasi rilis v0.1.0 lulus: lint, typecheck, Vitest (364 test), Playwright
    (105 test dari direktori data KOSONG, meniru CI), audit motion, audit a11y 0
    pelanggaran (7 halaman x 9 tema), anggaran bundle (JS awal 154.9 KB gzip).
- Sedang dikerjakan:
  - tidak ada (fase 15, 16, 17, dan 17b tuntas; v0.1.0 sudah dirilis).
- Berikutnya:
  - Pemakaian normal dan pemeliharaan. Bila ada perilaku baru, tambah sesuai
    aturan di bagian 0 dan perbarui dokumen ini pada commit yang sama.
  - Rilis berikutnya: naikkan `version` di `package.json`, pindahkan blok `Unreleased`
    baru di `CHANGELOG.md` menjadi seksi versi bertanggal, lalu `git tag -s` dan push tag.
  - Deskripsi dan topics repo GitHub diterapkan lewat `gh repo edit` setelah ACC
    pemilik.
  - Catatan terbuka:
  - `docs/reference/extracted-metrics.md` sudah memuat metrik docx, sehingga tidak
    perlu membedah ulang docx.
  - Dev server default: web `http://127.0.0.1:5199`, API `http://127.0.0.1:5198`.
  - Commit GPG signing aktif. Setiap commit otomatis ditandatangani.
  - Snapshot visual Playwright sudah ada untuk 3 halaman produk
    (`e2e/visual.spec.ts-snapshots/`). Perbarui baseline bila UI berubah disengaja.

---

## 21. Bahasa antarmuka (i18n)

Aplikasi tampil dalam bahasa Indonesia dan Inggris. Aturan ini mengikat.

Prinsip:
- Bahasa adalah DATA tanggal dan teks antarmuka, bukan konten dokumen. Nama hari dan
  bulan disimpan di `src/lib/i18n/locale.ts` sebagai tabel per bahasa, BUKAN di katalog
  pesan.
- Bahasa Indonesia adalah default dan sumber kebenaran key pesan.
- Dokumen cetak dan PDF SELALU bahasa Indonesia, karena mengikuti template kampus.
  Bahasa antarmuka TIDAK boleh bocor ke `DocumentPrintChrome.tsx`, tabel dokumen saat
  mode cetak, atau `server/pdf.ts`.

Struktur:
- `src/lib/i18n/messages/id.ts`: katalog Indonesia, sumber kebenaran key. Tipe `Catalog`
  diturunkan dari berkas ini.
- `src/lib/i18n/messages/en.ts`: katalog Inggris, bertipe `Catalog`, sehingga key yang
  hilang atau berlebih GAGAL saat compile, bukan bug diam.
- `src/lib/i18n/locale.ts`: `Locale`, `LOCALES`, `DEFAULT_LOCALE`, `isLocale`, dan tabel
  `HARI`, `BULAN`, `BULAN_SHORT` per bahasa.
- `src/lib/i18n/translate.ts`: `translate`, `interpolate`, `missingKeys`, `catalogFor`.
- `src/lib/i18n/useT.ts`: `LocaleContext`, `useLocale`, `useT`, tipe `Translator`.
- `src/lib/i18n/index.ts`: satu-satunya pintu impor yang dipakai komponen.

Aturan pemakaian:
- Komponen WAJIB memakai `const t = useT()` lalu `t('key')`. Dilarang membandingkan atau
  menyalin teks bahasa Indonesia langsung di JSX.
- Bahasa HANYA dibaca dari `config.bahasa`. Dilarang membuat store bahasa terpisah, agar
  tidak ada dua sumber kebenaran.
- Provider `LocaleContext` dipasang di `App.tsx` dari `config.bahasa`.
- Key pesan berupa ID bertitik (`settings.ukuranKertas`), BUKAN kalimat. Mengubah teks
  tidak pernah mengubah key.
- Placeholder memakai kurung kurawal, misal `{nama}`. Bentuk jamak memakai objek
  `{ one, other }`; pilihannya didasarkan pada variabel `count`.
- Daftar yang punya label (tema, tier animasi, skala konten, breadcrumb, item navigasi)
  menyimpan `labelKey` atau key pesan, BUKAN teks siap pakai, supaya label ikut bahasa
  aktif tanpa menyalin data.
- Menambah bahasa: salin `messages/en.ts`, jaga tipe `Catalog`, daftarkan di `CATALOGS`,
  lalu tambahkan kode, nama hari, dan nama bulannya di `locale.ts`.
- Fungsi format tanggal di `src/lib/domain/date.ts` dan `formatWeekRange` di
  `src/lib/domain/calendar.ts` menerima parameter `locale` dengan default `'id'`.
  Pemanggil di lapisan dokumen sengaja TIDAK mengirim locale, sehingga tetap Indonesia.
- Atribut `lang` pada `<html>` dan judul tab (`src/lib/domain/pageTitle.ts`) mengikuti
  bahasa aktif. Judul tab memakai pola `<nama halaman> - Log Book Manager`, sementara
  halaman utama cukup `Log Book Manager`.
- Mengubah bahasa membangun ulang daftar bulan (`useDeriveMonths`), karena label bulan
  ada di dalam data turunan itu.

Pengujian:
- Unit test `src/lib/i18n/i18n.test.ts` memastikan kedua katalog punya key yang persis
  sama, tidak ada pesan kosong, dan tidak ada key yang belum diterjemahkan.
- E2E `e2e/bahasa.spec.ts` menguji default, judul tab, pengalihan bahasa, dan bahwa
  dokumen cetak tetap Indonesia. Spec ini WAJIB mengembalikan `bahasa` ke `id` di
  `afterEach`, karena `data-e2e` bertahan antar run dan bahasa Inggris akan merusak spec
  lain yang mencari teks Indonesia.

---

## 22. Pencarian halaman Pengaturan

Halaman Pengaturan punya sembilan seksi. Menggulir manual untuk mencari satu pengaturan
melelahkan, jadi halaman ini punya kotak pencarian. Aturan ini mengikat.

Bentuk hasil (dua lapis, urutannya tetap):
1. Lapis judul: query dicocokkan ke NAMA seksi, misal "jam" menemukan "Jam Default".
   Baris saran menampilkan ikon dan nama menu saja.
2. Lapis konten: query dicocokkan ke teks DI DALAM seksi, misal "PDF" menemukan deskripsi
   font dokumen. Baris saran menampilkan ikon, nama menu, lalu potongan teks yang memuat
   kata itu, sehingga user tahu kenapa hasilnya muncul.
- SELURUH hasil lapis judul selalu mendahului SELURUH hasil lapis konten. Urutan di dalam
  tiap lapis mengikuti urutan seksi di halaman.
- Kata yang cocok disorot memakai token aksen tema (`bg-accent` + `text-accent-text`),
  jadi sorotannya berkontras di kesembilan tema tanpa warna keras baru. Ini warna statis,
  bukan animasi, sehingga aturan bagian 8 tidak tersentuh.
- Saran teratas SELALU otomatis terpilih. Enter langsung memakai saran itu tanpa perlu
  menekan panah lebih dulu. Panah atas dan bawah memindahkan pilihan, Escape menutup
  daftar tanpa menghapus ketikan.
- Query kosong (atau hanya spasi) menampilkan SELURUH menu pada lapis judul tanpa
  highlight. Saat kotak difokuskan, user langsung melihat apa saja yang bisa dicari.
- Tanpa hasil: satu baris "Tidak ada yang cocok" (`settings.cari.kosong`).
- Memilih saran menggulir ke seksi tujuan sambil memberi kilatan singkat.

Struktur dan aturan implementasi:
- Registry seksi ada di `src/lib/domain/settingsSearch.ts`. Modul ini MURNI: tanpa React
  dan tanpa DOM, sehingga daftar saran dapat diuji tanpa browser.
- `SETTINGS_SECTIONS` memuat `id`, `titleKey`, `icon` (nama ikon, BUKAN komponen Lucide,
  supaya modul tetap murni), dan `contentKeys`.
- ATURAN: hanya key TANPA placeholder yang boleh masuk `contentKeys`, karena potongan
  hasil ditampilkan apa adanya. Key ber-interpolasi seperti `settings.hapusPembimbing`
  dikecualikan supaya snippet tidak menampilkan `{nama}`.
- `searchSettings(query, locale)` mengembalikan saran berisi `key`, `kind`
  (`title`/`content`), `sectionId`, `icon`, `sectionTitle`, `snippet`, dan `match`
  (`{ start, length }`) untuk highlight. Pencocokan memakai `includes` pada teks yang
  sudah diterjemahkan dan di-lowercase, BUKAN regex, supaya query dengan karakter khusus
  tidak pernah melempar error.
- JEBAKAN YANG SUDAH DIPERBAIKI: setiap saran WAJIB punya `key` yang stabil dan UNIK,
  dibentuk dari key pesan (`title:<sectionId>` atau `content:<sectionId>:<contentKey>`).
  Sempat dipakai kombinasi `sectionId` dan `match.start`, dan itu BUG: banyak saran mulai
  cocok di indeks yang sama (mis. "Nama mahasiswa", "Nama lengkap", "Nama Mitra Industri"
  semuanya indeks 0), sehingga key React DUPLIKAT. Akibatnya saran dari ketikan sebelumnya
  tidak dibuang dan menyantol di atas hasil baru saat user mengetik atau menghapus
  ketikan. JANGAN pernah menyusun key saran dari posisi match atau dari indeks array.
- `settingsSectionDomId(id)` menghasilkan id DOM seksi (`settings-section-<id>`), dipakai
  pencarian untuk menggulir. `settingsSectionIcon(id)` menjaga ikon judul dan ikon saran
  selalu sama.
- Menambah seksi baru: tambahkan entri di `SETTINGS_SECTIONS`, bungkus markup-nya dengan
  `SettingsSection`, lalu daftarkan key teks yang ingin dapat dicari.
- Teks antarmuka yang tadinya keras di kode dan kini menjadi key karena dapat dicari:
  nama font dokumen (`FONT_DOKUMEN_LABEL_KEY`) dan tombol "Putar ulang" di `TierPreview`.

Komponen:
- `src/features/settings/SettingsSearch.tsx`: kotak pencarian dan dropdown. Memakai
  `role="combobox"` dengan `aria-expanded`, `aria-controls`, dan `aria-activedescendant`;
  daftar `role="listbox"`; tiap saran memakai `<button role="option" tabIndex={-1}>`,
  BUKAN `<div role="option">`, karena elemen ber-role interaktif wajib dapat difokus dan
  aturan lint menolak `div` ber-role `option`. Pola ini sama dengan
  `Combobox.tsx` supaya perilaku keyboard dan hasil audit a11y konsisten. Dropdown
  dirender seketika tanpa Motion.
- `src/features/settings/SettingsSection.tsx`: pembungkus seksi. Menyatukan `<section>`,
  `id` stabil, `data-testid="section-<id>"`, `scroll-mt-20` (ruang untuk bar pencarian
  yang sticky), dan kilatan sasaran. Sebelumnya tiap seksi menulis `<section>` dan `<h2>`
  sendiri, sehingga id dan kilatan tidak bisa dipasang seragam.
- `src/features/settings/SettingsFlash.tsx`: konteks permintaan lompatan
  (`SettingsFlashProvider`, `useSettingsJump`, `useSettingsFlashTarget`). Kotak pencarian
  dan seksi tujuan adalah komponen bersaudara, jadi cukup SATU konteks; tidak perlu store
  global. Bentuknya meniru `focusRequest` pada store logbook: ada `token` yang naik
  setiap permintaan, sehingga memilih saran yang sama dua kali tetap memutar ulang kilatan.

Perilaku gulir dan kilatan:
- Bar pencarian STICKY di atas area gulir (`sticky top-0`), supaya tetap terjangkau saat
  user menggulir jauh ke bawah.
- Bar pencarian SENGAJA berada di luar `m.div` ber-animasi masuk halaman: `transform` pada
  induk yang beranimasi akan mengurung `position: sticky` di dalamnya, sehingga bar tidak
  akan menempel. Karena itu `SettingsPage` memasang `pageVariants` pada pembungkus konten
  dan menaruh bar di luarnya.
- Kilatan memakai ulang `buildRowFlashVariants` dan `rowFlashDurationSeconds` dari
  `src/motion/presets.ts`, sama seperti kilatan baris dari banner validasi (bagian 11.3).
  HANYA `opacity` yang dianimasikan. Tier `mati` tidak berkedip, hanya menggulir.
- Perilaku gulir mengikuti tier: halus bila tier mengizinkan gerakan sekunder, langsung
  pada `minimal` dan `mati`.

Kilau sasaran:
- Memilih saran tidak hanya menggulir, tetapi juga memberi KILAU pada seksi tujuan.
  Bentuknya dua hal yang berjalan seiring:
  1. Isian cahaya pada body seksi yang NGE-FILL dari atas: elemennya setinggi seluruh
     seksi, tepi atasnya diam di puncak, dan tepi bawahnya yang turun sampai penuh.
     Bukan pita yang melintas lewat.
  2. Garis border yang merembet melingkari seksi: sisi atas muncul lebih dulu, lalu sisi
     kiri dan kanan tumbuh ke bawah. Sisi BAWAH sengaja TIDAK diberi garis.
- Warna border dan isian body WAJIB memakai satu gradien bersama, `--glint-fill`, yang
  dibangun dari `--glint-shine`. Jangan memberi border warna solid tersendiri: walaupun
  warnanya senada, border solid selalu terlihat lebih tajam daripada isian body yang
  bergradien, jadi keduanya tidak menyatu.
- Gradien `--glint-fill` menipis KONTINU dari puncak ke dasar (stop tengah di 52 persen
  memakai turunan `--glint-shine`, bukan `--glint-glow`). Paruh atas yang hampir rata
  membuat isian terbaca sebagai blok, bukan cahaya yang menipis.
- PENTING: `border-color`, `border-width`, `background-position`, `box-shadow`, dan
  `clip-path` DILARANG dianimasikan (bagian 8.2). Efeknya dibangun dari elemen
  berukuran TETAP yang hanya dianimasikan `transform` dan `opacity`:
  - `.glint-ring` adalah garis border statis pada tepi seksi, digambar dengan
    `border-image: var(--glint-fill) 1` dan `border-bottom: none`.
  - `.glint-cover` adalah kotak opaque sewarna latar yang MENUTUPI garis itu, lalu
    meluncur turun. Karena tepi atasnya adalah garis depan, border tampak tersingkap dari
    atas ke bawah. Kotak ini mengelilingi area di LUAR panel, jadi tidak pernah menutupi
    teks; konten seksi diberi `relative z-10` supaya selalu di atas lapisan kilau.
  - `.glint-shine` adalah isian bergradien statis dengan `transform-origin: top` yang
    hanya dianimasikan `scaleY` dari 0 ke 1.
  - Pendinginan border memakai `box-shadow` STATIS pada `.glint-ring`, bukan yang
    dianimasikan.
- Isian body dan penutup border memakai durasi, kurva, dan penundaan yang SAMA PERSIS,
  jadi tepi bawah isian dan tepi atas penutup border turun seirama. Jangan mengubah salah
  satunya tanpa yang lain; ada unit test yang menjaga kesamaan itu.
- Gerakannya sengaja TIDAK linier, memakai `sectionGlintEase` = `Cubic(0.86, 0, 0.07, 1)`
  (sama dengan `Curves.easeInOutQuint` di Flutter): lambat di awal, cepat di tengah,
  lambat lagi di akhir.
- Rangkaiannya: gulir mendarat, fade in memperlihatkan keadaan awal, isian dan border
  berjalan, keadaan akhir ditahan, lalu fade out bersama-sama. Kilau BARU mulai setelah
  gulir mendarat (`onScrollSettle`), bukan saat gulir masih berjalan.
- Kadar per tier, dari `sectionShine` dan `sectionBorder` di `MOTION_TIER_PROFILE`:
  - `penuh`: isian body DAN border penuh berikut pendinginan.
  - `seimbang`: border penuh berikut pendinginan, TANPA isian body.
  - `minimal`: border tipis tanpa pendinginan, tanpa isian body.
  - `mati`: tidak ada kilau sama sekali, hanya menggulir.
- Lama rangkaian = `sectionGlintTotalSeconds` (fade in + isian + tahan + fade out), dan 0
  pada tier `mati`. `SettingsSection` membersihkan permintaan setelah durasi itu, supaya
  memilih saran yang sama dua kali tetap memutar ulang kilau dan animasinya tidak
  terpotong di tengah.
- Kilau HANYA berjalan saat seksi dipilih dari kotak pencarian. Mengubah tier di
  Pengaturan tidak memicunya.

Pengujian:
- Unit `src/lib/domain/settingsSearch.test.ts` menguji urutan dua lapis, rentang highlight
  (termasuk saat snippet dipotong), pencocokan lintas bahasa, query kosong, tanpa hasil,
  dan guard bahwa semua key registry ada di katalog, bukan bentuk jamak, dan tidak
  menyisakan placeholder.
- E2E `e2e/settings-search.spec.ts` menguji saran judul, saran konten, Enter memakai saran
  teratas, navigasi panah, pesan kosong, Escape, fokus tanpa ketikan, dan bahasa. Spec ini
  WAJIB mengembalikan `bahasa` ke `id` di `afterEach`, karena `data-e2e` bertahan antar run.
- TIGA test regresi khusus untuk bug key duplikat di atas: menambah huruf tidak menyisakan
  saran lama, menghapus seluruh ketikan kembali ke sembilan menu, dan menghapus sebagian
  ketikan hanya menyisakan saran yang cocok. Jangan hapus ketiganya.
- Unit `src/motion/presets.test.ts` menguji kadar kilau tiap tier, bahwa isian body memakai
  `scaleY` (bukan translasi `y`) sehingga NGE-FILL, bahwa isian dan border memakai waktu,
  kurva, dan penundaan yang sama, gerakan yang tidak linier, durasi, dan bahwa hanya
  `transform` serta `opacity` yang dipakai.
- E2E `e2e/settings-search.spec.ts` juga menguji: kilau muncul pada tier penuh, hanya
  border tanpa isian pada tier seimbang dan minimal, tidak ada kilau sama sekali pada
  tier `mati`, elemen kilau tidak menangkap klik, ukuran seksi TIDAK berubah saat kilau
  berjalan, dan sisi bawah border tidak menyala.
