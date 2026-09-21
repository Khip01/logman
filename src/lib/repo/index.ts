import { HttpBackupRepository, HttpConfigRepository, HttpLogRepository } from './http'

/**
 * Instance repository untuk runtime. UI hanya boleh mengakses lewat sini, bukan
 * memanggil fetch langsung (AGENTS.md bagian 5.4).
 *
 * Saat test, ganti dengan implementasi in-memory lewat `setRepositories`.
 */

export interface Repositories {
  config: HttpConfigRepository
  logs: HttpLogRepository
  backups: HttpBackupRepository
}

let current: Repositories = {
  config: new HttpConfigRepository(),
  logs: new HttpLogRepository(),
  backups: new HttpBackupRepository(),
}

export function getRepositories(): Repositories {
  return current
}

/** Mengganti implementasi, dipakai test dan storybook. */
export function setRepositories(next: Partial<Repositories>): void {
  current = { ...current, ...next }
}

export { HttpBackupRepository, HttpConfigRepository, HttpLogRepository } from './http'
export * from './types'
