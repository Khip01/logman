import { spawn } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'

/**
 * Pemilih folder native untuk field "Folder ekspor" (AGENTS.md bagian 12).
 *
 * Browser tidak memberi path absolut yang bisa dipakai server, sehingga dialog folder
 * dibuka oleh SERVER lewat dialog native desktop. `kdialog` adalah backend utama di
 * lingkungan openSUSE; `zenity` dan `yad` disediakan sebagai cadangan. Bila tidak ada
 * yang tersedia, server menjawab `unsupported` supaya UI bisa menampilkan arahan manual.
 *
 * Semua fungsi pemetaan MURNI dan diuji; hanya `pickFolder` yang menyentuh proses.
 */

export interface PickFolderResult {
  path?: string
  cancelled?: boolean
  unsupported?: boolean
  error?: string
}

interface Backend {
  bin: string
  args: (dir: string) => string[]
}

const BACKENDS: Backend[] = [
  { bin: 'kdialog', args: (dir) => ['--getexistingdirectory', dir] },
  { bin: 'zenity', args: (dir) => ['--file-selection', '--directory', `--filename=${dir}/`] },
  { bin: 'yad', args: (dir) => ['--file', '--directory', `--filename=${dir}/`] },
]

/**
 * Menentukan direktori awal dialog. Bila `current` menunjuk direktori yang ada, pakai
 * itu, supaya dialog terbuka di lokasi yang sedang diatur user. Selain itu pakai
 * `fallback` (folder ekspor default), bukan home atau root.
 */
export function resolveStartDir(current: unknown, fallback: string): string {
  if (typeof current === 'string' && current.trim() !== '') {
    const trimmed = current.trim()
    try {
      if (existsSync(trimmed) && statSync(trimmed).isDirectory()) return trimmed
    } catch {
      // Path tidak terbaca, jatuh ke fallback.
    }
  }
  return fallback
}

/** Memetakan keluaran dialog ke hasil. Keluar bukan nol atau kosong berarti dibatalkan. */
export function parseDialogOutput(stdout: string, code: number | null): PickFolderResult {
  const trimmed = stdout.trim()
  if (code === 0 && trimmed !== '') return { path: trimmed }
  return { cancelled: true }
}

interface CommandResult {
  code: number | null
  stdout: string
  missing: boolean
}

function runCommand(bin: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve) => {
    let child: ReturnType<typeof spawn>
    try {
      child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'ignore'] })
    } catch {
      resolve({ code: null, stdout: '', missing: true })
      return
    }
    let stdout = ''
    let settled = false
    const finish = (result: CommandResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.on('error', () => finish({ code: null, stdout, missing: true }))
    child.on('close', (code) => finish({ code, stdout, missing: false }))
  })
}

/** Membuka dialog folder native. Mencoba backend berurutan sampai ada yang tersedia. */
export async function pickFolder(startDir: string): Promise<PickFolderResult> {
  for (const backend of BACKENDS) {
    const result = await runCommand(backend.bin, backend.args(startDir))
    if (result.missing) continue
    return parseDialogOutput(result.stdout, result.code)
  }
  return { unsupported: true }
}
