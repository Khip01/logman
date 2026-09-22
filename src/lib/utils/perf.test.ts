import { beforeEach, describe, expect, it } from 'vitest'
import {
  bumpRender,
  getLongTaskSamples,
  getRenderCounts,
  LONG_TASK_LIMIT_MS,
  longTasksOverLimit,
  resetRenderCounts,
} from './perf'

describe('render counter', () => {
  beforeEach(() => {
    resetRenderCounts()
  })

  it('menambah hitungan per kunci', () => {
    bumpRender('2026-09-21')
    bumpRender('2026-09-21')
    bumpRender('2026-09-22')
    expect(getRenderCounts()).toEqual({ '2026-09-21': 2, '2026-09-22': 1 })
  })

  it('reset mengosongkan seluruh hitungan', () => {
    bumpRender('2026-09-21')
    resetRenderCounts()
    expect(getRenderCounts()).toEqual({})
  })

  it('getRenderCounts mengembalikan salinan, bukan referensi internal', () => {
    bumpRender('2026-09-21')
    const first = getRenderCounts()
    first['2026-09-21'] = 99
    expect(getRenderCounts()['2026-09-21']).toBe(1)
  })
})

describe('long task limit', () => {
  it('memakai ambang 50 ms sesuai bagian 13', () => {
    expect(LONG_TASK_LIMIT_MS).toBe(50)
  })

  it('menyaring sampel di atas ambang', () => {
    const samples = [
      { duration: 12, startTime: 0 },
      { duration: 51, startTime: 20 },
      { duration: 50, startTime: 80 },
      { duration: 120, startTime: 100 },
    ]
    expect(longTasksOverLimit(samples).map((s) => s.duration)).toEqual([51, 120])
  })

  it('getLongTaskSamples mengembalikan salinan', () => {
    const samples = getLongTaskSamples()
    samples.push({ duration: 1, startTime: 0 })
    expect(getLongTaskSamples()).not.toBe(samples)
  })
})
