import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_API_PORT,
  DEFAULT_WEB_PORT,
  DEV_PORTS_FILE,
  findFreePort,
  isPortFree,
  readDevPorts,
  resolveDevPorts,
  writeDevPorts,
} from './dev-ports.mjs'

/**
 * Pemilihan port dev server (AGENTS.md bagian 4.1).
 *
 * Yang dijaga di sini adalah dua hal yang mudah rusak diam-diam:
 * 1. Auto-increment benar-benar terjadi saat port default dipakai proses lain.
 * 2. Mode strict TIDAK pernah menaikkan port, karena E2E meng-hardcode URL-nya.
 */

const direktoriBersih: string[] = []

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'logman-ports-'))
  direktoriBersih.push(dir)
  return dir
}

/** Mengambil satu port dan menahannya sampai dibebaskan. */
function occupy(port: number) {
  const server = createServer()
  return new Promise<() => Promise<void>>((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      resolve(
        () =>
          new Promise<void>((done) => {
            server.close(() => done())
          }),
      )
    })
  })
}

afterEach(async () => {
  for (const dir of direktoriBersih.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('isPortFree', () => {
  it('benar untuk port yang tidak dipakai', async () => {
    const port = await findFreePort(5300)
    expect(await isPortFree(port)).toBe(true)
  })

  it('salah untuk port yang sedang di-bind', async () => {
    const port = await findFreePort(5310)
    const release = await occupy(port)
    try {
      expect(await isPortFree(port)).toBe(false)
    } finally {
      await release()
    }
    // Setelah dilepas, port kembali dianggap bebas.
    expect(await isPortFree(port)).toBe(true)
  })
})

describe('findFreePort', () => {
  it('naik sampai menemukan port kosong', async () => {
    const start = await findFreePort(5320)
    const releaseA = await occupy(start)
    const next = await findFreePort(start)
    try {
      expect(next).toBeGreaterThan(start)
    } finally {
      await releaseA()
    }
  })

  it('melewati port yang sudah ditandai dipakai', async () => {
    const start = await findFreePort(5330)
    const release = await occupy(start + 1)
    try {
      // start dan start+1 sama-sama dipakai, jadi hasilnya harus start+2.
      const chosen = await findFreePort(start, { taken: [start] })
      expect(chosen).toBe(start + 2)
    } finally {
      await release()
    }
  })
})

describe('resolveDevPorts', () => {
  it('mode auto memakai port yang diminta saat kosong', async () => {
    // Port sengaja TIDAK di-occupy: ini kasus normal, port default sedang kosong.
    const web = await findFreePort(5340)
    const api = await findFreePort(5350)
    const ports = await resolveDevPorts({
      env: { LOGMAN_WEB_PORT: String(web), LOGMAN_API_PORT: String(api) },
      mode: 'auto',
    })
    expect(ports.webPort).toBe(web)
    expect(ports.apiPort).toBe(api)
    expect(ports.autoPort).toBe(true)
  })

  it('mode auto menaikkan web yang terpakai dan TIDAK menyentuh api', async () => {
    // Web diperebutkan proses lain, API dibiarkan kosong.
    const web = await findFreePort(5360)
    const api = await findFreePort(5370)
    const releaseWeb = await occupy(web)
    try {
      const ports = await resolveDevPorts({
        env: { LOGMAN_WEB_PORT: String(web), LOGMAN_API_PORT: String(api) },
        mode: 'auto',
      })
      expect(ports.webPort).toBeGreaterThan(web)
      // API tetap di portnya. Kalau API ikut naik, proxy Vite dan server API bisa
      // berebut port yang sama.
      expect(ports.apiPort).toBe(api)
    } finally {
      await releaseWeb()
    }
  })

  it('mode auto menaikkan api yang terpakai', async () => {
    const web = await findFreePort(5375)
    const api = await findFreePort(5380)
    const releaseApi = await occupy(api)
    try {
      const ports = await resolveDevPorts({
        env: { LOGMAN_WEB_PORT: String(web), LOGMAN_API_PORT: String(api) },
        mode: 'auto',
      })
      expect(ports.apiPort).toBeGreaterThan(api)
      expect(ports.webPort).toBe(web)
    } finally {
      await releaseApi()
    }
  })

  it('kedua proses tidak pernah mendapat port yang sama', async () => {
    // Web dan API meminta port yang sama. API akan mengambilnya, lalu web harus melewatinya.
    const sama = await findFreePort(5390)
    const ports = await resolveDevPorts({
      env: { LOGMAN_WEB_PORT: String(sama), LOGMAN_API_PORT: String(sama) },
      mode: 'auto',
    })
    expect(ports.webPort).not.toBe(ports.apiPort)
  })

  it('mode strict memakai port yang diminta saat kosong', async () => {
    const web = await findFreePort(5400)
    const api = await findFreePort(5410)
    const ports = await resolveDevPorts({
      env: { LOGMAN_WEB_PORT: String(web), LOGMAN_API_PORT: String(api) },
      mode: 'strict',
    })
    expect(ports.webPort).toBe(web)
    expect(ports.apiPort).toBe(api)
    expect(ports.autoPort).toBe(false)
  })

  it('mode strict GAGAL, bukan menaikkan port', async () => {
    // Ini yang menjaga E2E: kalau port yang diminta terpakai, test harus gagal dengan
    // jelas, bukan diam-diam mengukur server lain yang kebetulan ada di port tersebut.
    const web = await findFreePort(5420)
    const release = await occupy(web)
    try {
      await expect(
        resolveDevPorts({
          env: { LOGMAN_WEB_PORT: String(web), LOGMAN_API_PORT: String(await findFreePort(5430)) },
          mode: 'strict',
        }),
      ).rejects.toThrow(/tidak menaikkan port/i)
    } finally {
      await release()
    }
  })
})

describe('berkas .dev-ports.json', () => {
  it('baca menulis lalu membaca kembali nilai yang sama', () => {
    const dir = tempDir()
    const ports = { webPort: 6001, apiPort: 6000, autoPort: true }
    writeDevPorts(ports, dir)
    expect(readDevPorts(dir)).toEqual(ports)
  })

  it('bawaan dipakai saat berkas tidak ada', () => {
    // `pnpm dev:web` bisa jalan tanpa `pnpm dev`, jadi berkas boleh absen.
    const dir = tempDir()
    const ports = readDevPorts(dir)
    expect(ports.webPort).toBe(DEFAULT_WEB_PORT)
    expect(ports.apiPort).toBe(DEFAULT_API_PORT)
    expect(ports.autoPort).toBe(false)
  })

  it('bawaan dipakai saat berkas rusak, bukan melempar error', () => {
    // Berkas rusak tidak boleh membuat `vite` gagal start.
    const dir = tempDir()
    writeFileSync(join(dir, DEV_PORTS_FILE), 'bukan json {{{', 'utf8')
    expect(readDevPorts(dir).webPort).toBe(DEFAULT_WEB_PORT)
  })

  it('bawaan dipakai saat isinya bukan angka', () => {
    const dir = tempDir()
    writeFileSync(join(dir, DEV_PORTS_FILE), '{"webPort":"abc","apiPort":null}', 'utf8')
    expect(readDevPorts(dir).webPort).toBe(DEFAULT_WEB_PORT)
  })

  it('berkas yang ditulis benar-benar ada di disk', () => {
    const dir = tempDir()
    writeDevPorts({ webPort: 6111, apiPort: 6110, autoPort: false }, dir)
    const isi = JSON.parse(readFileSync(join(dir, DEV_PORTS_FILE), 'utf8'))
    expect(isi).toEqual({ webPort: 6111, apiPort: 6110, autoPort: false })
  })
})
