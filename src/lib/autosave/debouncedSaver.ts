/**
 * Mesin autosave debounced (AGENTS.md bagian 7).
 *
 * Perilaku:
 * - Perubahan digabung (merge) selama jendela debounce, lalu dikirim sekali.
 * - Optimistic: pemanggil sudah mengubah UI; mesin ini hanya menyimpan.
 * - Status dilaporkan lewat callback agar status bar bisa menampilkannya.
 * - Bila penyimpanan gagal, payload terakhir disimpan untuk dicoba lagi.
 *
 * Bagian ini murni terhadap waktu (timer disuntikkan lewat opsi), sehingga bisa diuji
 * dengan fake timer.
 */

export type SaverState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

export interface DebouncedSaverOptions<P> {
  /** Fungsi penyimpanan. Boleh melempar; akan ditangkap dan dilaporkan sebagai error. */
  save: (payload: P) => Promise<void>
  /** Jeda debounce dalam milidetik. Default 500 sesuai AGENTS.md bagian 7. */
  delayMs?: number
  /** Menggabungkan payload baru ke payload tertunda. Default: menimpa. */
  merge?: (pending: P, incoming: P) => P
  /** Dipanggil setiap status berubah. */
  onStateChange?: (state: SaverState, detail?: { message?: string }) => void
}

export interface DebouncedSaver<P> {
  /** Menjadwalkan penyimpanan. Payload digabung dengan yang masih tertunda. */
  schedule: (payload: P) => void
  /** Menyimpan sekarang tanpa menunggu debounce. */
  flush: () => Promise<void>
  /** Membatalkan jadwal yang tertunda tanpa menyimpan. */
  cancel: () => void
  /** Benar bila ada perubahan yang belum tersimpan. */
  hasPending: () => boolean
  /** Status terakhir. */
  getState: () => SaverState
}

export function createDebouncedSaver<P>(options: DebouncedSaverOptions<P>): DebouncedSaver<P> {
  const delayMs = options.delayMs ?? 500
  let pending: P | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let state: SaverState = 'idle'
  let inFlight: Promise<void> | null = null

  function setState(next: SaverState, detail?: { message?: string }): void {
    state = next
    options.onStateChange?.(next, detail)
  }

  function clearTimer(): void {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  async function run(): Promise<void> {
    if (pending === null) return
    const payload = pending
    pending = null
    setState('saving')
    try {
      await options.save(payload)
      setState('saved')
    } catch (error) {
      // Simpan kembali payload agar bisa dicoba lagi lewat flush berikutnya.
      if (pending === null) pending = payload
      setState('error', {
        message: error instanceof Error ? error.message : 'Penyimpanan gagal.',
      })
    }
  }

  function schedule(payload: P): void {
    pending = pending === null || !options.merge ? payload : options.merge(pending, payload)
    setState('dirty')
    clearTimer()
    timer = setTimeout(() => {
      timer = null
      inFlight = run().finally(() => {
        inFlight = null
      })
    }, delayMs)
  }

  async function flush(): Promise<void> {
    clearTimer()
    if (inFlight) await inFlight
    await run()
  }

  function cancel(): void {
    clearTimer()
    pending = null
    setState('idle')
  }

  return {
    schedule,
    flush,
    cancel,
    hasPending: () => pending !== null,
    getState: () => state,
  }
}
