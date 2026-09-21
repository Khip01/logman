import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedSaver, type SaverState } from './debouncedSaver'

describe('createDebouncedSaver', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('menyimpan setelah jeda debounce', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const saver = createDebouncedSaver<{ v: number }>({ save, delayMs: 500 })

    saver.schedule({ v: 1 })
    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ v: 1 })
  })

  it('menggabungkan beberapa jadwal menjadi satu penyimpanan', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const saver = createDebouncedSaver<{ a?: number; b?: number }>({
      save,
      delayMs: 500,
      merge: (pending, incoming) => ({ ...pending, ...incoming }),
    })

    saver.schedule({ a: 1 })
    saver.schedule({ b: 2 })
    saver.schedule({ a: 3 })

    await vi.advanceTimersByTimeAsync(500)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ a: 3, b: 2 })
  })

  it('menunda ulang saat ada perubahan baru', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const saver = createDebouncedSaver<{ v: number }>({ save, delayMs: 500 })

    saver.schedule({ v: 1 })
    await vi.advanceTimersByTimeAsync(400)
    saver.schedule({ v: 2 })
    await vi.advanceTimersByTimeAsync(400)
    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(200)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ v: 2 })
  })

  it('melaporkan urutan status yang benar', async () => {
    const states: SaverState[] = []
    const save = vi.fn().mockResolvedValue(undefined)
    const saver = createDebouncedSaver<{ v: number }>({
      save,
      delayMs: 500,
      onStateChange: (state) => states.push(state),
    })

    saver.schedule({ v: 1 })
    await vi.advanceTimersByTimeAsync(500)
    expect(states).toEqual(['dirty', 'saving', 'saved'])
  })

  it('melaporkan error dan menyimpan payload untuk dicoba lagi', async () => {
    const states: SaverState[] = []
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error('jaringan putus'))
      .mockResolvedValue(undefined)
    const saver = createDebouncedSaver<{ v: number }>({
      save,
      delayMs: 500,
      onStateChange: (state) => states.push(state),
    })

    saver.schedule({ v: 1 })
    await vi.advanceTimersByTimeAsync(500)
    expect(states).toEqual(['dirty', 'saving', 'error'])
    expect(saver.hasPending()).toBe(true)

    // Percobaan kedua lewat flush harus mengirim payload yang sama.
    await saver.flush()
    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith({ v: 1 })
    expect(saver.hasPending()).toBe(false)
  })

  it('flush menyimpan langsung tanpa menunggu debounce', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const saver = createDebouncedSaver<{ v: number }>({ save, delayMs: 500 })

    saver.schedule({ v: 1 })
    await saver.flush()
    expect(save).toHaveBeenCalledTimes(1)

    // Timer tidak boleh menyimpan dua kali.
    await vi.advanceTimersByTimeAsync(1000)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('cancel membatalkan tanpa menyimpan', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const saver = createDebouncedSaver<{ v: number }>({ save, delayMs: 500 })

    saver.schedule({ v: 1 })
    saver.cancel()
    await vi.advanceTimersByTimeAsync(1000)
    expect(save).not.toHaveBeenCalled()
    expect(saver.hasPending()).toBe(false)
    expect(saver.getState()).toBe('idle')
  })

  it('flush tanpa perubahan tidak memanggil save', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const saver = createDebouncedSaver<{ v: number }>({ save, delayMs: 500 })
    await saver.flush()
    expect(save).not.toHaveBeenCalled()
  })
})
