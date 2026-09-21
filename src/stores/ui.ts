import { create } from 'zustand'

/**
 * Tema aplikasi. Daftar ini adalah sumber kebenaran untuk tipe dan UI pemilih tema.
 * Lihat AGENTS.md bagian 10.
 */
export const THEMES = [
  { id: 'hitam-pekat', label: 'Hitam Pekat', group: 'gelap' },
  { id: 'hitam-abu', label: 'Hitam Abu', group: 'gelap' },
  { id: 'hitam-pastel', label: 'Hitam Pastel', group: 'gelap' },
  { id: 'putih-bersih', label: 'Putih Bersih', group: 'terang' },
  { id: 'putih-pastel', label: 'Putih Pastel', group: 'terang' },
  { id: 'putih-tulang', label: 'Putih Tulang', group: 'terang' },
  { id: 'putih-gdocs', label: 'Putih Google Docs', group: 'terang' },
  { id: 'putih-word', label: 'Putih Word', group: 'terang' },
  { id: 'word-dark', label: 'Dark Word', group: 'gelap' },
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
