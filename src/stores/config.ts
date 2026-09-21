import { create } from 'zustand'
import { createDebouncedSaver } from '@/lib/autosave/debouncedSaver'
import { defaultConfig } from '@/lib/domain/schema'
import type { AppConfig } from '@/lib/domain/types'
import { log } from '@/lib/log'
import { getRepositories } from '@/lib/repo'
import { useSaveStatusStore } from '@/stores/saveStatus'
import { isMotionTier, isThemeId, useUiStore } from '@/stores/ui'

/**
 * Store konfigurasi dengan autosave (AGENTS.md bagian 7).
 *
 * Alur:
 * - `load()` mengambil konfigurasi dari server lalu menyinkronkan tema dan tier
 *   animasi ke store UI.
 * - `update()` mengubah state secara optimistic lalu menjadwalkan penyimpanan.
 * - Penyimpanan memakai mesin debounced yang sama dengan editor.
 */

interface ConfigState {
  config: AppConfig
  loaded: boolean
  loading: boolean
  error: string | null
  load: () => Promise<void>
  update: (patch: Partial<AppConfig>) => void
  /** Menyimpan segera tanpa menunggu debounce. */
  flush: () => Promise<void>
  reset: () => void
}

function syncUiFromConfig(config: AppConfig): void {
  const ui = useUiStore.getState()
  if (isThemeId(config.tema)) ui.setTheme(config.tema)
  if (isMotionTier(config.tierAnimasi)) ui.setMotion(config.tierAnimasi)
}

const saver = createDebouncedSaver<AppConfig>({
  delayMs: 500,
  save: async (config) => {
    const traceId = log.newTrace()
    const started = performance.now()
    try {
      await getRepositories().config.save(config)
      log.info('config.save', 'Konfigurasi tersimpan.', {
        traceId,
        durationMs: Math.round(performance.now() - started),
      })
    } catch (error) {
      log.error('config.save', 'Gagal menyimpan konfigurasi.', {
        traceId,
        data: { pesan: error instanceof Error ? error.message : String(error) },
      })
      throw error
    }
  },
  onStateChange: (state, detail) => {
    const status = useSaveStatusStore.getState()
    if (state === 'saved') status.markSaved()
    else if (state === 'error') status.markError(detail?.message ?? 'Gagal menyimpan konfigurasi.')
    else status.setState(state)
  },
})

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: defaultConfig(),
  loaded: false,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    const traceId = log.newTrace()
    try {
      const config = await getRepositories().config.load()
      syncUiFromConfig(config)
      set({ config, loaded: true, loading: false })
      log.info('config.load', 'Konfigurasi dimuat.', { traceId })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memuat konfigurasi.'
      set({ loading: false, error: message })
      log.error('config.load', message, { traceId })
    }
  },

  update: (patch) => {
    const next = { ...get().config, ...patch }
    set({ config: next })
    if (patch.tema && isThemeId(patch.tema)) useUiStore.getState().setTheme(patch.tema)
    if (patch.tierAnimasi && isMotionTier(patch.tierAnimasi)) {
      useUiStore.getState().setMotion(patch.tierAnimasi)
    }
    saver.schedule(next)
  },

  flush: async () => {
    await saver.flush()
  },

  reset: () => {
    const config = defaultConfig()
    set({ config })
    saver.schedule(config)
  },
}))
