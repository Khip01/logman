import {
  createLogRecord,
  createTraceId,
  formatLogText,
  type Logger,
  type LogLevel,
  type LogOptions,
} from './types'

/**
 * Logger untuk browser. Menulis ke console dan mengirim salinan ke server secara
 * batch agar bisa dianalisis agen dari `data/logs/`.
 *
 * Kegagalan pengiriman TIDAK BOLEH mengganggu aplikasi: semua error ditelan.
 */
export function createClientLogger(options?: { endpoint?: string; flushMs?: number }): Logger {
  const endpoint = options?.endpoint ?? '/api/logs/client'
  const flushMs = options?.flushMs ?? 2000
  let queue: string[] = []
  let timer: ReturnType<typeof setTimeout> | null = null

  function flush(): void {
    if (queue.length === 0) return
    const records = queue
    queue = []
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    // Fire and forget. Kegagalan diabaikan dengan sengaja.
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
      keepalive: true,
    }).catch(() => undefined)
  }

  function schedule(): void {
    if (timer) return
    timer = setTimeout(flush, flushMs)
  }

  function log(level: LogLevel, scope: string, message: string, opts?: LogOptions): void {
    const record = createLogRecord(level, scope, message, opts)
    const text = formatLogText(record)
    if (level === 'error') console.error(text)
    else if (level === 'warn') console.warn(text)
    else console.log(text)

    queue.push(JSON.stringify(record))
    schedule()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flush)
  }

  return {
    debug: (scope, message, opts) => log('debug', scope, message, opts),
    info: (scope, message, opts) => log('info', scope, message, opts),
    warn: (scope, message, opts) => log('warn', scope, message, opts),
    error: (scope, message, opts) => log('error', scope, message, opts),
    newTrace: () => createTraceId(),
  }
}
