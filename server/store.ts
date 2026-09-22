import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

/**
 * Penyimpanan file untuk data runtime (AGENTS.md bagian 5).
 *
 * Prinsip:
 * - Penulisan ATOMIK: tulis ke file sementara lalu rename, supaya file utama tidak
 *   pernah setengah tertulis bila proses berhenti di tengah.
 * - Backup rotasi dibuat SEBELUM menimpa, karena autosave menimpa langsung.
 * - Semua operasi filesystem terkumpul di sini, sehingga bagian lain tidak menyentuh
 *   disk secara langsung.
 */

export interface StorePaths {
  root: string
  configFile: string
  logsFile: string
  backupsDir: string
  logsDir: string
  /** Folder ekspor default bila `folderExport` di config dikosongkan (AGENTS.md bagian 12). */
  exportsDir: string
}

export function createPaths(root: string): StorePaths {
  return {
    root,
    configFile: join(root, 'config.json'),
    logsFile: join(root, 'logs.json'),
    backupsDir: join(root, 'backups'),
    logsDir: join(root, 'logs'),
    exportsDir: join(root, 'exports'),
  }
}

export function ensureDirs(paths: StorePaths): void {
  for (const dir of [paths.root, paths.backupsDir, paths.logsDir, paths.exportsDir]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
}

/** Menulis file secara atomik. */
export function writeAtomic(file: string, content: string): void {
  const temp = `${file}.tmp-${process.pid}-${Date.now()}`
  writeFileSync(temp, content, 'utf8')
  renameSync(temp, file)
}

/** Membaca JSON, mengembalikan null bila file tidak ada atau rusak. */
export function readJson(file: string): unknown {
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as unknown
  } catch {
    return null
  }
}

export interface BackupEntry {
  file: string
  createdAt: string
  sizeBytes: number
}

const MAX_BACKUPS = 20

/**
 * Membuat backup berlabel waktu sebelum menimpa file. Menyimpan maksimal
 * `MAX_BACKUPS` versi terbaru per file dasar.
 */
export function backupBeforeWrite(paths: StorePaths, baseName: string): void {
  const source = join(paths.root, baseName)
  if (!existsSync(source)) return

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const target = join(paths.backupsDir, `${baseName}.${stamp}.bak`)
  try {
    writeFileSync(target, readFileSync(source))
  } catch {
    return
  }
  pruneBackups(paths, baseName)
}

function pruneBackups(paths: StorePaths, baseName: string): void {
  const prefix = `${baseName}.`
  const entries = readdirSync(paths.backupsDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.bak'))
    .sort()
  const excess = entries.length - MAX_BACKUPS
  if (excess <= 0) return
  for (const name of entries.slice(0, excess)) {
    try {
      rmSync(join(paths.backupsDir, name))
    } catch {
      // Abaikan kegagalan pemangkasan.
    }
  }
}

export function listBackups(paths: StorePaths): BackupEntry[] {
  if (!existsSync(paths.backupsDir)) return []
  return readdirSync(paths.backupsDir)
    .filter((name) => name.endsWith('.bak'))
    .map((name) => {
      const full = join(paths.backupsDir, name)
      const info = statSync(full)
      return { file: name, createdAt: info.mtime.toISOString(), sizeBytes: info.size }
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

/** Memulihkan file utama dari sebuah backup. Backup baru dibuat sebelum memulihkan. */
export function restoreBackup(paths: StorePaths, backupFile: string): string {
  const safe = backupFile.replace(/[^A-Za-z0-9._-]/g, '')
  const source = join(paths.backupsDir, safe)
  if (!existsSync(source)) {
    throw new Error(`Backup tidak ditemukan: ${backupFile}`)
  }
  const baseName = safe.split('.')[0] === 'logs' ? 'logs.json' : 'config.json'
  backupBeforeWrite(paths, baseName)
  writeAtomic(join(paths.root, baseName), readFileSync(source, 'utf8'))
  return baseName
}
