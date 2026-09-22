import { describe, expect, it } from 'vitest'
import { buildMonthGroups } from './calendar'
import { buildSeedPatch, SEED_KEGIATAN } from './seed'

const RANGE = { mulai: '2026-09-23', selesai: '2026-09-26' } as const
const FULL_RANGE = { mulai: '2026-09-01', selesai: '2026-09-30' } as const

function september() {
  const months = buildMonthGroups(FULL_RANGE.mulai, FULL_RANGE.selesai)
  const month = months.find((m) => m.key === '2026-09')
  if (!month) throw new Error('fixture bulan September tidak ditemukan')
  return month
}

describe('buildSeedPatch', () => {
  it('mengisi hanya hari yang bisa diisi pada rentang', () => {
    const patch = buildSeedPatch(september(), RANGE)
    expect(Object.keys(patch).sort()).toEqual([
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
    ])
  })

  it('menandai hari terisi dan mengosongkan alasan serta jam', () => {
    const patch = buildSeedPatch(september(), RANGE)
    expect(patch['2026-09-23']).toEqual({
      kegiatan: SEED_KEGIATAN[0],
      alasan: null,
      status: 'terisi',
      masuk: null,
      pulang: null,
    })
  })

  it('mengisi seluruh hari yang bisa diisi pada rentang penuh', () => {
    const patch = buildSeedPatch(september(), FULL_RANGE)
    // Senin-Sabtu di 1 sampai 30 September 2026, di luar tanggal di luar rentang.
    expect(Object.keys(patch)).toHaveLength(26)
    for (const entry of Object.values(patch)) {
      expect(entry.status).toBe('terisi')
      expect(entry.kegiatan).not.toBe('')
    }
  })

  it('deterministik: rentang dan bulan sama menghasilkan patch sama', () => {
    const a = buildSeedPatch(september(), FULL_RANGE)
    const b = buildSeedPatch(september(), FULL_RANGE)
    expect(a).toEqual(b)
  })

  it('memutar daftar kegiatan contoh', () => {
    const patch = buildSeedPatch(september(), FULL_RANGE)
    const kegiatanList = Object.values(patch).map((entry) => entry.kegiatan)
    expect(kegiatanList).toContain(SEED_KEGIATAN[0])
    expect(kegiatanList.length).toBeGreaterThan(SEED_KEGIATAN.length)
  })
})
