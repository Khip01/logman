import { describe, expect, it } from 'vitest'
import {
  addAlasan,
  alasanLabels,
  isLegacyStripLabel,
  removeAlasan,
  sanitizeAlasan,
  stripJamFor,
  toggleStripJam,
} from './alasan'

describe('sanitizeAlasan', () => {
  it('mengembalikan array kosong untuk input bukan array', () => {
    expect(sanitizeAlasan(null)).toEqual([])
    expect(sanitizeAlasan('Izin')).toEqual([])
    expect(sanitizeAlasan({ 0: 'Izin' })).toEqual([])
  })

  it('membuang entri kosong dan memangkas spasi', () => {
    expect(sanitizeAlasan(['  Izin  ', '', '   ', 'Sakit'])).toEqual([
      { label: 'Izin', stripJam: true },
      { label: 'Sakit', stripJam: true },
    ])
  })

  it('membuang duplikat tanpa membedakan huruf besar/kecil, urutan tetap', () => {
    expect(sanitizeAlasan(['Izin', 'izin', 'Sakit', 'IZIN'])).toEqual([
      { label: 'Izin', stripJam: true },
      { label: 'Sakit', stripJam: true },
    ])
  })

  it('mengabaikan entri bukan string', () => {
    expect(sanitizeAlasan(['Izin', 42, null, 'Sakit'])).toEqual([
      { label: 'Izin', stripJam: true },
      { label: 'Sakit', stripJam: true },
    ])
  })

  it('mempertahankan urutan asli', () => {
    expect(sanitizeAlasan(['Sakit', 'Izin', 'Libur'])).toEqual([
      { label: 'Sakit', stripJam: true },
      { label: 'Izin', stripJam: true },
      { label: 'Libur', stripJam: false },
    ])
  })

  /*
   * Migrasi dari config.json lama. Config yang sudah dipakai user menyimpan `string[]`,
   * jadi `parseConfig` HARUS bisa membacanya dan tidak boleh mengubah perilaku strip.
   */
  describe('migrasi dari bentuk lama string[]', () => {
    it('menyalakan strip hanya untuk label yang dulu otomatis strip', () => {
      expect(sanitizeAlasan(['Libur Nasional', 'Izin', 'Sakit', 'Tanpa Keterangan'])).toEqual([
        { label: 'Libur Nasional', stripJam: false },
        { label: 'Izin', stripJam: true },
        { label: 'Sakit', stripJam: true },
        { label: 'Tanpa Keterangan', stripJam: false },
      ])
    })

    it('mengabaikan huruf besar pada label legacy', () => {
      expect(sanitizeAlasan(['SAKIT', 'izin'])).toEqual([
        { label: 'SAKIT', stripJam: true },
        { label: 'izin', stripJam: true },
      ])
    })
  })

  describe('bentuk baru Alasan[]', () => {
    it('memakai stripJam yang tersimpan', () => {
      expect(
        sanitizeAlasan([
          { label: 'Sakit Gigi', stripJam: true },
          { label: 'Libur Nasional', stripJam: false },
        ]),
      ).toEqual([
        { label: 'Sakit Gigi', stripJam: true },
        { label: 'Libur Nasional', stripJam: false },
      ])
    })

    it('bentuk baru menang atas aturan legacy, jadi "Izin" bisa dimatikan', () => {
      expect(sanitizeAlasan([{ label: 'Izin', stripJam: false }])).toEqual([
        { label: 'Izin', stripJam: false },
      ])
    })

    it('stripJam yang bukan boolean dianggap false', () => {
      expect(sanitizeAlasan([{ label: 'Cuti', stripJam: 'ya' }])).toEqual([
        { label: 'Cuti', stripJam: false },
      ])
    })

    it('membuang entri tanpa label yang valid', () => {
      expect(sanitizeAlasan([{ stripJam: true }, { label: 42 }, null, 'Izin'])).toEqual([
        { label: 'Izin', stripJam: true },
      ])
    })
  })
})

describe('isLegacyStripLabel', () => {
  it('hanya sakit dan izin', () => {
    expect(isLegacyStripLabel('Sakit')).toBe(true)
    expect(isLegacyStripLabel('izin')).toBe(true)
    expect(isLegacyStripLabel('  IZIN ')).toBe(true)
    expect(isLegacyStripLabel('Libur Nasional')).toBe(false)
    expect(isLegacyStripLabel('Sakit Gigi')).toBe(false)
    expect(isLegacyStripLabel('')).toBe(false)
  })
})

describe('alasanLabels', () => {
  it('mengambil label saja', () => {
    expect(
      alasanLabels([
        { label: 'Izin', stripJam: true },
        { label: 'Cuti', stripJam: false },
      ]),
    ).toEqual(['Izin', 'Cuti'])
  })
})

describe('addAlasan', () => {
  it('menambahkan nilai baru di akhir dengan stripJam false', () => {
    expect(addAlasan([{ label: 'Izin', stripJam: true }], 'Sakit Gigi')).toEqual([
      { label: 'Izin', stripJam: true },
      { label: 'Sakit Gigi', stripJam: false },
    ])
  })

  it('memangkas spasi nilai baru', () => {
    expect(addAlasan([], '  Cuti Bersama  ')).toEqual([{ label: 'Cuti Bersama', stripJam: false }])
  })

  it('mengembalikan referensi yang sama bila nilai kosong', () => {
    const list = [{ label: 'Izin', stripJam: true }]
    expect(addAlasan(list, '   ')).toBe(list)
    expect(addAlasan(list, '')).toBe(list)
  })

  it('mengembalikan referensi yang sama bila sudah ada (tanpa beda huruf)', () => {
    const list = [{ label: 'Izin', stripJam: true }]
    expect(addAlasan(list, 'izin')).toBe(list)
    expect(addAlasan(list, 'IZIN')).toBe(list)
  })
})

describe('removeAlasan', () => {
  it('menghapus nilai tanpa membedakan huruf besar/kecil', () => {
    expect(
      removeAlasan(
        [
          { label: 'Izin', stripJam: true },
          { label: 'Sakit', stripJam: true },
        ],
        'IZIN',
      ),
    ).toEqual([{ label: 'Sakit', stripJam: true }])
  })

  it('tidak mengubah apa pun bila nilai tidak ada', () => {
    const list = [{ label: 'Izin', stripJam: true }]
    expect(removeAlasan(list, 'Cuti')).toEqual(list)
  })

  it('boleh menghasilkan daftar kosong', () => {
    expect(removeAlasan([{ label: 'Izin', stripJam: true }], 'Izin')).toEqual([])
  })
})

describe('toggleStripJam', () => {
  it('mematikan strip yang menyala', () => {
    expect(toggleStripJam([{ label: 'Sakit', stripJam: true }], 'Sakit')).toEqual([
      { label: 'Sakit', stripJam: false },
    ])
  })

  it('menyalakan strip yang mati, dan itu alasan kustom', () => {
    expect(toggleStripJam([{ label: 'Sakit Gigi', stripJam: false }], 'Sakit Gigi')).toEqual([
      { label: 'Sakit Gigi', stripJam: true },
    ])
  })

  it('tidak menyentuh entri lain dan tetap memakai referensi yang sama', () => {
    const list = [
      { label: 'Izin', stripJam: true },
      { label: 'Cuti', stripJam: false },
    ]
    expect(toggleStripJam(list, 'izin')).toEqual([
      { label: 'Izin', stripJam: false },
      { label: 'Cuti', stripJam: false },
    ])
  })

  it('mengembalikan referensi yang sama bila label tidak ada', () => {
    const list = [{ label: 'Izin', stripJam: true }]
    expect(toggleStripJam(list, 'Cuti')).toBe(list)
  })
})

describe('stripJamFor', () => {
  it('memakai tanda milik alasan yang ada di daftar', () => {
    const list = [{ label: 'Sakit Gigi', stripJam: true }]
    expect(stripJamFor(list, 'Sakit Gigi')).toBe(true)
  })

  it('menghormati tanda yang dimatikan, walau labelnya legacy', () => {
    expect(stripJamFor([{ label: 'Izin', stripJam: false }], 'izin')).toBe(false)
  })

  /*
   * Alasan yang diketik bebas di editor tidak ada di daftar. Supaya mengetik "sakit"
   * tetap berperilaku seperti versi lama, aturan legacy dipakai sebagai fallback.
   */
  it('memakai aturan legacy untuk alasan yang diketik bebas', () => {
    const list = [{ label: 'Cuti Bersama', stripJam: false }]
    expect(stripJamFor(list, 'sakit')).toBe(true)
    expect(stripJamFor(list, 'izin')).toBe(true)
    expect(stripJamFor(list, 'Demam')).toBe(false)
  })

  it('false untuk label kosong, null, dan undefined', () => {
    expect(stripJamFor([], '')).toBe(false)
    expect(stripJamFor([], null)).toBe(false)
    expect(stripJamFor([], undefined)).toBe(false)
    expect(stripJamFor([], '   ')).toBe(false)
  })

  it('daftar kosong tetap memakai aturan legacy', () => {
    expect(stripJamFor([], 'Sakit')).toBe(true)
  })
})
