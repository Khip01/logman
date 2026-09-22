import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { parseDialogOutput, resolveStartDir } from './pickFolder'
import { createPaths, ensureDirs } from './store'

const tempDirs: string[] = []

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'logman-pick-'))
  tempDirs.push(dir)
  return dir
}

afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true })
})

describe('resolveStartDir', () => {
  it('memakai current bila direktori itu ada', () => {
    const dir = makeTempDir()
    expect(resolveStartDir(dir, '/fallback')).toBe(dir)
  })

  it('jatuh ke fallback bila current kosong atau bukan string', () => {
    expect(resolveStartDir('', '/fallback')).toBe('/fallback')
    expect(resolveStartDir('   ', '/fallback')).toBe('/fallback')
    expect(resolveStartDir(null, '/fallback')).toBe('/fallback')
    expect(resolveStartDir(42, '/fallback')).toBe('/fallback')
  })

  it('jatuh ke fallback bila path tidak ada atau bukan direktori', () => {
    const missing = join(tmpdir(), 'logman-tidak-ada-xyz')
    expect(resolveStartDir(missing, '/fallback')).toBe('/fallback')
    expect(resolveStartDir(__filename, '/fallback')).toBe('/fallback')
  })

  it('tidak pernah memakai home atau root saat current tidak valid', () => {
    expect(resolveStartDir('/tidak/ada', '/data/exports')).toBe('/data/exports')
  })
})

describe('parseDialogOutput', () => {
  it('mengembalikan path saat dialog sukses', () => {
    expect(parseDialogOutput('/home/user/Dokumen\n', 0)).toEqual({
      path: '/home/user/Dokumen',
    })
  })

  it('menganggap keluar bukan nol sebagai batal', () => {
    expect(parseDialogOutput('', 1)).toEqual({ cancelled: true })
    expect(parseDialogOutput('/home/user\n', 1)).toEqual({ cancelled: true })
  })

  it('menganggap keluaran kosong sebagai batal', () => {
    expect(parseDialogOutput('  \n', 0)).toEqual({ cancelled: true })
  })
})

describe('createPaths exportsDir', () => {
  it('menempatkan folder ekspor default di root data dan membuatnya', () => {
    const root = makeTempDir()
    const paths = createPaths(root)
    expect(paths.exportsDir).toBe(join(root, 'exports'))
    ensureDirs(paths)
    expect(resolveStartDir(paths.exportsDir, '/fallback')).toBe(paths.exportsDir)
  })
})
