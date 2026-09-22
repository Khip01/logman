import { describe, expect, it } from 'vitest'
import { defaultConfig, defaultLogData } from '@/lib/domain/schema'
import { mergeDayPatches } from '@/stores/logs'
import { InMemoryConfigRepository, InMemoryEnvRepository, InMemoryLogRepository } from './types'

describe('InMemoryLogRepository', () => {
  it('memuat data kosong secara default', async () => {
    const repo = new InMemoryLogRepository()
    const data = await repo.load()
    expect(data.days).toEqual({})
  })

  it('menyimpan patch sebagian dan melaporkan yang berubah', async () => {
    const repo = new InMemoryLogRepository()
    const result = await repo.patchDays({
      '2026-09-21': { kegiatan: 'Rapat', status: 'terisi' },
    })
    expect(result.ok).toBe(true)
    expect(result.changed).toEqual(['2026-09-21'])

    const data = await repo.load()
    expect(data.days['2026-09-21']?.kegiatan).toBe('Rapat')
  })

  it('menggabungkan patch berurutan pada tanggal yang sama', async () => {
    const repo = new InMemoryLogRepository()
    await repo.patchDays({ '2026-09-21': { masuk: '08.00' } })
    await repo.patchDays({ '2026-09-21': { kegiatan: 'Rapat' } })

    const data = await repo.load()
    expect(data.days['2026-09-21']?.masuk).toBe('08.00')
    expect(data.days['2026-09-21']?.kegiatan).toBe('Rapat')
  })

  it('replaceAll menimpa seluruh data', async () => {
    const repo = new InMemoryLogRepository()
    await repo.patchDays({ '2026-09-21': { kegiatan: 'Lama' } })
    await repo.replaceAll(defaultLogData())
    const data = await repo.load()
    expect(data.days).toEqual({})
  })

  it('menyimpan override nama penanda tangan per minggu', async () => {
    const repo = new InMemoryLogRepository()
    const result = await repo.patchNamaMinggu('2026-W36', { pembimbing: 'Siti' })
    expect(result.changed).toEqual(['2026-W36'])

    const data = await repo.load()
    expect(data.namaPenandaTangan['2026-W36']).toEqual({ pembimbing: 'Siti' })
  })

  it('tidak membocorkan referensi internal', async () => {
    const repo = new InMemoryLogRepository()
    await repo.patchDays({ '2026-09-21': { kegiatan: 'Rapat' } })
    const first = await repo.load()
    const entry = first.days['2026-09-21']
    if (!entry) throw new Error('entri tidak ditemukan')
    entry.kegiatan = 'DIUBAH DILUAR'
    const second = await repo.load()
    expect(second.days['2026-09-21']?.kegiatan).toBe('Rapat')
  })
})

describe('InMemoryConfigRepository', () => {
  it('memuat dan menyimpan konfigurasi', async () => {
    const repo = new InMemoryConfigRepository(defaultConfig())
    const initial = await repo.load()
    expect(initial.profil.nama).toBe('')

    await repo.save({ ...initial, profil: { ...initial.profil, nama: 'Akhmad' } })
    const after = await repo.load()
    expect(after.profil.nama).toBe('Akhmad')
  })
})

describe('InMemoryEnvRepository', () => {
  it('memberi path ekspor default', async () => {
    const repo = new InMemoryEnvRepository('/data/exports')
    expect(await repo.info()).toEqual({ exportsDir: '/data/exports' })
  })

  it('tidak mendukung dialog native di test', async () => {
    const repo = new InMemoryEnvRepository()
    expect(await repo.pickFolder()).toEqual({ unsupported: true })
  })
})

describe('mergeDayPatches', () => {
  it('menggabungkan field per tanggal', () => {
    const merged = mergeDayPatches(
      { '2026-09-21': { masuk: '08.00' } },
      { '2026-09-21': { kegiatan: 'Rapat' } },
    )
    expect(merged['2026-09-21']).toEqual({ masuk: '08.00', kegiatan: 'Rapat' })
  })

  it('null menang untuk menghapus', () => {
    const merged = mergeDayPatches({ '2026-09-21': { masuk: '08.00' } }, { '2026-09-21': null })
    expect(merged['2026-09-21']).toBeNull()
  })

  it('menambahkan tanggal baru', () => {
    const merged = mergeDayPatches({}, { '2026-09-22': { kegiatan: 'Baru' } })
    expect(merged['2026-09-22']).toEqual({ kegiatan: 'Baru' })
  })
})
