import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { applyDayPatch, parseConfig, parseLogData } from '../src/lib/domain/schema'
import type { AppConfig, DayEntry, LogData } from '../src/lib/domain/types'
import { createServerLogger, readRecentLogs } from './logger'
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
    version: '0.1.0',
    time: new Date().toISOString(),
    dataDir: dataRoot,
  }),
)

app.get('/api/config', (c) => c.json({ config: loadConfig() }))

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
