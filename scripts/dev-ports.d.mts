/**
 * Tipe untuk `scripts/dev-ports.mjs`.
 *
 * Berkas implementasinya sengaja ditulis dalam JavaScript supaya bisa dijalankan langsung
 * dengan `node` tanpa langkah build, dan tanpa menarik `tsx` ke jalur start dev server.
 * Deklarasi ini hanya supaya `vite.config.ts` dan `server/index.ts` tetap punya tipe.
 */

export type PortMode = 'auto' | 'strict'

export interface DevPorts {
  /** Port yang dipakai Vite. */
  webPort: number
  /** Port yang dipakai server API Hono. */
  apiPort: number
  /** True bila port dinaikkan otomatis karena default-nya sedang dipakai. */
  autoPort: boolean
}

export interface FindFreePortOptions {
  host?: string
  /** Port yang sudah dipakai proses lain di sesi ini, agar tidak dipilih ulang. */
  taken?: number[]
}

export const DEFAULT_WEB_PORT: number
export const DEFAULT_API_PORT: number
export const DEV_HOST: string
export const DEV_PORTS_FILE: string

export function resolveMode(env?: NodeJS.ProcessEnv): PortMode
export function isPortFree(port: number, host?: string): Promise<boolean>
export function findFreePort(startPort: number, options?: FindFreePortOptions): Promise<number>
export function resolveDevPorts(options?: {
  env?: NodeJS.ProcessEnv
  mode?: PortMode
}): Promise<DevPorts>
export function devPortsPath(cwd?: string): string
export function readDevPorts(cwd?: string): DevPorts
export function writeDevPorts(ports: DevPorts, cwd?: string): void
export function describePorts(ports: DevPorts): string
