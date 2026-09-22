import { applyDayPatch, applyNamaMingguPatch, defaultLogData } from '@/lib/domain/schema'
import type { AppConfig, DayEntry, LogData, NamaMinggu } from '@/lib/domain/types'

/**
 * Kontrak akses data (AGENTS.md bagian 5.4, prinsip DIP).
 *
 * UI HANYA berbicara lewat interface ini. Implementasi runtime memakai HTTP ke server
 * Hono, sedangkan test dan CI memakai implementasi in-memory yang tidak menyentuh
 * filesystem.
 */

export interface SaveResult {
  ok: boolean
  savedAt: string
  /** Tanggal yang benar-benar berubah, untuk log dan umpan balik. */
  changed: string[]
}

export interface ConfigRepository {
  load(): Promise<AppConfig>
  save(config: AppConfig): Promise<SaveResult>
}

export interface LogRepository {
  load(): Promise<LogData>
  /** Menyimpan patch sebagian. Hanya tanggal di dalam patch yang dikirim. */
  patchDays(patch: Record<string, Partial<DayEntry> | null>): Promise<SaveResult>
  /** Menyimpan override nama penanda tangan satu minggu. */
  patchNamaMinggu(
    weekId: string,
    patch: Partial<Record<keyof NamaMinggu, string | null>>,
  ): Promise<SaveResult>
  /** Menimpa seluruh data. Dipakai mode seed dan pemulihan dari backup. */
  replaceAll(data: LogData): Promise<SaveResult>
}

export interface BackupInfo {
  file: string
  createdAt: string
  sizeBytes: number
}

export interface BackupRepository {
  list(): Promise<BackupInfo[]>
  restore(file: string): Promise<{ ok: boolean; restored: string }>
}

/** Informasi lingkungan server yang tidak tersimpan di config. */
export interface EnvInfo {
  /** Folder ekspor default (absolut) yang dipakai bila `folderExport` dikosongkan. */
  exportsDir: string
}

export interface PickFolderResult {
  path?: string
  cancelled?: boolean
  /** Dialog native tidak tersedia di mesin ini. UI harus menawarkan jalan manual. */
  unsupported?: boolean
}

/**
 * Kemampuan lingkungan: path default server dan dialog folder native. Dipisah dari
 * repository data karena bukan bagian dari model data, tetapi tetap lewat kontrak agar
 * UI tidak memanggil fetch langsung (AGENTS.md bagian 5.4).
 */
export interface EnvRepository {
  info(): Promise<EnvInfo>
  pickFolder(current?: string): Promise<PickFolderResult>
}

export class RepositoryError extends Error {
  readonly status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'RepositoryError'
    this.status = status
  }
}

/**
 * Implementasi in-memory untuk test dan CI. Tidak menyentuh filesystem.
 * Menyimpan salinan agar pemanggil tidak bisa memutasi state lewat referensi.
 */
export class InMemoryLogRepository implements LogRepository {
  private data: LogData

  constructor(initial?: LogData) {
    this.data = initial ?? defaultLogData()
  }

  load(): Promise<LogData> {
    return Promise.resolve(structuredClone(this.data))
  }

  patchDays(patch: Record<string, Partial<DayEntry> | null>): Promise<SaveResult> {
    const { data, changed } = applyDayPatch(this.data, patch)
    this.data = data
    return Promise.resolve({ ok: true, savedAt: data.updatedAt, changed })
  }

  patchNamaMinggu(
    weekId: string,
    patch: Partial<Record<keyof NamaMinggu, string | null>>,
  ): Promise<SaveResult> {
    const { data, changed } = applyNamaMingguPatch(this.data, weekId, patch)
    this.data = data
    return Promise.resolve({ ok: true, savedAt: data.updatedAt, changed })
  }

  replaceAll(data: LogData): Promise<SaveResult> {
    this.data = structuredClone(data)
    return Promise.resolve({
      ok: true,
      savedAt: this.data.updatedAt,
      changed: Object.keys(this.data.days),
    })
  }
}

export class InMemoryConfigRepository implements ConfigRepository {
  private config: AppConfig

  constructor(initial: AppConfig) {
    this.config = structuredClone(initial)
  }

  load(): Promise<AppConfig> {
    return Promise.resolve(structuredClone(this.config))
  }

  save(config: AppConfig): Promise<SaveResult> {
    this.config = structuredClone(config)
    return Promise.resolve({ ok: true, savedAt: new Date().toISOString(), changed: [] })
  }
}

/** Implementasi in-memory untuk test: tanpa dialog native, path default statis. */
export class InMemoryEnvRepository implements EnvRepository {
  constructor(private readonly exportsDir = '/data/exports') {}

  info(): Promise<EnvInfo> {
    return Promise.resolve({ exportsDir: this.exportsDir })
  }

  pickFolder(): Promise<PickFolderResult> {
    return Promise.resolve({ unsupported: true })
  }
}
