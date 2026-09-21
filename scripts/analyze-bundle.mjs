#!/usr/bin/env node
/**
 * Memeriksa ukuran bundle hasil build terhadap anggaran performa (AGENTS.md bagian 13).
 * JS awal gzip harus di bawah 200 KB, peringatan pada 170 KB.
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
  files = readdirSync(ASSETS_DIR)
} catch {
  console.error(`[bundle] Direktori ${ASSETS_DIR} tidak ditemukan. Jalankan build dulu.`)
  process.exit(1)
}

const jsFiles = files.filter((f) => f.endsWith('.js'))
if (jsFiles.length === 0) {
  console.error('[bundle] Tidak ada file JS di dist/assets.')
  process.exit(1)
}

let totalRaw = 0
let totalGzip = 0
const rows = []

for (const file of jsFiles) {
  const path = join(ASSETS_DIR, file)
  const raw = statSync(path).size
  const gzip = gzipSync(readFileSync(path)).length
  totalRaw += raw
  totalGzip += gzip
  rows.push({ file, raw, gzip })
}

rows.sort((a, b) => b.gzip - a.gzip)

console.log('[bundle] Ukuran JS hasil build (gzip):')
for (const row of rows) {
  console.log(`  ${row.file}  ${formatKb(row.gzip)} gzip  (${formatKb(row.raw)} raw)`)
}
console.log(`[bundle] Total: ${formatKb(totalGzip)} gzip (${formatKb(totalRaw)} raw)`)

if (totalGzip > BUDGET_BYTES) {
  console.error(
    `[bundle] GAGAL: ${formatKb(totalGzip)} melebihi anggaran ${formatKb(BUDGET_BYTES)}.`,
  )
  process.exit(1)
}

if (totalGzip > WARN_BYTES) {
  console.warn(
    `[bundle] PERINGATAN: ${formatKb(totalGzip)} mendekati anggaran ${formatKb(BUDGET_BYTES)}.`,
  )
} else {
  console.log('[bundle] OK: di bawah anggaran.')
}
