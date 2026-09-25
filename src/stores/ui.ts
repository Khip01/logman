import { create } from 'zustand'

/**
 * Tema aplikasi. Daftar ini adalah sumber kebenaran untuk tipe dan UI pemilih tema.
 * Lihat AGENTS.md bagian 10.
 */
export const THEMES = [
  { id: 'hitam-pekat', labelKey: 'tema.hitamPekat', group: 'gelap' },
  { id: 'hitam-abu', labelKey: 'tema.hitamAbu', group: 'gelap' },
  { id: 'hitam-pastel', labelKey: 'tema.hitamPastel', group: 'gelap' },
  { id: 'putih-bersih', labelKey: 'tema.putihBersih', group: 'terang' },
  { id: 'putih-pastel', labelKey: 'tema.putihPastel', group: 'terang' },
  { id: 'putih-tulang', labelKey: 'tema.putihTulang', group: 'terang' },
  { id: 'putih-gdocs', labelKey: 'tema.putihGDocs', group: 'terang' },
  { id: 'putih-word', labelKey: 'tema.putihWord', group: 'terang' },
  { id: 'word-dark', labelKey: 'tema.wordDark', group: 'gelap' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

/** Tier animasi, diatur manual di Settings. Default penuh. Lihat AGENTS.md bagian 8.1. */
export const MOTION_TIERS = ['penuh', 'seimbang', 'minimal', 'mati'] as const
export type MotionTier = (typeof MOTION_TIERS)[number]

const THEME_IDS = new Set<string>(THEMES.map((t) => t.id))

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEME_IDS.has(value)
}

export function isMotionTier(value: unknown): value is MotionTier {
  return typeof value === 'string' && (MOTION_TIERS as readonly string[]).includes(value)
}

interface UiState {
  sidebarCollapsed: boolean
  theme: ThemeId
  motion: MotionTier
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: ThemeId) => void
  setMotion: (motion: MotionTier) => void
}

export const useUiStore = create<UiState>((set) => ({
  // Drawer tertutup secara default; rail tetap tampil sebagai navigasi ringkas.
  sidebarCollapsed: true,
  theme: 'hitam-pekat',
  motion: 'penuh',
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
  setMotion: (motion) => set({ motion }),
}))
