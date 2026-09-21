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
│   │   ├── settings/
│   │   └── export/
│   ├── motion/          # layer preset animasi terregistrasi
│   ├── lib/
│   │   ├── domain/      # logika murni: tanggal, kepemilikan bulan, validasi
│   │   ├── repo/        # LogRepository + HttpLogRepository + InMemoryLogRepository
│   │   ├── log/         # logger terstruktur dengan traceId
│   │   └── utils/       # helper umum
│   ├── stores/          # Zustand store
│   └── styles/
│       ├── tokens.css   # 9 tema sebagai CSS custom properties + @theme Tailwind
│       └── globals.css  # base, scrollbar, print CSS, reduced-motion
├── server/              # Hono: config, logs, PDF, backup, logging
├── data/                # data runtime (gitignored)
│   ├── config.json
│   ├── logs.json
│   ├── backups/
│   └── logs/            # log aplikasi (JSON lines)
├── e2e/                 # Playwright: spec, snapshot, fixture
├── scripts/             # audit animasi saat build, utilitas
├── public/              # aset statis (logo letterhead, favicon)
└── dev/                 # halaman dev: /dev/components, /dev/motion, /dev/perf
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
  "folderExport": "string (path lokal)"
}
```

- `magang.mulai` dan `magang.selesai` WAJIB diisi sebelum daftar Log Book muncul.
  Tanpa rentang, halaman daftar hanya menampilkan arahan ke Settings.
- `alasan` adalah daftar yang bisa dikelola user. Selain dropdown, user boleh mengetik
  teks bebas yang tidak ada di daftar.
- `jamDefault` per hari. Bila user mengosongkan jam pada form, nilai default ini dipakai.

### 5.2 `data/logs.json` (satu file untuk semua log)

- Satu file JSON global. BUKAN satu file per bulan.
- Berisi seluruh minggu dan seluruh entri hari.
- Struktur internal bebas dirancang, namun harus mendukung: identifikasi minggu,
  tanggal tiap hari, jam masuk, jam pulang, isi kegiatan, status hari (terisi, kosong,
  libur, sakit, izin), dan alasan bila kosong.
- Perubahan disimpan otomatis (lihat bagian 7).

### 5.3 Backup

- `data/backups/` menyimpan rotasi beberapa versi terakhir `logs.json` dan `config.json`.
- Rotasi dibuat sebelum penulisan yang menimpa, supaya salah edit bisa dipulihkan.
- Autosave menimpa file utama secara langsung, jadi backup bukan opsional.

### 5.4 Akses data (DIP)

- Interface `LogRepository` dan `ConfigRepository` di `src/lib/repo/`.
- Implementasi `HttpLogRepository` untuk runtime, `InMemoryLogRepository` untuk test dan CI.
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
- Area dokumen A4 tetap bersih: monokrom, tanpa aksen, tanpa animasi. Preview harus sama
  dengan hasil cetak.

### 10.1 Primitif UI (`src/components/ui/`)

- Satu komponen, satu file. Ekspor lewat barrel `src/components/ui/index.ts`.
- Varian memakai CVA. Nama variant dan size harus konsisten antar komponen.
- Radix hanya untuk perilaku dan aksesibilitas. Tampilan selalu direstyle total ke token
  kita. DILARANG membiarkan gaya bawaan Radix atau shadcn apa adanya.
- Komponen yang tersedia:
  - Dasar: `Button`, `Card` (+ Header/Title/Description/Content/Footer), `Badge`,
    `Separator`, `Kbd`, `Spinner`, `EmptyState`.
  - Form: `Input`, `Textarea`, `Label`, `Field`, `Switch`, `Checkbox`, `Slider`,
    `Select`, `Combobox`, `SegmentedControl`.
  - Overlay: `Dialog`, `Popover`, `Tooltip` (+ `SimpleTooltip`).
- `Combobox` mendukung pilih dari daftar DAN teks bebas. Ini dipakai untuk kolom alasan
  hari kosong (bagian 11.3).
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
- Tabel dirender simple: border 1 px, tanpa sudut membulat, tanpa bayangan berlebih,
  header shading `#D0CECE`. Hindari tampilan tabel HTML kuno yang jelek.
- Format jam memakai titik, misal `08.00`, sesuai template. `input type="time"` boleh
  dipakai di internal, tetapi tampilan ke user wajib format titik.
- Tanggal ditulis format Indonesia, misal `Senin, 5 Januari 2026`.
- Navigasi keyboard: Tab berpindah antar sel, Enter menambah baris baru di kolom Kegiatan.

### 11.3 Hari kosong

- Setiap hari yang kosong WAJIB punya alasan sebelum ekspor.
- Alasan dipilih dari dropdown yang bisa dikelola user, ATAU diketik bebas.
- Khusus Sakit dan Izin: jam masuk dan jam pulang ditampilkan sebagai strip (bukan angka),
  dan kolom Kegiatan diisi alasan tersebut.
- Banner validasi di atas tabel menampilkan daftar hari yang belum lengkap sebelum ekspor.

### 11.4 Navigasi

- Sidebar bersifat overlay: menumpuk DI ATAS konten dengan backdrop, TIDAK mendorong
  lebar konten.
- Saat collapse, sidebar menjadi rail sempit berisi teks 3 huruf bulan.
- Klik ikon bulan akan memperluas daftar minggu di bulan itu (M1, M2, ...). User tetap
  bisa memilih minggu walau sidebar dalam kondisi tertutup.
- Animasi sidebar memakai spring dan stagger.

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
- Kop surat dan blok tanda tangan ikut lengkap di dokumen.
- Pola nama file: `LogBook_<NIM>_<Bulan>-<Tahun>.pdf`.
- Hasil ekspor disimpan ke folder lokal yang dikonfigurasi di `config.json`.
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
| `src/features/*` (1 fitur) | unit/component test fitur itu + e2e spec fitur itu saja |
| `server/*` | `pnpm test:server` + e2e spec terkait bila endpoint berubah |
| `e2e/<spec>.ts` saja | `pnpm playwright test e2e/<spec>.ts` |
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
- Mode seed/demo: tombol mengisi satu bulan data contoh untuk pengujian cepat.

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

- Build produksi, lalu GitHub Release berisi artifact build.

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

---

## 19. Checklist sebelum menandai pekerjaan selesai

- [ ] Tidak ada emoji dan em dash di file yang diubah.
- [ ] Tidak ada animasi properti terlarang (bagian 8.2).
- [ ] Tidak ada nilai hex warna di luar `tokens.css`.
- [ ] Tidak ada impor Motion global.
- [ ] Domain logic murni dan ada unit test-nya.
- [ ] Anggaran performa masih terpenuhi.
- [ ] Dokumen ini diperbarui bila perilaku berubah.
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

- Fase saat ini: 7 (ekspor PDF) selesai. Berikutnya fase 8 (render/preview dokumen,
  validasi ekspor, mode seed).
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
- Sedang dikerjakan:
  - tidak ada (fase 7 tuntas).
- Berikutnya:
  - Fase 8: render/preview dokumen di browser, validasi ekspor, mode seed
    (bagian 18 poin 7 dan 8).
- Catatan terbuka:
  - `docs/reference/extracted-metrics.md` sudah memuat metrik docx, sehingga tidak
    perlu membedah ulang docx.
  - Dev server default: web `http://127.0.0.1:5199`, API `http://127.0.0.1:5198`.
  - Commit GPG signing aktif. Setiap commit otomatis ditandatangani.
  - Snapshot visual Playwright belum dibuat (dijadwalkan di fase 9).
