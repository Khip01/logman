import { describe, expect, it } from 'vitest'
import {
  hapusPembimbing,
  resolveNamaMinggu,
  resolvePembimbingDefault,
  sanitizeNamaMinggu,
  sanitizeNamaPenandaTangan,
  sanitizePembimbing,
  setDefaultPembimbing,
  tambahPembimbing,
} from './pembimbing'

describe('sanitizePembimbing', () => {
  it('mengembalikan array kosong untuk input bukan array', () => {
    expect(sanitizePembimbing(null)).toEqual([])
    expect(sanitizePembimbing('Budi')).toEqual([])
  })

  it('memangkas spasi dan membuang entri kosong', () => {
    expect(sanitizePembimbing(['  Budi  ', '', '   ', 'Siti'])).toEqual(['Budi', 'Siti'])
  })

  it('membuang duplikat tanpa membedakan huruf besar/kecil', () => {
    expect(sanitizePembimbing(['Budi', 'budi', 'Siti'])).toEqual(['Budi', 'Siti'])
  })

  it('mengabaikan entri bukan string', () => {
    expect(sanitizePembimbing(['Budi', 7, null, 'Siti'])).toEqual(['Budi', 'Siti'])
  })
})

describe('tambahPembimbing', () => {
  it('menambah nilai baru di akhir', () => {
    expect(tambahPembimbing(['Budi'], 'Siti')).toEqual(['Budi', 'Siti'])
  })

  it('memangkas spasi', () => {
    expect(tambahPembimbing([], '  Siti  ')).toEqual(['Siti'])
  })

  it('mengembalikan referensi sama bila kosong atau duplikat', () => {
    const list = ['Budi']
    expect(tambahPembimbing(list, '   ')).toBe(list)
    expect(tambahPembimbing(list, 'BUDI')).toBe(list)
  })
})

describe('hapusPembimbing', () => {
  it('menghapus tanpa membedakan huruf besar/kecil', () => {
    expect(hapusPembimbing(['Budi', 'Siti'], 'BUDI')).toEqual(['Siti'])
  })

  it('tidak berubah bila nilai tidak ada', () => {
    expect(hapusPembimbing(['Budi'], 'Siti')).toEqual(['Budi'])
  })
})

describe('setDefaultPembimbing', () => {
  it('hanya menerima nama yang ada di daftar', () => {
    expect(setDefaultPembimbing(['Budi', 'Siti'], 'budi')).toBe('Budi')
    expect(setDefaultPembimbing(['Budi'], 'Andi')).toBeNull()
  })

  it('null tetap null', () => {
    expect(setDefaultPembimbing(['Budi'], null)).toBeNull()
  })
})

describe('resolvePembimbingDefault', () => {
  it('memakai nilai eksplisit bila ada di daftar', () => {
    expect(resolvePembimbingDefault(['Budi', 'Siti'], 'Siti')).toBe('Siti')
  })

  it('jatuh ke nama pertama bila nilai hilang atau tidak ada', () => {
    expect(resolvePembimbingDefault(['Budi', 'Siti'], 'Andi')).toBe('Budi')
    expect(resolvePembimbingDefault(['Budi'], undefined)).toBe('Budi')
  })

  it('null bila daftar kosong', () => {
    expect(resolvePembimbingDefault([], 'Budi')).toBeNull()
  })
})

describe('sanitizeNamaMinggu', () => {
  it('membuang field kosong', () => {
    expect(sanitizeNamaMinggu({ mahasiswa: '  Ani ', dosen: '   ', pembimbing: '' })).toEqual({
      mahasiswa: 'Ani',
    })
  })

  it('mengembalikan objek kosong untuk input bukan objek', () => {
    expect(sanitizeNamaMinggu(null)).toEqual({})
    expect(sanitizeNamaMinggu('Ani')).toEqual({})
  })
})

describe('sanitizeNamaPenandaTangan', () => {
  it('membuang entri yang seluruhnya kosong', () => {
    expect(
      sanitizeNamaPenandaTangan({
        'w-1': { mahasiswa: 'Ani' },
        'w-2': { mahasiswa: '', dosen: '  ' },
      }),
    ).toEqual({ 'w-1': { mahasiswa: 'Ani' } })
  })

  it('mengembalikan objek kosong untuk input bukan objek', () => {
    expect(sanitizeNamaPenandaTangan(null)).toEqual({})
  })
})

describe('resolveNamaMinggu', () => {
  const defaults = { mahasiswa: 'Ani', dosen: 'Dr. Budi', pembimbing: 'Siti' }

  it('memakai default bila tidak ada override', () => {
    expect(resolveNamaMinggu(undefined, defaults)).toEqual(defaults)
  })

  it('override menimpa default per field', () => {
    expect(resolveNamaMinggu({ mahasiswa: 'Cindy' }, defaults)).toEqual({
      mahasiswa: 'Cindy',
      dosen: 'Dr. Budi',
      pembimbing: 'Siti',
    })
  })

  it('override pembimbing per minggu', () => {
    expect(resolveNamaMinggu({ pembimbing: 'Andi' }, defaults).pembimbing).toBe('Andi')
  })
})
