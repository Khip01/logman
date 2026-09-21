import { describe, expect, it } from 'vitest'
import { addAlasan, removeAlasan, sanitizeAlasan } from './alasan'

describe('sanitizeAlasan', () => {
  it('mengembalikan array kosong untuk input bukan array', () => {
    expect(sanitizeAlasan(null)).toEqual([])
    expect(sanitizeAlasan('Izin')).toEqual([])
    expect(sanitizeAlasan({ 0: 'Izin' })).toEqual([])
  })

  it('membuang entri kosong dan memangkas spasi', () => {
    expect(sanitizeAlasan(['  Izin  ', '', '   ', 'Sakit'])).toEqual(['Izin', 'Sakit'])
  })

  it('membuang duplikat tanpa membedakan huruf besar/kecil, urutan tetap', () => {
    expect(sanitizeAlasan(['Izin', 'izin', 'Sakit', 'IZIN'])).toEqual(['Izin', 'Sakit'])
  })

  it('mengabaikan entri bukan string', () => {
    expect(sanitizeAlasan(['Izin', 42, null, 'Sakit'])).toEqual(['Izin', 'Sakit'])
  })

  it('mempertahankan urutan asli', () => {
    expect(sanitizeAlasan(['Sakit', 'Izin', 'Libur'])).toEqual(['Sakit', 'Izin', 'Libur'])
  })
})

describe('addAlasan', () => {
  it('menambahkan nilai baru di akhir', () => {
    expect(addAlasan(['Izin'], 'Sakit')).toEqual(['Izin', 'Sakit'])
  })

  it('memangkas spasi nilai baru', () => {
    expect(addAlasan([], '  Sakit  ')).toEqual(['Sakit'])
  })

  it('mengembalikan referensi yang sama bila nilai kosong', () => {
    const list = ['Izin']
    expect(addAlasan(list, '   ')).toBe(list)
    expect(addAlasan(list, '')).toBe(list)
  })

  it('mengembalikan referensi yang sama bila sudah ada (tanpa beda huruf)', () => {
    const list = ['Izin']
    expect(addAlasan(list, 'izin')).toBe(list)
    expect(addAlasan(list, 'IZIN')).toBe(list)
  })
})

describe('removeAlasan', () => {
  it('menghapus nilai tanpa membedakan huruf besar/kecil', () => {
    expect(removeAlasan(['Izin', 'Sakit'], 'IZIN')).toEqual(['Sakit'])
  })

  it('tidak mengubah apa pun bila nilai tidak ada', () => {
    expect(removeAlasan(['Izin'], 'Cuti')).toEqual(['Izin'])
  })

  it('boleh menghasilkan daftar kosong', () => {
    expect(removeAlasan(['Izin'], 'Izin')).toEqual([])
  })
})
