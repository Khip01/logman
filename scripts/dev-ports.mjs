/**
 * Pemilihan port untuk dev server (AGENTS.md bagian 4.1).
 *
 * MASALAH YANG DISELESAIKAN
 * Web dan API adalah dua proses terpisah yang dimulai bersama oleh `concurrently`.
 * Kalau keduanya mengambil port sendiri secara independen, keduanya bisa memilih port
 * yang sama, atau Vite bisa pindah port diam-diam sementara proxy-nya masih menembak
 * port API yang lama. `strictPort: true` di vite.config.ts dulu dipakai untuk
 * membekukan port, tapi akibatnya `pnpm dev` langsung gagal begitu portdefault dipakai
 * proses lain, termasuk proses milik agen sendiri.
 *
 * SOLUSINYA
 * Port dipilih SATU KALI di sini, lalu ditulis ke berkas `.dev-ports.json`. Vite dan
 * server API membaca berkas yang sama, jadi keduanya pasti sepakat dan tidak ada
 * balapan. Env var tetap menang bila memang disetel eksplisit.
 *
 * MODE
 * - `auto` (bawaan untuk pemakaian interaktif): bila port default sedang dipakai,
 *   naikkan ke port kosong berikutnya lalu beri tahu pengguna URL barunya.
 * - `strict`: port default dipakai apa adanya dan gagal keras kalau port itu sedang
 *   dipakai. Ini yang
 *   dipakai Playwright dan CI, karena test meng-hardcode URL dan tidak boleh diam-diam
 *   menguji server yang tidak dij-fashion.
 *
 * CATATAN BALAPAN
 * Pengecekan "port kosong" lalu "bind" tidak bisa atomik, jadi ada kemungkinan kecil
 * port direbut proses lain di antara keduanya.lingua Kasenya sengaja dibiarkan gagal
 * dengan pesan jelas, bukan diam-diam pindah port, karena URL yang salah jauh lebih
 * sulitogly Dideteksi daripada error yang jujur.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Port bawaan web (Vite). */
export const DEFAULT_WEB_PORT = 5199
/** Port bawaan API (Hono). */
export const DEFAULT_API_PORT = 5198

/** Host dev server. Loopback saja, tidak pernah dibuka ke jaringan. */
export const DEV_HOST = '127.0.0.1'

/** Berkas tempat hasil pemilihan port disimpan. */
export const DEV_PORTS_FILE = '.dev-ports.json'

/** Berapa banyak port ke atas yang boleh dicoba sebelum menyerah. */
const MAX_PORT_TRIES = 50

/** Mode dari env, default `auto`. */
export function resolveMode(env = process.env) {
  return env.LOGMAN_PORT_MODE === 'strict' ? 'strict' : 'auto'
}

/** Benar bila port bisa di-bind sekarang. */
export function isPortFree(port, host = DEV_HOST) {
  return new Promise((resolveFree) => {
    const server = createServer()
    // Dipanggil dua kali: 'error' saat port dipakai, 'listening' saat bind berhasil.
    server.once('error', () => resolveFree(false))
    server.once('listening', () => server.close(() => resolveFree(true)))
    server.listen(port, host)
  })
}

/**
 * Mencari port kosong pertama mulai dari `startPort`.
 *
 * `taken` dipakai supaya dua proses tidak memilih port yang sama. API dipetakan lebih
 * dulu, lalu web mencari sambil melewati port milik API.
 */
export async function findFreePort(startPort, { host = DEV_HOST, taken = [] } = {}) {
  for (let port = startPort; port < startPort + MAX_PORT_TRIES; port++) {
    if (taken.includes(port)) continue
    if (await isPortFree(port, host)) return port
  }
  throw new Error(
    `Tidak ada port kosong antara ${startPort} dan ${startPort + MAX_PORT_TRIES - 1}.`,
  )
}

/** Membaca env sebagai angka, atau `undefined` bila tidak disetel. */
function envPort(value) {
  if (value === undefined || value === '') return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : undefined
}

/**
 * Menentukan pasangan port untuk satu sesi dev.
 *
 * Env `LOGMAN_WEB_PORT` dan `LOGMAN_API_PORT` menang di atas apa pun, supaya caller
 * bisa memaksa port tertentu tanpa mengubah berkas.
 */
export async function resolveDevPorts({ env = process.env, mode = resolveMode(env) } = {}) {
  const webWanted = envPort(env.LOGMAN_WEB_PORT) ?? DEFAULT_WEB_PORT
  const apiWanted = envPort(env.LOGMAN_API_PORT) ?? DEFAULT_API_PORT

  if (mode === 'strict') {
    // Tidak dinaikkan. Kalau Default-nya dipakai, gagal sekarang dengan pesan jelas
    // supaya test tidak diam-diam mengukur server yang salah.
    const webFree = await isPortFree(webWanted)
    const apiFree = await isPortFree(apiWanted)
    if (webFree && apiFree) {
      return { webPort: webWanted, apiPort: apiWanted, autoPort: false }
    }
    const occupied = [
      webFree ? null : `web ${webWanted}`,
      apiFree ? null : `api ${apiWanted}`,
    ].filter(Boolean)
    throw new Error(
      `Port ${occupied.join(' dan ')} sedang dipakai. Mode strict tidak menaikkan port.\n` +
        'Tutup proses yang memakainya, atau jalankan dengan LOGMAN_PORT_MODE=auto untuk port otomatis.',
    )
  }

  // API dipetakan lebih dulu supaya web tahu harus melewati port itu.
  const apiPort = await findFreePort(apiWanted, { taken: [] })
  const webPort = await findFreePort(webWanted, { taken: [apiPort] })
  return { webPort, apiPort, autoPort: true }
}

/** Lokasi penuh berkas `.dev-ports.json`. */
export function devPortsPath(cwd = process.cwd()) {
  return join(cwd, DEV_PORTS_FILE)
}

/**
 * Cache hasil baca, dikunci per path.
 *
 * `vite.config.ts` dan `server/index.ts` masing-masing memanggil fungsi ini beberapa
 * kali, jadi cache berguna agar berkas dibaca satu kali. Kuncinya path, bukan global,
 * supaya pemanggilan dengan `cwd` berbeda tidak mengembalikan nilai milik path lain.
 */
const cache = new Map()

export function readDevPorts(cwd = process.cwd()) {
  const path = devPortsPath(cwd)
  const cached = cache.get(path)
  if (cached) return cached
  const fallback = { webPort: DEFAULT_WEB_PORT, apiPort: DEFAULT_API_PORT, autoPort: false }
  let result = fallback
  try {
    if (existsSync(path)) {
      const parsed = JSON.parse(readFileSync(path, 'utf8'))
      const webPort = Number(parsed?.webPort)
      const apiPort = Number(parsed?.apiPort)
      if (Number.isInteger(webPort) && Number.isInteger(apiPort)) {
        result = { webPort, apiPort, autoPort: parsed?.autoPort === true }
      }
    }
  } catch {
    // Berkas rusak atau tidak terbaca. Bawaan lebih aman daripada gagal start, karena
    // `vite` dan server API tidak akan bisa jalan sama sekali.
    result = fallback
  }
  cache.set(path, result)
  return result
}

/** Menulis hasil pemilihan port ke berkas. */
export function writeDevPorts(ports, cwd = process.cwd()) {
  const path = devPortsPath(cwd)
  writeFileSync(path, `${JSON.stringify(ports, null, 2)}\n`, 'utf8')
  cache.set(path, ports)
}

/** Membaca env sebagai angka, atau `undefined` bila tidak disetel. */
export function describePorts(ports) {
  const naik = ports.webPort !== DEFAULT_WEB_PORT || ports.apiPort !== DEFAULT_API_PORT
  return [
    `web  http://${DEV_HOST}:${ports.webPort}`,
    `api  http://${DEV_HOST}:${ports.apiPort}`,
    naik
      ? 'port default sedang dipakai, jadi dinaikkan otomatis'
      : 'port default dipakai apa adanya',
  ].join('\n')
}

/**
 * Pemanggilan sebagai skrip: `node scripts/dev-ports.mjs`.
 *
 * Dipakai oleh script `dev` sebelum `concurrently` dijalankan. Keluarannya ringkas dan
 * ditulis ke stderr supaya tidak mengganggu stdout anak proses.
 */
async function main() {
  const mode = resolveMode()
  try {
    const ports = await resolveDevPorts({ mode })
    writeDevPorts(ports)
    process.stderr.write(`[logman] mode port: ${mode}\n[logman] ${describePorts(ports)}\n`)
  } catch (error) {
    process.stderr.write(`[logman] Gagal menyiapkan port: ${error.message}\n`)
    process.exitCode = 1
  }
}

// Hanya jalan sebagai skrip, bukan ketika diimpor oleh vite.config.ts atau server.
const dipanggilLangsung =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (dipanggilLangsung) {
  await main()
}
