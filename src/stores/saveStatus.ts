import { create } from 'zustand'

/**
 * Status penyimpanan yang ditampilkan di status bar sticky (AGENTS.md bagian 7).
 */
export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface SaveStatusState {
  state: SaveState
  lastSavedAt: number | null
  message: string | null
  setState: (state: SaveState, message?: string | null) => void
  markSaved: () => void
  markError: (message: string) => void
}

export const useSaveStatusStore = create<SaveStatusState>((set) => ({
  state: 'idle',
  lastSavedAt: null,
  message: null,
  setState: (state, message = null) => set({ state, message }),
  markSaved: () => set({ state: 'saved', lastSavedAt: Date.now(), message: null }),
  markError: (message) => set({ state: 'error', message }),
}))
