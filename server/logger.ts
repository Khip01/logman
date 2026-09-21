import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  createLogRecord,
  formatLogLine,
  type Logger,
  type LogLevel,
  type LogOptions,
} from '../src/lib/log/types'

/**
 * Logger sisi server. Menulis JSON Lines ke `data/logs/app-YYYY-MM-DD.log`.
 *
 * File per hari dipilih agar file tidak tumbuh tanpa batas dan mudah dibaca agen.
 * Log ditulis dengan append, jadi tidak perlu penulisan atomik.
 */
export function createServerLogger(logsDir: string): Logger {
  if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true })

  function fileFor(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return join(logsDir, `app-${y}-${m}-${d}.log`)
  }

  function write(level: LogLevel, scope: string, message: string, opts?: LogOptions): void {
    const record = createLogRecord(level, scope, message, opts)
    try {
      appendFileSync(fileFor(new Date()), formatLogLine(record), 'utf8')
    } catch {
      // Kegagalan log tidak boleh menjatuhkan server.
    }
    const suffix = record.durationMs !== undefined ? ` (${record.durationMs}ms)` : ''
    const line = `[logman] [${level}] ${scope}: ${message}${suffix}`
    if (level === 'error') console.error(line)
    else if (level === 'warn') console.warn(line)
    else console.log(line)
  }

  return {
    debug: (scope, message, opts) => write('debug', scope, message, opts),
    info: (scope, message, opts) => write('info', scope, message, opts),
    warn: (scope, message, opts) => write('warn', scope, message, opts),
    error: (scope, message, opts) => write('error', scope, message, opts),
    newTrace: () => createLogRecord('info', 'noop', 'noop').traceId,
  }
}

/** Membaca log terbaru untuk keperluan diagnosis. */
export function readRecentLogs(logsDir: string, limit = 200): string[] {
  if (!existsSync(logsDir)) return []
  const files = readdirSync(logsDir)
    .filter((name) => name.startsWith('app-') && name.endsWith('.log'))
    .map((name) => ({ name, mtime: statSync(join(logsDir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 3)

  const lines: string[] = []
  for (const file of files.reverse()) {
    const content = readFileSync(join(logsDir, file.name), 'utf8')
    lines.push(...content.split('\n').filter(Boolean))
  }
  return lines.slice(-limit)
}
