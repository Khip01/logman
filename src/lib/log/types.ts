/**
 * Logger terstruktur (AGENTS.md bagian 15). Tujuan: satu aksi bisa dilacak dari UI
 * sampai penulisan disk lewat `traceId` yang sama.
 *
 * Bagian murni (pembentukan record dan format) ada di sini agar bisa diuji tanpa I/O.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogRecord {
  /** Waktu ISO. */
  time: string
  level: LogLevel
  /** Id pelacakan, sama dari UI sampai disk. */
  traceId: string
  /** Nama aksi atau modul, misal "logs.patch". */
  scope: string
  message: string
  /** Data tambahan yang aman diserialkan. */
  data?: Record<string, unknown>
  /** Durasi operasi dalam milidetik, bila relevan. */
  durationMs?: number
}

let counter = 0

/**
 * Membuat id pelacakan. Memakai waktu dan penghitung agar unik dalam satu proses,
 * tanpa bergantung pada crypto (tersedia di browser dan Node).
 */
export function createTraceId(now = Date.now()): string {
  counter = (counter + 1) % 1_000_000
  const waktu = now.toString(36)
  const acak = Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .padStart(4, '0')
  return `${waktu}-${counter.toString(36).padStart(4, '0')}-${acak}`
}

export function createLogRecord(
  level: LogLevel,
  scope: string,
  message: string,
  options?: { traceId?: string; data?: Record<string, unknown>; durationMs?: number },
): LogRecord {
  return {
    time: new Date().toISOString(),
    level,
    traceId: options?.traceId ?? createTraceId(),
    scope,
    message,
    ...(options?.data ? { data: options.data } : {}),
    ...(options?.durationMs !== undefined ? { durationMs: options.durationMs } : {}),
  }
}

/** Satu baris JSON tanpa newline di dalamnya, untuk format JSON Lines. */
export function formatLogLine(record: LogRecord): string {
  return `${JSON.stringify(record)}\n`
}

/** Format ringkas untuk dibaca manusia di console. */
export function formatLogText(record: LogRecord): string {
  const durasi = record.durationMs !== undefined ? ` (${record.durationMs}ms)` : ''
  const data = record.data ? ` ${JSON.stringify(record.data)}` : ''
  return `[${record.level}] ${record.scope}: ${record.message}${durasi}${data} [${record.traceId}]`
}

export interface Logger {
  debug(scope: string, message: string, options?: LogOptions): void
  info(scope: string, message: string, options?: LogOptions): void
  warn(scope: string, message: string, options?: LogOptions): void
  error(scope: string, message: string, options?: LogOptions): void
  /** Membuat traceId baru, dipakai pemanggil untuk mengaitkan beberapa record. */
  newTrace(): string
}

export interface LogOptions {
  traceId?: string
  data?: Record<string, unknown>
  durationMs?: number
}

/** Logger yang membuang semua record. Dipakai di test agar output bersih. */
export const silentLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  newTrace: () => createTraceId(),
}
