import { createClientLogger } from './client'
import type { Logger } from './types'

/**
 * Logger aplikasi. Satu instance untuk seluruh UI, agar traceId konsisten dan
 * pengiriman ke server ter-batch.
 */
export const log: Logger = createClientLogger()

export type { Logger, LogLevel, LogRecord } from './types'
export { createTraceId, formatLogLine, formatLogText } from './types'
