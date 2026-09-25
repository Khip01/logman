import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { SettingsSectionId } from '@/lib/domain/settingsSearch'

/**
 * Permintaan lompat ke seksi Pengaturan (AGENTS.md bagian 22).
 *
 * Kotak pencarian dan seksi tujuan adalah dua komponen bersaudara di dalam
 * `SettingsPage`, jadi keduanya cukup berbagi SATU konteks. Tidak perlu store global:
 * permintaan ini murni lokal pada satu halaman dan tidak dipakai halaman lain.
 *
 * Bentuknya sengaja meniru `focusRequest` pada store logbook (bagian 11.3): ada `token`
 * yang naik setiap permintaan, sehingga memilih saran yang SAMA dua kali tetap memutar
 * ulang kilau, bukan diabaikan karena nilainya tidak berubah.
 *
 * PENTING: permintaan TIDAK dibersihkan sendiri oleh provider. Sasaran (seksi tujuan)
 * yang membersihkannya setelah kilau selesai. Alasannya: kilau baru dimulai setelah gulir
 * mendarat, sehingga lama permintaan bergantung pada waktu gulir yang tidak diketahui
 * provider. Bila provider memakai batas waktu sendiri, kilau bisa terpotong di tengah.
 */

interface SettingsJumpRequest {
  sectionId: SettingsSectionId
  token: number
}

interface SettingsFlashContextValue {
  /** Permintaan aktif, null bila tidak ada. */
  request: SettingsJumpRequest | null
  /** Meminta lompatan ke sebuah seksi. Token naik otomatis. */
  jumpTo: (sectionId: SettingsSectionId) => void
  /** Membersihkan permintaan, hanya bila token-nya masih yang ini. */
  clear: (token: number) => void
}

const SettingsFlashContext = createContext<SettingsFlashContextValue | null>(null)

export function SettingsFlashProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<SettingsJumpRequest | null>(null)
  const tokenRef = useRef(0)

  const jumpTo = useCallback((sectionId: SettingsSectionId) => {
    tokenRef.current += 1
    setRequest({ sectionId, token: tokenRef.current })
  }, [])

  const clear = useCallback((token: number) => {
    setRequest((current) => (current?.token === token ? null : current))
  }, [])

  const value = useMemo(() => ({ request, jumpTo, clear }), [request, jumpTo, clear])

  return <SettingsFlashContext.Provider value={value}>{children}</SettingsFlashContext.Provider>
}

/** Mengambil pemicu lompatan. Dipakai kotak pencarian. */
export function useSettingsJump(): (sectionId: SettingsSectionId) => void {
  const context = useContext(SettingsFlashContext)
  if (!context) throw new Error('useSettingsJump harus dipakai di dalam SettingsFlashProvider')
  return context.jumpTo
}

/** Mengambil pengelola permintaan. Dipakai seksi tujuan. */
export function useSettingsFlashRequest(): {
  request: SettingsJumpRequest | null
  clear: (token: number) => void
} {
  const context = useContext(SettingsFlashContext)
  if (!context) throw new Error('useSettingsFlashRequest harus dipakai di SettingsFlashProvider')
  return { request: context.request, clear: context.clear }
}

/**
 * Membaca permintaan lompatan untuk sebuah seksi.
 *
 * Mengembalikan objek berisi `token`, atau null bila seksi ini bukan sasaran permintaan
 * yang sedang aktif.
 */
export function useSettingsFlashTarget(sectionId: SettingsSectionId): { token: number } | null {
  const context = useContext(SettingsFlashContext)
  if (!context) throw new Error('useSettingsFlashTarget harus dipakai di SettingsFlashProvider')
  if (context.request?.sectionId !== sectionId) return null
  return { token: context.request.token }
}
