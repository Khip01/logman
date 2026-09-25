#!/usr/bin/env node
/**
 * Mengambil catatan rilis dari `CHANGELOG.md` untuk tag yang sedang dirilis.
 *
 * Mengapa bukan `generate_release_notes`: catatan otomatis GitHub disusun dari daftar
 * pull request dan kontributor. Repo ini menerima commit langsung ke `main` tanpa PR,
 * sehingga hasilnya kosong dan hanya menyisakan tautan "Full Changelog". Dengan membaca
 * seksi CHANGELOG, catatan rilis selalu sama dengan riwayat yang sudah ditulis manusia.
 *
 * Tag dibaca dari `GITHUB_REF_NAME` (diisi GitHub Actions) atau argumen pertama, supaya
 * skrip bisa diuji di lokal:
 *
 *   node scripts/release-notes.mjs v0.1.0
 *
 * Skrip GAGAL KERAS bila seksi untuk tag tidak ditemukan atau kosong. Lebih baik rilis
 * batal daripada terbit dengan catatan kosong.
 */
import { readFileSync } from 'node:fs'

const tag = process.env.GITHUB_REF_NAME ?? process.argv[2]

if (!tag) {
  console.error('[release-notes] Tag tidak diberikan (GITHUB_REF_NAME atau argumen).')
  process.exit(1)
}

const baris = readFileSync('CHANGELOG.md', 'utf8').split('\n')

// Cocokkan heading `## v0.1.0 - 2026-09-25` dengan tag. Tag boleh tanpa awalan `v`,
// dan pencocokan memakai `includes` agar judul seksi yang punya keterangan tetap cocok.
const versi = tag.replace(/^v/, '')
const mulai = baris.findIndex((baris) => baris.startsWith('## ') && baris.includes(versi))

if (mulai === -1) {
  console.error(`[release-notes] Seksi CHANGELOG untuk ${tag} tidak ditemukan.`)
  process.exit(1)
}

// Seksi berakhir di heading berikutnya atau di daftar tautan pembanding di kaki file.
let akhir = baris.length
for (let i = mulai + 1; i < baris.length; i += 1) {
  if (baris[i].startsWith('## ') || baris[i].startsWith('[')) {
    akhir = i
    break
  }
}

const isi = baris.slice(mulai, akhir).join('\n').trimEnd()

if (isi.length === 0) {
  console.error(`[release-notes] Seksi CHANGELOG untuk ${tag} kosong.`)
  process.exit(1)
}

process.stdout.write(`${isi}\n`)
