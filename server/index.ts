import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { buildMonthGroups } from '../src/lib/domain/calendar'
import { monthIncompleteDates } from '../src/lib/domain/editor'
import {
  applyDayPatch,
  applyNamaMingguPatch,
  parseConfig,
  parseLogData,
} from '../src/lib/domain/schema'
import type { AppConfig, DayEntry, LogData } from '../src/lib/domain/types'
import { createServerLogger, readRecentLogs } from './logger'
import { buildExportFileName, exportMonthToPdf } from './pdf'
import { pickFolder, resolveStartDir } from './pickFolder'
import {
  backupBeforeWrite,
  createPaths,
  ensureDirs,
  listBackups,
  readJson,
  restoreBackup,
  writeAtomic,
} from './store'

/**
 * Server mini logman (AGENTS.md bagian 4 dan 5).
 * Tanggung jawab: IO file (config, logs), backup rotasi, logging.
 *
 * Prinsip:
 * - Penulisan atomik plus backup rotasi sebelum menimpa.
 * - Endpoint patch hanya menulis hari yang dikirim, bukan seluruh file.
 * - Semua operasi mencatat traceId agar bisa dilacak dari UI sampai disk.
 */

const API_PORT = Number(process.env.LOGMAN_API_PORT ?? 5198)
const HOST = process.env.LOGMAN_HOST ?? '127.0.0.1'

const here = dirname(fileURLToPath(import.meta.url))
const dataRoot = process.env.LOGMAN_DATA_DIR ?? join(here, '..', 'data')

const paths = createPaths(dataRoot)
ensureDirs(paths)
const log = createServerLogger(paths.logsDir)

/**
 * Versi aplikasi untuk endpoint health (AGENTS.md bagian 12).
 *
 * Dibaca dari `package.json` agar TIDAK PERNAH basi. Sebelumnya nilai ini ditulis sebagai
 * string keras, sehingga naik versi di `package.json` bisa lupa diterapkan di sini.
 * Bila file tidak terbaca atau tidak punya `version`, dipakai '0.0.0' agar server tetap
 * jalan dan masalahnya tercatat di log.
 */
function readAppVersion(): string {
  try {
    const pkgPath = join(here, '..', 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string }
    return pkg.version ?? '0.0.0'
  } catch (error) {
    log.warn('server.version', 'Gagal membaca versi dari package.json.', {
      data: { pesan: error instanceof Error ? error.message : String(error) },
    })
    return '0.0.0'
  }
}

const APP_VERSION = readAppVersion()

function loadConfig(): AppConfig {
  const raw = readJson(paths.configFile)
  const { value, issues } = parseConfig(raw)
  if (issues.length > 0) {
    log.warn('config.parse', 'Konfigurasi memiliki masalah, memakai nilai yang dipulihkan.', {
      data: { issues },
    })
  }
  return value
}

function loadLogs(): LogData {
  const raw = readJson(paths.logsFile)
  const { value, issues } = parseLogData(raw)
  if (issues.length > 0) {
    log.warn('logs.parse', 'Data log memiliki masalah, entri rusak dibuang.', {
      data: { issues, jumlah: issues.length },
    })
  }
  return value
}

function persistConfig(config: AppConfig, traceId: string): void {
  backupBeforeWrite(paths, 'config.json')
  writeAtomic(paths.configFile, JSON.stringify(config, null, 2))
  log.info('config.save', 'Konfigurasi disimpan.', { traceId, data: { file: 'config.json' } })
}

function persistLogs(data: LogData, traceId: string, changed: string[]): void {
  backupBeforeWrite(paths, 'logs.json')
  writeAtomic(paths.logsFile, JSON.stringify(data, null, 2))
  log.info('logs.save', 'Data log disimpan.', {
    traceId,
    data: { jumlahBerubah: changed.length, contoh: changed.slice(0, 5) },
  })
}

const app = new Hono()

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    name: 'logman',
    version: APP_VERSION,
    time: new Date().toISOString(),
    dataDir: dataRoot,
  }),
)

app.get('/api/config', (c) => c.json({ config: loadConfig() }))

/** Informasi lingkungan untuk UI, misal folder ekspor default (AGENTS.md bagian 12). */
app.get('/api/env', (c) => c.json({ exportsDir: paths.exportsDir }))

app.put('/api/config', async (c) => {
  const traceId = log.newTrace()
  const body = (await c.req.json().catch(() => null)) as { config?: unknown } | null
  const { value, issues } = parseConfig(body?.config)
  if (issues.length > 0) {
    log.warn('config.put', 'Konfigurasi dinormalkan sebelum disimpan.', {
      traceId,
      data: { issues },
    })
  }
  persistConfig(value, traceId)
  return c.json({ ok: true, savedAt: new Date().toISOString(), changed: [], issues })
})

app.get('/api/logs', (c) => c.json({ data: loadLogs() }))

app.patch('/api/logs', async (c) => {
  const traceId = log.newTrace()
  const body = (await c.req.json().catch(() => null)) as {
    patch?: Record<string, Partial<DayEntry> | null>
  } | null

  if (!body?.patch || typeof body.patch !== 'object') {
    return c.json({ error: 'Body harus berisi objek patch.' }, 400)
  }

  const current = loadLogs()
  const { data, changed } = applyDayPatch(current, body.patch)
  persistLogs(data, traceId, changed)

  return c.json({ ok: true, savedAt: data.updatedAt, changed })
})

/**
 * Menyimpan override nama penanda tangan satu minggu (AGENTS.md bagian 11.5).
 * Body: { weekId: string, patch: { mahasiswa?, dosen?, pembimbing? } }. Field bernilai
 * null atau string kosong dihapus, sehingga minggu itu kembali memakai default config.
 */
app.patch('/api/logs/nama-minggu', async (c) => {
  const traceId = log.newTrace()
  const body = (await c.req.json().catch(() => null)) as {
    weekId?: string
    patch?: Record<string, string | null>
  } | null

  if (!body?.weekId || typeof body.weekId !== 'string') {
    return c.json({ error: 'Field weekId wajib diisi.' }, 400)
  }
  if (!body.patch || typeof body.patch !== 'object') {
    return c.json({ error: 'Body harus berisi objek patch.' }, 400)
  }

  const current = loadLogs()
  const { data, changed } = applyNamaMingguPatch(current, body.weekId, body.patch)
  persistLogs(data, traceId, changed)

  return c.json({ ok: true, savedAt: data.updatedAt, changed })
})

app.put('/api/logs', async (c) => {
  const traceId = log.newTrace()
  const body = (await c.req.json().catch(() => null)) as { data?: unknown } | null
  const { value, issues } = parseLogData(body?.data)
  persistLogs(value, traceId, Object.keys(value.days))
  return c.json({
    ok: true,
    savedAt: value.updatedAt,
    changed: Object.keys(value.days),
    issues,
  })
})

app.get('/api/backups', (c) => c.json({ backups: listBackups(paths) }))

/**
 * Membuka dialog folder native untuk field "Folder ekspor" (AGENTS.md bagian 12).
 * Direktori awal mengikuti isi field: path yang valid bila ada, selain itu folder
 * ekspor default. Jadi dialog tidak pernah membuka home atau root tanpa alasan.
 */
app.post('/api/pick-folder', async (c) => {
  const traceId = log.newTrace()
  const body = (await c.req.json().catch(() => null)) as { current?: unknown } | null
  const startDir = resolveStartDir(body?.current, paths.exportsDir)
  const result = await pickFolder(startDir)
  log.info('folder.pick', 'Dialog folder selesai.', {
    traceId,
    data: { startDir, hasil: result.path ?? (result.unsupported ? 'unsupported' : 'cancelled') },
  })
  if (result.unsupported) return c.json({ unsupported: true }, 200)
  if (result.cancelled) return c.json({ cancelled: true })
  return c.json({ path: result.path })
})

app.post('/api/backups/restore', async (c) => {
  const traceId = log.newTrace()
  const body = (await c.req.json().catch(() => null)) as { file?: string } | null
  if (!body?.file) return c.json({ error: 'Field file wajib diisi.' }, 400)
  try {
    const restored = restoreBackup(paths, body.file)
    log.info('backups.restore', 'Backup dipulihkan.', { traceId, data: { file: body.file } })
    return c.json({ ok: true, restored })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memulihkan backup.'
    log.error('backups.restore', message, { traceId })
    return c.json({ error: message }, 404)
  }
})

/**
 * Menerima log dari browser. Badan dikirim sebagai string JSON yang sudah
 * diserialkan klien, jadi server hanya menyambung barisnya.
 */
app.post('/api/logs/client', async (c) => {
  const body = (await c.req.json().catch(() => null)) as { records?: unknown[] } | null
  if (!Array.isArray(body?.records)) return c.json({ ok: false }, 400)
  for (const record of body.records.slice(0, 200)) {
    try {
      const parsed = typeof record === 'string' ? JSON.parse(record) : record
      log.info('client', 'Log dari browser.', { data: { record: parsed } })
    } catch {
      // Abaikan record rusak.
    }
  }
  return c.json({ ok: true, diterima: body.records.length })
})

/** Diagnosis: membaca log terbaru. Membantu agen tanpa akses terminal server. */
app.get('/api/logs/recent', (c) => {
  const limit = Number(c.req.query('limit') ?? 200)
  return c.json({ lines: readRecentLogs(paths.logsDir, Number.isFinite(limit) ? limit : 200) })
})

app.post('/api/export', async (c) => {
  const traceId = log.newTrace()
  const body = (await c.req.json().catch(() => null)) as { monthKey?: string } | null
  if (!body?.monthKey) return c.json({ error: 'Field monthKey wajib diisi.' }, 400)

  const config = loadConfig()
  const logs = loadLogs()
  const months = buildMonthGroups(
    config.magang.mulai ?? '',
    config.magang.selesai ?? '',
    'id',
    config.hariKerja,
  )
  const month = months.find((m) => m.key === body.monthKey)

  if (!month) {
    return c.json({ error: `Bulan ${body.monthKey} tidak ditemukan dalam rentang magang.` }, 404)
  }

  // Validasi ekspor (AGENTS.md bagian 11.3): setiap hari yang kosong wajib punya
  // alasan sebelum ekspor. Server menolak dengan daftar tanggalnya.
  const range = { mulai: config.magang.mulai, selesai: config.magang.selesai }
  const incomplete = monthIncompleteDates(month, logs.days, range)
  if (incomplete.length > 0) {
    log.warn('export.pdf', 'Ekspor ditolak karena hari belum lengkap.', {
      traceId,
      data: { monthKey: body.monthKey, jumlah: incomplete.length, contoh: incomplete.slice(0, 5) },
    })
    return c.json(
      {
        error: `${incomplete.length} hari belum punya kegiatan atau alasan. Lengkapi dulu sebelum ekspor.`,
        incomplete,
      },
      422,
    )
  }

  const exportDir = config.folderExport || paths.exportsDir
  mkdirSync(exportDir, { recursive: true })
  const fileName = buildExportFileName(config.profil.nim, body.monthKey)
  const outputPath = join(exportDir, fileName)

  try {
    await exportMonthToPdf({
      config,
      logs,
      monthKey: body.monthKey,
      outputPath,
    })
    log.info('export.pdf', 'PDF bulan diekspor.', {
      traceId,
      data: { monthKey: body.monthKey, file: fileName },
    })
    return c.json({ ok: true, fileName, path: outputPath })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengekspor PDF.'
    log.error('export.pdf', message, { traceId })
    return c.json({ error: message }, 500)
  }
})

/**
 * Menyajikan file PDF hasil ekspor untuk diunduh browser. Hanya nama file polos
 * yang diterima, sehingga path traversal tidak mungkin terjadi.
 */
app.get('/api/export/download', async (c) => {
  const file = c.req.query('file')
  if (!file || file.includes('/') || file.includes('\\') || file.includes('..')) {
    return c.json({ error: 'Nama file tidak valid.' }, 400)
  }
  if (!file.endsWith('.pdf')) {
    return c.json({ error: 'Hanya file PDF yang boleh diunduh.' }, 400)
  }

  const config = loadConfig()
  const exportDir = config.folderExport || paths.exportsDir
  const filePath = join(exportDir, file)
  if (!existsSync(filePath)) {
    return c.json({ error: 'File tidak ditemukan. Ekspor ulang bulan tersebut.' }, 404)
  }

  const { readFileSync: read } = await import('node:fs')
  return c.body(read(filePath), 200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${file}"`,
  })
})

// Sajikan hasil build produksi bila ada, supaya satu perintah bisa melayani semuanya.
const distDir = join(here, '..', 'dist')
if (existsSync(distDir)) {
  app.get('*', async (c) => {
    const { readFileSync } = await import('node:fs')
    const { extname } = await import('node:path')
    const urlPath = c.req.path === '/' ? '/index.html' : c.req.path
    const candidate = join(distDir, urlPath)
    const filePath =
      existsSync(candidate) && extname(candidate) ? candidate : join(distDir, 'index.html')
    if (!existsSync(filePath)) return c.notFound()
    const type =
      extname(filePath) === '.html'
        ? 'text/html'
        : extname(filePath) === '.js'
          ? 'text/javascript'
          : extname(filePath) === '.css'
            ? 'text/css'
            : 'application/octet-stream'
    return c.body(readFileSync(filePath), 200, { 'Content-Type': type })
  })
}

log.info('server.start', 'Server logman siap.', { data: { port: API_PORT, dataDir: dataRoot } })

serve({ fetch: app.fetch, port: API_PORT, hostname: HOST }, (info) => {
  console.log(`[logman] API server aktif di http://${HOST}:${info.port}`)
})
