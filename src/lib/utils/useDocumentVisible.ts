import { useEffect, useState } from 'react'

/**
 * Memantau apakah tab sedang aktif. Dipakai untuk mem-pause animasi idle saat
 * tab tidak terlihat (AGENTS.md bagian 8.2).
 */
export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden,
  )

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return visible
}
