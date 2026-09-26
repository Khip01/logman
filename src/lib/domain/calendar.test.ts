import { describe, expect, it } from 'vitest'
import {
  buildMonthGroups,
  buildWeekDays,
  createEmptyDay,
  dayOfWeekKey,
  disabledReasonFor,
  disabledReasonText,
  editableWeekDates,
  findMonthOfWeek,
  findWeek,
  findWeekOfDate,
  formatWeekRange,
  isDayActive,
  mondaysInRange,
  pickInitialMonthKey,
  pickInitialWeekId,
  sanitizeHariKerja,
  weekDates,
} from './calendar'
import type { DayOfWeek, MonthGroup, WeekEntry } from './types'

/** Daftar hari kerja umum untuk test, urut Senin sampai Sabtu. */
const SENIN_SABTU: DayOfWeek[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
/** Tanpa Sabtu, yaitu magang lima hari kerja. */
const SENIN_JUMAT: DayOfWeek[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat']

describe('dayOfWeekKey', () => {
  it('memetakan hari kerja', () => {
    expect(dayOfWeekKey('2026-09-21')).toBe('senin')
    expect(dayOfWeekKey('2026-09-22')).toBe('selasa')
    expect(dayOfWeekKey('2026-09-26')).toBe('sabtu')
  })

  it('mengembalikan null untuk akhir pekan', () => {
    expect(dayOfWeekKey('2026-09-20')).toBeNull()
  })
})

describe('createEmptyDay dan buildWeekDays', () => {
  it('membuat hari kosong dengan status kosong', () => {
    const day = createEmptyDay('2026-09-21')
    expect(day).toEqual({
      date: '2026-09-21',
      masuk: null,
      pulang: null,
      kegiatan: '',
      alasan: null,
      status: 'kosong',
    })
  })

  it('membangun tepat enam baris Senin sampai Sabtu', () => {
    const days = buildWeekDays('2026-09-21')
    expect(days).toHaveLength(6)
    expect(days[0]?.date).toBe('2026-09-21')
    expect(days[5]?.date).toBe('2026-09-26')
  })
})

describe('kepemilikan baris per bulan', () => {
  const range = { mulai: '2026-08-01', selesai: '2026-12-31' }

  it('baris pada bulan aktif tidak disabled', () => {
    expect(disabledReasonFor('2026-09-21', '2026-09', range)).toBeNull()
    expect(isDayActive('2026-09-21', '2026-09', range)).toBe(true)
  })

  it('baris milik bulan lain disabled dengan alasan bulan lain', () => {
    expect(disabledReasonFor('2026-08-31', '2026-09', range)).toBe('bulan-lain')
    expect(disabledReasonFor('2026-09-01', '2026-08', range)).toBe('bulan-lain')
  })

  it('hari sebelum magang mulai disabled', () => {
    const partial = { mulai: '2026-09-16', selesai: '2026-12-31' }
    expect(disabledReasonFor('2026-09-14', '2026-09', partial)).toBe('sebelum-magang')
    expect(disabledReasonFor('2026-09-16', '2026-09', partial)).toBeNull()
  })

  it('hari setelah magang selesai disabled', () => {
    const partial = { mulai: '2026-09-01', selesai: '2026-09-18' }
    expect(disabledReasonFor('2026-09-19', '2026-09', partial)).toBe('setelah-magang')
    expect(disabledReasonFor('2026-09-18', '2026-09', partial)).toBeNull()
  })

  it('prioritas: di luar rentang lebih dulu daripada bulan lain', () => {
    const partial = { mulai: '2026-09-16', selesai: '2026-12-31' }
    // 31 Agustus: di luar rentang DAN bulan lain. Alasan harus sebelum-magang.
    expect(disabledReasonFor('2026-08-31', '2026-09', partial)).toBe('sebelum-magang')
  })

  it('tanpa rentang, hanya aturan bulan yang berlaku', () => {
    const empty = { mulai: null, selesai: null }
    expect(disabledReasonFor('2026-09-21', '2026-09', empty)).toBeNull()
    expect(disabledReasonFor('2026-08-31', '2026-09', empty)).toBe('bulan-lain')
  })
})

describe('editableWeekDates', () => {
  /** Minggu minimal; `editableWeekDates` hanya membaca `days`. */
  function weekOf(monday: string): WeekEntry {
    return {
      id: monday,
      startDate: monday,
      endDate: monday,
      weekOfMonth: 1,
      days: buildWeekDays(monday),
    }
  }

  it('menghitung seluruh enam hari bila semuanya milik bulan dan di dalam rentang', () => {
    const range = { mulai: '2026-09-01', selesai: '2026-09-30' }
    expect(editableWeekDates(weekOf('2026-09-21'), '2026-09', range)).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
    ])
  })

  /*
   * Regresi: minggu di awal bulan memuat hari milik bulan sebelumnya. Hari itu tidak
   * dapat diisi, jadi TIDAK boleh ikut dihitung. Sebelumnya penghitung memakai seluruh
   * enam hari sehingga tertulis "0 dari 6" padahal hanya lima yang bisa diisi.
   */
  it('membuang hari milik bulan tetangga pada minggu lintas bulan', () => {
    const range = { mulai: '2026-08-01', selesai: '2026-12-31' }
    // Senin 31 Agustus 2026; hanya 1 sampai 5 September yang milik September.
    const hasil = editableWeekDates(weekOf('2026-08-31'), '2026-09', range)
    expect(hasil).toEqual(['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'])
    expect(hasil).not.toContain('2026-08-31')
  })

  it('membuang hari di luar rentang magang', () => {
    const range = { mulai: '2026-09-23', selesai: '2026-09-30' }
    // Senin dan Selasa berada sebelum magang dimulai.
    expect(editableWeekDates(weekOf('2026-09-21'), '2026-09', range)).toEqual([
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
    ])
  })

  it('menggabungkan aturan bulan dan rentang', () => {
    const range = { mulai: '2026-09-02', selesai: '2026-09-30' }
    // 31 Agustus bukan September DAN di luar rentang; 1 September milik September tetapi
    // di luar rentang. Sisanya boleh.
    expect(editableWeekDates(weekOf('2026-08-31'), '2026-09', range)).toEqual([
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
    ])
  })

  it('setiap hari bulan terhitung tepat SEKALI di seluruh minggu bulan itu', () => {
    const range = { mulai: '2026-09-01', selesai: '2026-09-30' }
    const bulan = buildMonthGroups(range.mulai, range.selesai).find((m) => m.key === '2026-09')
    expect(bulan).toBeDefined()

    const semua = (bulan as MonthGroup).weeks.flatMap((week) =>
      editableWeekDates(week, '2026-09', range),
    )
    // September 2026: 26 hari Senin sampai Sabtu. Minggu lintas bulan tidak boleh membuat
    // ada tanggal yang terhitung dua kali.
    expect(semua).toHaveLength(26)
    expect(new Set(semua).size).toBe(26)
  })
})

describe('mondaysInRange', () => {
  it('menghasilkan Senin pertama sampai terakhir yang menyentuh rentang', () => {
    // Rentang mulai Rabu 16 Sep 2026, selesai Jumat 2 Okt 2026.
    const result = mondaysInRange('2026-09-16', '2026-10-02')
    expect(result).toEqual(['2026-09-14', '2026-09-21', '2026-09-28'])
  })

  it('rentang satu hari menghasilkan satu Senin', () => {
    expect(mondaysInRange('2026-09-21', '2026-09-21')).toEqual(['2026-09-21'])
  })
})

describe('buildMonthGroups', () => {
  it('mengembalikan kosong untuk rentang tidak valid', () => {
    expect(buildMonthGroups('2026-09-30', '2026-09-01')).toEqual([])
    expect(buildMonthGroups('bukan-tanggal', '2026-09-01')).toEqual([])
  })

  it('membagi minggu lintas bulan ke DUA grup (AGENTS.md bagian 6)', () => {
    // Rentang 1 Agu 2026 sampai 30 Sep 2026 memuat minggu 31 Agu - 5 Sep.
    const groups = buildMonthGroups('2026-08-01', '2026-09-30')
    expect(groups.map((g) => g.key)).toEqual(['2026-08', '2026-09'])

    const agustus = groups[0]
    const september = groups[1]
    if (!agustus || !september) throw new Error('grup bulan tidak lengkap')

    const weekId = '2026-08-31'
    const inAgustus = agustus.weeks.find((w) => w.id === weekId)
    const inSeptember = september.weeks.find((w) => w.id === weekId)

    expect(inAgustus).toBeDefined()
    expect(inSeptember).toBeDefined()
    expect(inAgustus?.startDate).toBe('2026-08-31')
    expect(inAgustus?.endDate).toBe('2026-09-05')
  })

  it('baris Senin 31 Agu aktif di grup Agustus dan disabled di grup September', () => {
    const range = { mulai: '2026-08-01', selesai: '2026-09-30' }

    expect(isDayActive('2026-08-31', '2026-08', range)).toBe(true)
    expect(isDayActive('2026-08-31', '2026-09', range)).toBe(false)
    expect(disabledReasonFor('2026-08-31', '2026-09', range)).toBe('bulan-lain')

    // Baris Selasa 1 Sep aktif di grup September dan disabled di grup Agustus.
    expect(isDayActive('2026-09-01', '2026-09', range)).toBe(true)
    expect(disabledReasonFor('2026-09-01', '2026-08', range)).toBe('bulan-lain')
  })

  it('nomor minggu di-reset per bulan, mulai dari 1', () => {
    const groups = buildMonthGroups('2026-08-01', '2026-09-30')
    for (const group of groups) {
      expect(group.weeks[0]?.weekOfMonth).toBe(1)
      // Nomor berurutan tanpa lompatan.
      group.weeks.forEach((week, index) => {
        expect(week.weekOfMonth).toBe(index + 1)
      })
    }
  })

  it('minggu lintas bulan menjadi M1 di bulan berikutnya', () => {
    const groups = buildMonthGroups('2026-08-01', '2026-09-30')
    const september = groups.find((g) => g.key === '2026-09')
    // Minggu 31 Agu - 5 Sep adalah minggu pertama yang menyentuh September.
    expect(september?.weeks[0]?.id).toBe('2026-08-31')
    expect(september?.weeks[0]?.weekOfMonth).toBe(1)
  })

  it('menangani rentang yang mulai di pertengahan minggu', () => {
    // Mulai Rabu 16 Sep 2026. Minggu pertama dimulai Senin 14 Sep, tapi hari
    // 14 dan 15 berada di luar rentang.
    const groups = buildMonthGroups('2026-09-16', '2026-10-02')
    const september = groups.find((g) => g.key === '2026-09')
    expect(september?.weeks[0]?.id).toBe('2026-09-14')

    const range = { mulai: '2026-09-16', selesai: '2026-10-02' }
    expect(isDayActive('2026-09-14', '2026-09', range)).toBe(false)
    expect(disabledReasonFor('2026-09-14', '2026-09', range)).toBe('sebelum-magang')
    expect(isDayActive('2026-09-16', '2026-09', range)).toBe(true)
  })

  it('menangani rentang yang berakhir di pertengahan minggu', () => {
    const groups = buildMonthGroups('2026-09-01', '2026-09-18')
    const range = { mulai: '2026-09-01', selesai: '2026-09-18' }
    expect(isDayActive('2026-09-18', '2026-09', range)).toBe(true)
    expect(disabledReasonFor('2026-09-19', '2026-09', range)).toBe('setelah-magang')
    expect(groups).toHaveLength(1)
  })

  it('menangani lintas tahun', () => {
    const groups = buildMonthGroups('2026-12-01', '2027-01-31')
    expect(groups.map((g) => g.key)).toEqual(['2026-12', '2027-01'])
    // Minggu 28 Des 2026 - 2 Jan 2027 harus muncul di kedua grup.
    const desember = groups.find((g) => g.key === '2026-12')
    const januari = groups.find((g) => g.key === '2027-01')
    expect(desember?.weeks.some((w) => w.id === '2026-12-28')).toBe(true)
    expect(januari?.weeks.some((w) => w.id === '2026-12-28')).toBe(true)
  })

  it('setiap minggu selalu punya enam hari', () => {
    const groups = buildMonthGroups('2026-08-01', '2026-09-30')
    for (const group of groups) {
      for (const week of group.weeks) {
        expect(week.days).toHaveLength(6)
      }
    }
  })
})

describe('weekDates dan formatWeekRange', () => {
  it('menghasilkan enam tanggal', () => {
    expect(weekDates('2026-08-31')).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
    ])
  })

  it('memformat rentang minggu lintas bulan', () => {
    expect(formatWeekRange('2026-08-31')).toBe('31 Agu - 5 Sep')
    expect(formatWeekRange('2026-09-21')).toBe('21 Sep - 26 Sep')
  })
})

describe('pickInitialMonthKey', () => {
  const groups = buildMonthGroups('2026-08-01', '2026-12-31')

  it('memilih bulan yang memuat hari ini', () => {
    expect(pickInitialMonthKey(groups, '2026-10-05')).toBe('2026-10')
  })

  it('memilih bulan pertama bila hari ini di luar rentang, sebelum', () => {
    expect(pickInitialMonthKey(groups, '2026-01-01')).toBe('2026-08')
  })

  it('memilih bulan pertama bila hari ini di luar rentang, sesudah', () => {
    expect(pickInitialMonthKey(groups, '2030-01-01')).toBe('2026-08')
  })

  it('mengembalikan null untuk daftar kosong', () => {
    expect(pickInitialMonthKey([], '2026-10-05')).toBeNull()
  })

  it('hari ini di bulan tanpa grup (2026-09-20 Minggu) tetap cocok lewat kunci bulan', () => {
    expect(pickInitialMonthKey(groups, '2026-09-20')).toBe('2026-09')
  })
})

describe('pickInitialWeekId', () => {
  const groups = buildMonthGroups('2026-08-01', '2026-12-31')
  const september = groups.find((g) => g.key === '2026-09')

  /** September dijamin ada pada rentang di atas; gagal jelas bila tidak. */
  function septemberGroup() {
    if (!september) throw new Error('Grup bulan September 2026 tidak ditemukan')
    return september
  }

  it('memilih minggu yang memuat hari ini bila hari ini di bulan itu', () => {
    // 2026-09-21 adalah Senin minggu 21 Sep sampai 26 Sep.
    expect(pickInitialWeekId(septemberGroup(), '2026-09-23')).toBe('2026-09-21')
  })

  it('memilih minggu pertama bila hari ini bukan di bulan itu', () => {
    expect(pickInitialWeekId(septemberGroup(), '2026-10-05')).toBe(septemberGroup().weeks[0]?.id)
  })

  it('memilih minggu pertama bila hari ini akhir pekan dan tidak masuk minggu mana pun', () => {
    // 2026-09-20 adalah Minggu, di luar minggu kerja mana pun.
    expect(pickInitialWeekId(septemberGroup(), '2026-09-20')).toBe(septemberGroup().weeks[0]?.id)
  })

  it('mengembalikan null untuk bulan tanpa minggu', () => {
    const kosong = { key: '2026-09', label: 'September 2026', short: 'Sep', weeks: [] }
    expect(pickInitialWeekId(kosong, '2026-09-21')).toBeNull()
  })
})

describe('findWeek dan findMonthOfWeek', () => {
  const groups = buildMonthGroups('2026-08-01', '2026-09-30')

  it('menemukan minggu lintas bulan di kedua grup', () => {
    const week = findWeek(groups, '2026-08-31')
    expect(week?.startDate).toBe('2026-08-31')

    const months = groups.filter((g) => g.weeks.some((w) => w.id === '2026-08-31'))
    expect(months.map((m) => m.key)).toEqual(['2026-08', '2026-09'])
  })

  it('mengembalikan null untuk id yang tidak ada', () => {
    expect(findWeek(groups, '1999-01-04')).toBeNull()
    expect(findMonthOfWeek(groups, '1999-01-04')).toBeNull()
  })

  it('menemukan grup bulan dari sebuah minggu', () => {
    expect(findMonthOfWeek(groups, '2026-09-21')?.key).toBe('2026-09')
  })
})

describe('findWeekOfDate', () => {
  const groups = buildMonthGroups('2026-08-01', '2026-09-30')

  /** Mengambil grup bulan, melempar bila tidak ada, agar tipe sempit tanpa assertion. */
  function groupOf(key: string): MonthGroup {
    const found = groups.find((g) => g.key === key)
    if (!found) throw new Error(`Grup bulan ${key} tidak ditemukan`)
    return found
  }

  const agustus = groupOf('2026-08')
  const september = groupOf('2026-09')

  it('menemukan minggu dari tanggal biasa', () => {
    expect(findWeekOfDate(agustus, '2026-08-12')?.startDate).toBe('2026-08-10')
  })

  it('menemukan minggu lintas bulan dari tanggal milik bulan itu', () => {
    // 31 Agustus ada di minggu 31 Agu - 5 Sep, yang muncul di grup Agustus.
    expect(findWeekOfDate(agustus, '2026-08-31')?.startDate).toBe('2026-08-31')
    // 1 September ada di minggu yang SAMA, tetapi di grup September.
    expect(findWeekOfDate(september, '2026-09-01')?.startDate).toBe('2026-08-31')
  })

  it('mengembalikan null bila tanggal tidak ada di grup itu', () => {
    expect(findWeekOfDate(agustus, '2026-09-15')).toBeNull()
    expect(findWeekOfDate(september, '2026-08-12')).toBeNull()
  })
})

describe('disabledReasonText', () => {
  it('memberi teks untuk setiap alasan', () => {
    expect(disabledReasonText('sebelum-magang')).toBe('Sebelum magang')
    expect(disabledReasonText('setelah-magang')).toBe('Setelah magang')
    expect(disabledReasonText('bulan-lain')).toBe('Bulan lain')
  })
})

/*
 * Hari kerja (AGENTS.md bagian 11.7). Jumlah baris tabel dokumen mengikuti daftar ini,
 * jadi perubahan di sini harus selalu terasa sampai ke PDF, bukan hanya di editor.
 */
describe('sanitizeHariKerja', () => {
  it('bawaannya enam hari', () => {
    expect(sanitizeHariKerja(undefined)).toEqual(SENIN_SABTU)
    expect(sanitizeHariKerja(null)).toEqual(SENIN_SABTU)
  })

  it('mempertahankan daftar yang valid', () => {
    expect(sanitizeHariKerja(SENIN_JUMAT)).toEqual(SENIN_JUMAT)
  })

  it('mengurutkan ulang sesuai urutan Senin sampai Sabtu', () => {
    expect(sanitizeHariKerja(['jumat', 'senin', 'rabu'])).toEqual(['senin', 'rabu', 'jumat'])
  })

  it('membuang key yang tidak dikenal dan bukan string', () => {
    expect(sanitizeHariKerja(['senin', 'minggu', 42, null, 'jumat'])).toEqual(['senin', 'jumat'])
  })

  it('daftar kosong menjadi lengkap, karena tabel tidak boleh tanpa baris', () => {
    expect(sanitizeHariKerja([])).toEqual(SENIN_SABTU)
    expect(sanitizeHariKerja(['minggu'])).toEqual(SENIN_SABTU)
  })

  it('mengembalikan array baru, bukan referensi argumen', () => {
    const input: DayOfWeek[] = [...SENIN_SABTU]
    const hasil = sanitizeHariKerja(input)
    expect(hasil).not.toBe(input)
    expect(hasil).toEqual(input)
  })
})

describe('dayOfWeekKey menghormati hari kerja', () => {
  it('Sabtu tidak lagi dipetakan ketika dimatikan', () => {
    expect(dayOfWeekKey('2026-09-26', SENIN_JUMAT)).toBeNull()
    expect(dayOfWeekKey('2026-09-26', SENIN_SABTU)).toBe('sabtu')
  })

  it('hari kerja lain tetap dipetakan', () => {
    expect(dayOfWeekKey('2026-09-25', SENIN_JUMAT)).toBe('jumat')
  })

  it('Minggu tetap null bagaimanapun konfigurasinya', () => {
    expect(dayOfWeekKey('2026-09-27', SENIN_SABTU)).toBeNull()
    expect(dayOfWeekKey('2026-09-27', SENIN_JUMAT)).toBeNull()
  })
})

describe('buildWeekDays menghormati hari kerja', () => {
  it('lima baris untuk Senin sampai Jumat', () => {
    const days = buildWeekDays('2026-09-21', SENIN_JUMAT)
    expect(days.map((d) => d.date)).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
    ])
  })

  it('enam baris untuk Senin sampai Sabtu', () => {
    expect(buildWeekDays('2026-09-21', SENIN_SABTU)).toHaveLength(6)
  })

  it('baris tetap urut Senin lebih dulu walau daftar tidak terurut', () => {
    const days = buildWeekDays('2026-09-21', ['jumat', 'senin'])
    expect(days.map((d) => d.date)).toEqual(['2026-09-21', '2026-09-25'])
  })

  it('bawaannya tetap enam baris', () => {
    expect(buildWeekDays('2026-09-21')).toHaveLength(6)
  })
})

describe('weekDates menghormati hari kerja', () => {
  it('lima tanggal untuk Senin sampai Jumat', () => {
    expect(weekDates('2026-09-21', SENIN_JUMAT)).toHaveLength(5)
    expect(weekDates('2026-09-21', SENIN_JUMAT)).not.toContain('2026-09-26')
  })

  it('enam tanggal untuk Senin sampai Sabtu', () => {
    expect(weekDates('2026-09-21', SENIN_SABTU)).toHaveLength(6)
  })
})

describe('buildMonthGroups menghormati hari kerja', () => {
  it('minggu hanya punya lima baris tanpa Sabtu', () => {
    const bulan = buildMonthGroups('2026-09-01', '2026-09-30', 'id', SENIN_JUMAT)[0]
    const minggu = bulan?.weeks.find((w) => w.id === '2026-09-21')
    expect(minggu?.days).toHaveLength(5)
    expect(minggu?.days.map((d) => d.date)).not.toContain('2026-09-26')
  })

  /*
   * `endDate` tetap Sabtu walau Sabtu bukan hari kerja, karena itu konsep rentang
   * kalender. Kalau ikut jadi Jumat, hari Sabtu yang tidak punya baris akan terbawa
   * sebagai milik minggu yang salah.
   */
  it('endDate tetap Sabtu walau Sabtu bukan hari kerja', () => {
    const bulan = buildMonthGroups('2026-09-01', '2026-09-30', 'id', SENIN_JUMAT)[0]
    const minggu = bulan?.weeks.find((w) => w.id === '2026-09-21')
    expect(minggu?.endDate).toBe('2026-09-26')
  })

  /*
   * Hanya menghitung baris yang benar-benar milik bulan itu. Baris minggu di tepi
   * bulan milik bulan tetangga, jadi menghitung `days.length` mentah akan memasukkan
   * hari dari dua bulan dan angkanya jadi tidak bisa dibandingkan.
   */
  it('jumlah hari milik bulan ikut turun', () => {
    const hitung = (hariKerja: DayOfWeek[]) => {
      const bulan = buildMonthGroups('2026-09-01', '2026-09-30', 'id', hariKerja)[0]
      return (
        bulan?.weeks.flatMap((w) => w.days).filter((d) => d.date.startsWith('2026-09')).length ?? 0
      )
    }
    // September 2026 punya 26 hari Senin-Sabtu, jadi tanpa Sabtu jadi 22.
    expect(hitung(SENIN_SABTU)).toBe(26)
    expect(hitung(SENIN_JUMAT)).toBe(22)
  })

  /*
   * 1 Agustus 2026 adalah Sabtu dan 2 Agustus Minggu. Dengan Sabtu dimatikan, tidak ada
   * baris yang menyentuh awal Agustus, dan minggu pertama Agustus jadi 3 Agustus.
   */
  it('bulan tanpa hari kerja aktif tidak muncul sebagai bulan', () => {
    const bulan = buildMonthGroups('2026-08-01', '2026-08-02', 'id', SENIN_JUMAT)
    expect(bulan).toEqual([])
  })

  it('rentang yang sama tetap muncul begitu Sabtu dinyalakan', () => {
    const bulan = buildMonthGroups('2026-08-01', '2026-08-02', 'id', SENIN_SABTU)
    expect(bulan.map((m) => m.key)).toEqual(['2026-08'])
  })

  it('bawaannya tetap enam baris tanpa argumen hari kerja', () => {
    const bulan = buildMonthGroups('2026-09-21', '2026-09-26', 'id')
    expect(bulan[0]?.weeks[0]?.days).toHaveLength(6)
  })
})

describe('editableWeekDates menghormati hari kerja', () => {
  it('hanya menghitung baris yang benar-benar ada', () => {
    const bulan = buildMonthGroups('2026-09-01', '2026-09-30', 'id', SENIN_JUMAT)[0]
    const minggu = bulan?.weeks.find((w) => w.id === '2026-09-21') as WeekEntry
    const editable = editableWeekDates(minggu, '2026-09', {
      mulai: '2026-09-01',
      selesai: '2026-09-30',
    })
    expect(editable).toEqual(['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'])
  })
})
