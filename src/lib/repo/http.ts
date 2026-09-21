import { CONFIG_VERSION } from '@/lib/domain/schema'
import type { AppConfig, LogData } from '@/lib/domain/types'
import type {
  BackupInfo,
  BackupRepository,
  ConfigRepository,
  LogRepository,
  SaveResult,
} from './types'
import { RepositoryError } from './types'

/**
 * Implementasi HTTP untuk runtime (AGENTS.md bagian 5.4).
 * Menangani jaringan dan error dengan pesan yang bisa dibaca agen.
 */

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(input, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch (error) {
    throw new RepositoryError(
      `Tidak bisa menghubungi server: ${error instanceof Error ? error.message : 'penyebab tidak diketahui'}`,
      0,
    )
  }

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) detail = body.error
    } catch {
      // Biarkan detail default bila badan bukan JSON.
    }
    throw new RepositoryError(detail, response.status)
  }

  return (await response.json()) as T
}

export class HttpConfigRepository implements ConfigRepository {
  constructor(private readonly baseUrl = '') {}

  async load(): Promise<AppConfig> {
    const body = await requestJson<{ config: AppConfig; version: number }>(
      `${this.baseUrl}/api/config`,
    )
    return body.config
  }

  save(config: AppConfig): Promise<SaveResult> {
    return requestJson<SaveResult>(`${this.baseUrl}/api/config`, {
      method: 'PUT',
      body: JSON.stringify({ config, version: CONFIG_VERSION }),
    })
  }
}

export class HttpLogRepository implements LogRepository {
  constructor(private readonly baseUrl = '') {}

  async load(): Promise<LogData> {
    const body = await requestJson<{ data: LogData }>(`${this.baseUrl}/api/logs`)
    return body.data
  }

  patchDays(patch: Record<string, unknown>): Promise<SaveResult> {
    return requestJson<SaveResult>(`${this.baseUrl}/api/logs`, {
      method: 'PATCH',
      body: JSON.stringify({ patch }),
    })
  }

  replaceAll(data: LogData): Promise<SaveResult> {
    return requestJson<SaveResult>(`${this.baseUrl}/api/logs`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    })
  }
}

export class HttpBackupRepository implements BackupRepository {
  constructor(private readonly baseUrl = '') {}

  async list(): Promise<BackupInfo[]> {
    const body = await requestJson<{ backups: BackupInfo[] }>(`${this.baseUrl}/api/backups`)
    return body.backups
  }

  restore(file: string): Promise<{ ok: boolean; restored: string }> {
    return requestJson<{ ok: boolean; restored: string }>(`${this.baseUrl}/api/backups/restore`, {
      method: 'POST',
      body: JSON.stringify({ file }),
    })
  }
}
