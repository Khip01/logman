import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { DEV_HOST, readDevPorts } from './dev-ports.mjs'

/**
 * Membuat screenshot untuk README.
 *
 * Jalankan dengan: `./run screenshots`
 *
 * Dua aturan yang tidak boleh dilanggar:
 *
 * 1. Data yang dipakai SELALU DUMMY dan skrip ini memakai direktori data sendiri
 *    (`data-screenshots/`). `data/` milik pemilik aplikasi TIDAK PERNAH disentuh.
 *    Nama, NIM, perusahaan, dan nama pembimbing di bawah ini fiktif. Jangan diisi data
 *    asli siapa pun, termasuk data pemilik, karena hasilnya masuk ke repo publik.
 *
 * 2. Bulan dan minggu yang ditampilkan dipilih EKSPLISIT lewat rail, bukan relying
 *    pada keadaan awal aplikasi. Aplikasi memilih bulan awal dari tanggal hari ini, jadi
 * kalau hanya mengandalkan keadaan awal, gambar berubah hanya karena tanggal
 *    dijalankan. Pilihan eksplisit membuat hasilnya sama kapan pun skrip dijalankan.
 *
 * Animasi dibekukan lewat CSS yang disuntikkan supaya tidak ada yang tertangkap di
 * tengah animasi dan hasilnya deterministik.
 */

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const OUT_DIR = join(root, 'docs', 'screenshots')
const DATA_DIR = 'data-screenshots'

// Port dibaca dari berkas hasil pemilihan port dev, bukan ditulis langsung, supaya
// skrip ini tetap menemukan server yang sedang berjalan walau portnya dinaikkan.
const devPorts = readDevPorts()
const WEB = `http://${DEV_HOST}:${devPorts.webPort}`
const API = `http://${DEV_HOST}:${devPorts.apiPort}`

/**
 * Bulan dan minggu yang ditampilkan, dikunci agar tidak ikut tanggal hari ini.
 *
 * Minggunya M4, yaitu 21 sampai 26 September 2026, karena itulah minggu yang isinya
 * ditulis khusus di `KEGIATAN_TAMPIL`.
 */
const BULAN = '2026-09'
const BULAN_LABEL = 'September 2026'
const MINGGU = 'M4'

/**
 * Identitas dummy. SEMUA fiktif.
 *
 * Program studi sengaja dibuat berbeda dari program studi pemilik, dan NIM memakai
 * prefix program studi itu supaya formatnya tetap konsisten.
 */
const PROFIL = {
  nama: 'Rizky Aditya Pratama',
  nim: '234172807531',
  programStudi: 'Sarjana Terapan Teknik Komputer',
  mitraIndustri: 'PT Cakrawala Teknologi Nusantara',
}

const DOSEN = 'Dr. Ir. Bambang Setiawan, M.T.'
const LAPANGAN = ['Dewi Anggraini, S.T.', 'Fajar Nugroho, S.Kom.']

/**
 * Alasan dummy. Bentuknya WAJIB mengikuti config terbaru: objek dengan `label` dan
 * `stripJam`, bukan `string[]` polos. Kalau ditulis sebagai string, server akan
 * mem|Format ulang ke bentuk lama dan toggle strip di Settings tidak akan tampil.
 */
const ALASAN = [
  { label: 'Libur Nasional', stripJam: false },
  { label: 'Cuti Bersama', stripJam: false },
  { label: 'Izin', stripJam: true },
  { label: 'Sakit', stripJam: true },
  { label: 'Presentasi Project', stripJam: false },
  { label: 'Magang Belum Dimulai', stripJam: false },
]

/** Hari kerja dummy: Senin sampai Sabtu, sama dengan bawaan aplikasi. */
const HARI_KERJA = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']

const JAM_DEFAULT = {
  senin: { masuk: '08.00', pulang: '16.00' },
  selasa: { masuk: '08.00', pulang: '16.00' },
  rabu: { masuk: '08.00', pulang: '16.00' },
  kamis: { masuk: '08.00', pulang: '16.00' },
  jumat: { masuk: '08.00', pulang: '16.00' },
  sabtu: { masuk: '08.00', pulang: '14.00' },
}

const RENTANG = { mulai: '2026-07-01', selesai: '2026-09-30' }

/** Kegiatan contoh, diputar berurutan untuk hari yang tidak punya isi khusus. */
const KEGIATAN = [
  'Menyusun dokumentasi endpoint API untuk modul autentikasi',
  'Mencoba mereproduksi bug pada halaman laporan penjualan',
  'Mempelajari alur deployment di server staging',
  'Membantu membuat unit test untuk modul notifikasi',
  'Memperbaiki komponen tabel agar lebih mudah dirawat',
  'Mengecek konsistensi data antara dua sistem',
  'Membaca dokumentasi library pihak ketiga',
  'Menyiapkan data uji untuk pengujian manual',
  'Berdiskusi soal kebutuhan modul dengan analis sistem',
  'Memperbarui diagram alur pada dokumentasi internal',
]

/**
 * Kegiatan yang ditulis khusus untuk dua minggu yang tampil di screenshot.
 *
 * Ditulis eksplisit supaya isi kolom yang terlihat di README bisa dikontrol, bukan
 * bergantung pada urutan pemutaran. Beberapa baris memakai penanda format teks
 * (judul, tebal, miring) supaya screenshot memperlihatkan fitur itu, termasuk di PDF.
 *
 * Dua minggu ditulis eksplisit karena keduanya muncul di README:
 * - 31 Agustus sampai 5 September: ini MINGGU PERTAMA bulan September, jadi
 *   tampil di halaman pertama PDF dan memperlihatkan format teks di hasil cetak.
 * - 21 sampai 26 September: ini minggu yang ditampilkan di screenshot aplikasi.
 */
const KEGIATAN_TAMPIL = {
  // Minggu 1, halaman pertama PDF.
  '2026-08-31':
    '# Pembukaan Magang\nMemperkenalkan diri ke pihak perusahaan dan menerima ' +
    'panduan kerja dari pembimbing lapangan.',
  '2026-09-01':
    'Menyiapkan **lingkungan kerja** dan membaca dokumen standar prosedur yang ' +
    'diterapkan di tim.',
  // 2 September memakai alasan, bukan kegiatan, jadi sengaja tidak ada di sini.
  '2026-09-03': 'Mencoba *menjalankan proyek* dari awal sampai selesai untuk pertama kali.',
  '2026-09-04':
    '## Catatan Evaluasi\nMenerima masukan tentang struktur kode yang dipakai di ' +
    'perusahaan dan menjadikannya acuan untuk minggu berikutnya.',
  '2026-09-05':
    'Merapikan berkas yang belum rapi dan membuat daftar tugas untuk minggu berikutnya.',

  // Minggu 4, screenshot aplikasi.
  '2026-09-21':
    '# Orientasi Divisi\nMemperkenalkan diri ke tim developer serta mengikuti ' +
    'proses daily stand-up pagi.',
  '2026-09-22':
    '## Pembagian Tugas\nMenerima akses repository dan menyiapkan lingkungan ' +
    ' pengembangan lokal.',
  '2026-09-23':
    'Mempelajari arsitektur **microservice** dan alur request dari gateway ke ' +
    'service terkait.',
  '2026-09-24':
    '## Evaluasi Mingguan\nMengerjakan *tinjauan kode* pada dua pull request dan ' +
    'memberi catatan perbaikan.',
  '2026-09-25':
    'Menyusun ringkasan mingguan dan menyiapkan bahan bahasan untuk sesi ' + 'berikutnya.',
  '2026-09-26':
    'Merapikan dokumentasi setup lingkungan yang belum lengkap dan membuat ' +
    'panduan menjalankan proyek.',
}

/** Alasan pada tanggal tertentu supaya kolom alasan tidak selalu kosong. */
const ALASAN_PADA_TANGGAL = {
  '2026-08-12': 'Izin',
  '2026-08-29': 'Presentasi Project',
  '2026-09-02': 'Sakit',
  '2026-09-19': 'Izin',
}

/**
 * Beku animasi dan transisi.
 *
 * Gaya yang sama dipakai `scripts/axe-check.mjs`. Hanya berlaku di sesi screenshot,
 * tidak pernah masuk ke aplikasi.
 */
const BEKU_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`

/* ------------------------------------------------------------------ util */

function log(pesan) {
  console.log(`[screenshots] ${pesan}`)
}

/** Semua tanggal Senin sampai Sabtu di dalam rentang, karena hanya itu yang punya baris. */
function tanggalTerisi(mulai, selesai) {
  const hasil = []
  const kursor = new Date(`${mulai}T00:00:00Z`)
  const akhir = new Date(`${selesai}T00:00:00Z`)
  while (kursor <= akhir) {
    if (kursor.getUTCDay() !== 0) hasil.push(kursor.toISOString().slice(0, 10))
    kursor.setUTCDate(kursor.getUTCDate() + 1)
  }
  return hasil
}

/** Status hari, mengikuti aturan yang sama dengan `statusFromAlasan` di server. */
/**
 * Status hari untuk entri yang beralasan.
 *
 * WAJIB memakai tanda `stripJam` milik alasannya, sama seperti `statusFromAlasan` di
 * server. Kalau di sini ditulis ulang secara lokal, hasil screenshot bisa berbeda dari
 * aplikasi, dan itu persis yang harus dihindari skrip ini.
 */
function statusDariAlasan(alasan) {
  const item = ALASAN.find((a) => a.label.toLowerCase() === alasan.trim().toLowerCase())
  if (item?.stripJam) return 'izin'
  return 'libur'
}

/** Membangun seluruh entri hari untuk rentang magang. */
function bangunData() {
  const days = {}
  let index = 0
  for (const date of tanggalTerisi(RENTANG.mulai, RENTANG.selesai)) {
    const alasan = ALASAN_PADA_TANGGAL[date] ?? null

    // Hari beralasan tidak punya kegiatan, karena alasan mewakili isi hari itu.
    if (alasan !== null) {
      days[date] = {
        date,
        masuk: null,
        pulang: null,
        kegiatan: '',
        alasan,
        status: statusDariAlasan(alasan),
      }
      continue
    }

    const khusus = KEGIATAN_TAMPIL[date]
    days[date] = {
      date,
      masuk: null,
      pulang: null,
      kegiatan: khusus ?? KEGIATAN[index % KEGIATAN.length] ?? '',
      alasan: null,
      status: 'terisi',
    }
    index += 1
  }
  return { version: 1, days }
}

async function tungguSiap(url, batasMs = 120_000) {
  const akhir = Date.now() + batasMs
  while (Date.now() < akhir) {
    try {
      const respon = await fetch(url)
      if (respon.ok) return
    } catch {
      // Server belum siap, coba lagi.
    }
    await new Promise((selesai) => setTimeout(selesai, 500))
  }
  throw new Error(`Server tidak siap di ${url}`)
}

/* --------------------------------------------------------------- server */

function jalankanServer() {
  rmSync(join(root, DATA_DIR), { recursive: true, force: true })
  mkdirSync(join(root, DATA_DIR), { recursive: true })

  const proses = spawn('pnpm', ['dev'], {
    cwd: root,
    env: { ...process.env, LOGMAN_DATA_DIR: DATA_DIR },
    stdio: 'ignore',
    detached: true,
  })

  return (async () => {
    await tungguSiap(`${API}/api/health`)
    await tungguSiap(WEB)
    log(`server siap dengan data dummy terisolasi di ${DATA_DIR}`)
    return proses
  })()
}

function hentikanServer(proses) {
  if (!proses?.pid) return
  try {
    // Negatif berarti kills process group, penting karena `pnpm dev` menjalankan dua
    // anak (vite dan tsx). Tanpa ini prosesnya yatim dan port tetap dipakai.
    process.kill(-proses.pid, 'SIGTERM')
  } catch {
    proses.kill('SIGTERM')
  }
}

/* --------------------------------------------------------------- seeding */

async function isiData() {
  const saatIni = (await (await fetch(`${API}/api/config`)).json()).config

  await fetch(`${API}/api/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      config: {
        ...saatIni,
        profil: PROFIL,
        magang: RENTANG,
        jamDefault: JAM_DEFAULT,
        hariKerja: HARI_KERJA,
        alasan: ALASAN,
        dosenPembimbing: DOSEN,
        pembimbingLapangan: LAPANGAN,
        pembimbingLapanganDefault: LAPANGAN[0],
        tema: 'word-dark',
        bahasa: 'id',
        tierAnimasi: 'penuh',
        tampilkanDevUi: false,
        formatJam: '24',
        fontDokumen: 'times',
        ukuranKertas: 'A4',
        contentScale: 1,
        folderExport: '',
      },
    }),
  })

  await fetch(`${API}/api/logs`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: bangunData() }),
  })

  log(`data dummy terisi untuk ${RENTANG.mulai} s/d ${RENTANG.selesai}`)
}

/* --------------------------------------------------------------- capture */

async function bukaHalaman(context, path) {
  const page = await context.newPage()
  await page.goto(`${WEB}${path}`, { waitUntil: 'domcontentloaded' })
  await page.addStyleTag({ content: BEKU_CSS })
  await page.waitForTimeout(300)
  return page
}

/**
 * Berpindah ke bulan dan minggu yang sudah dikunci.
 *
 * Inilah yang membuat screenshot tidak bergantung tanggal hari ini.
 *
 * Catatan: tombol bulan di rail hanya MEMBUKA popover, tidak memilih bulan,
 * jadi minggu yang dipilih dari popover itu yang menetapkan bulan dan minggu sekaligus.
 *
 * Cara mencari tombol minggu memakai isi span minggu persis, bukan nama aksesibel
 * button. Nama aksesiblenya menyatu tanpa spasi, misalnya "M4" + "21 Sep - 26 Sep"
 * menjadi "M421 Sep - 26 Sep", sehingga tidak bisa dicocokkan dengan andal.
 */
async function pilihBulanDanMinggu(page) {
  await page.getByRole('button', { name: `Bulan ${BULAN_LABEL}` }).click()

  const popover = page.locator('[data-slot="popover-content"]')
  await popover
    .locator('button')
    .filter({ has: page.locator('span.font-semibold', { hasText: new RegExp(`^${MINGGU}$`) }) })
    .click()

  /*
   * Tombol minggu di dalam popover tidak memakai Popover.Close, jadi popover TIDAK
   * menutup sendiri setelah dipilih. Kalau dibiarkan, panelnya masih menutupi sidebar
   * saat gambar diambil. Escape menutupnya tanpa mengubah pilihan minggu.
   */
  await page.keyboard.press('Escape')
  await page.waitForTimeout(250)
}

async function tangkapLogbook(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'id-ID',
    reducedMotion: 'reduce',
  })
  const page = await bukaHalaman(context, '/')
  await pilihBulanDanMinggu(page)

  /*
   * Di viewport pendek, tabel dokumen baru mulai terlihat di bagian bawah layar,
   * padahal tabel itu bagian paling penting dari halaman ini. Halaman digeser supaya
   * tabel terlihat utuh tanpa kepala halaman yang tidak perlu.
   */
  await page.locator('table.doc-table').scrollIntoViewIfNeeded()
  await page.evaluate(() => {
    document.querySelector('table.doc-table')?.scrollIntoView({ block: 'center' })
  })
  await page.waitForTimeout(300)

  await page.screenshot({ path: join(OUT_DIR, 'logbook.png') })
  await context.close()
  log('logbook.png')
}

async function tangkapExport(browser) {
  /*
   * Halaman Ekspor isinya cuma judul dan tiga baris bulan. Viewpoin tetap yang lebar,
   * lalu tingginya diukur dari isi lalu ditambah tinggi status bar, supaya tidak ada
   * ruang kosong besar di bawah gambar.
   */
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'id-ID',
    reducedMotion: 'reduce',
  })
  const page = await bukaHalaman(context, '/export')

  const tinggi = await page.evaluate(() => {
    /*
     * `main` dan pembungkus `min-h-full` di dalamnya sama-sama mengisi tinggi viewport,
     * jadi mengukur keduanya selalu menghasilkan viewport penuh. Yang dicari adalah tepi
     * bawah paling bawah dari elemen yang benar-benar berisi konten, yaitu yang tidak
     * menyentuh tepi bawah `main`.
     */
    const main = document.querySelector('main')
    const tepiMain = main?.getBoundingClientRect().bottom ?? 0
    let batas = 0
    for (const el of main?.querySelectorAll('*') ?? []) {
      const tepi = el.getBoundingClientRect().bottom
      /*
       * Pembanding WAJIB ketat (`<`), bukan `<=`. Pembungkus `min-h-full` tepinya
       * sama persis dengan tepi `main`, jadi dengan `<=` ikut terambil dan hasilnya
       * viewport penuh kembali.
       */
      if (tepi > batas && tepi < tepiMain - 1) batas = tepi
    }
    const tinggiStatusBar = document.querySelector('footer')?.getBoundingClientRect().height ?? 28
    // Sisakan sedikit ruang agar konten tidak menempel tepi bawah gambar.
    return Math.min(900, Math.ceil(batas + tinggiStatusBar + 24))
  })
  await page.setViewportSize({ width: 1440, height: tinggi })

  await page.screenshot({ path: join(OUT_DIR, 'export.png') })
  await context.close()
  log('export.png')
}

async function tangkapPdf() {
  const respon = await fetch(`${API}/api/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthKey: BULAN }),
  })
  const hasil = await respon.json()
  if (!respon.ok) throw new Error(`Ekspor PDF gagal: ${JSON.stringify(hasil)}`)

  // Konversi halaman pertama PDF menjadi PNG supaya bisa ditampilkan di README.
  const sementara = join(OUT_DIR, 'pdf-page')
  execFileSync('pdftoppm', ['-png', '-r', '150', '-f', '1', '-l', '1', hasil.path, sementara])

  // pdftoppm menambah nomor halaman pada nama file, jadi hasilnya `pdf-page-1.png`.
  const jadi = readdirSync(OUT_DIR).find((nama) => /^pdf-page-\d+\.png$/.test(nama))
  if (!jadi) throw new Error('pdftoppm tidak menghasilkan berkas PNG')
  renameSync(join(OUT_DIR, jadi), join(OUT_DIR, 'pdf-page-1.png'))
  log('pdf-page-1.png')
}

/* ------------------------------------------------------------------ main */

let server = null
try {
  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(OUT_DIR, { recursive: true })

  server = await jalankanServer()
  await isiData()

  const browser = await chromium.launch()
  await tangkapLogbook(browser)
  await tangkapExport(browser)
  await browser.close()

  await tangkapPdf()
  log(`selesai, hasil di ${OUT_DIR}`)
} finally {
  hentikanServer(server)
  rmSync(join(root, DATA_DIR), { recursive: true, force: true })
}
