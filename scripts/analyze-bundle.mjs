#!/usr/bin/env node
/**
 * Memeriksa ukuran bundle terhadap anggaran performa (AGENTS.md bagian 13).
 *
 * Yang diukur sebagai "JS awal" adalah chunk yang dimuat saat halaman pertama
 * dibuka: entry chunk plus chunk yang di-import statis oleh entry. Chunk hasil
 * code splitting per route (lazy) TIDAK dihitung, karena baru dimuat saat route
 * tersebut dibuka. Keduanya tetap dilaporkan untuk transparansi.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET_BYTES = 200 * 1024
const WARN_BYTES = 170 * 1024
const ASSETS_DIR = 'dist/assets'

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`
}

let files
try {
  files = readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.js'))
} catch {
  console.error(`[bundle] Direktori ${ASSETS_DIR} tidak ditemukan. Jalankan build dulu.`)
  process.exit(1)
}

if (files.length === 0) {
  console.error('[bundle] Tidak ada file JS di dist/assets.')
  process.exit(1)
}

const measured = files.map((file) => {
  const path = join(ASSETS_DIR, file)
  const raw = statSync(path).size
  const source = readFileSync(path, 'utf8')
  return { file, raw, gzip: gzipSync(source).length, source }
})

// Entry chunk: file index-*.js. Chunk yang di-import statis oleh entry (misalnya
// vendor chunk) juga dihitung sebagai beban awal.
const entry = measured.find((m) => m.file.startsWith('index-'))
if (!entry) {
  console.error('[bundle] Entry chunk (index-*.js) tidak ditemukan.')
  process.exit(1)
}

/** Mengumpulkan nama file chunk yang direferensikan statis oleh sebuah chunk. */
function staticImports(chunk, seen = new Set()) {
  const deps = []
  const pattern = /from"\.\/([A-Za-z0-9_.-]+\.js)"/g
  let match = pattern.exec(chunk.source)
  while (match) {
    const name = match[1]
    if (!seen.has(name)) {
      seen.add(name)
      const dep = measured.find((m) => m.file === name)
      if (dep) {
        deps.push(dep)
        deps.push(...staticImports(dep, seen))
      }
    }
    match = pattern.exec(chunk.source)
  }
  return deps
}

const initialChunks = [entry, ...staticImports(entry)]
const initialGzip = initialChunks.reduce((sum, c) => sum + c.gzip, 0)
const initialRaw = initialChunks.reduce((sum, c) => sum + c.raw, 0)

const lazyChunks = measured.filter((m) => !initialChunks.some((c) => c.file === m.file))

console.log('[bundle] Chunk awal (dimuat saat first load):')
for (const chunk of initialChunks.sort((a, b) => b.gzip - a.gzip)) {
  console.log(`  ${chunk.file}  ${formatKb(chunk.gzip)} gzip  (${formatKb(chunk.raw)} raw)`)
}
console.log(`[bundle] Total JS awal: ${formatKb(initialGzip)} gzip (${formatKb(initialRaw)} raw)`)

if (lazyChunks.length > 0) {
  const lazyGzip = lazyChunks.reduce((sum, c) => sum + c.gzip, 0)
  console.log(
    `[bundle] Chunk lazy (route terpisah, tidak dihitung): ${lazyChunks.length} file, ${formatKb(lazyGzip)} gzip`,
  )
}

if (initialGzip > BUDGET_BYTES) {
  console.error(
    `[bundle] GAGAL: JS awal ${formatKb(initialGzip)} melebihi anggaran ${formatKb(BUDGET_BYTES)}.`,
  )
  process.exit(1)
}

if (initialGzip > WARN_BYTES) {
  console.warn(
    `[bundle] PERINGATAN: JS awal ${formatKb(initialGzip)} mendekati anggaran ${formatKb(BUDGET_BYTES)}.`,
  )
} else {
  console.log('[bundle] OK: JS awal di bawah anggaran.')
}
