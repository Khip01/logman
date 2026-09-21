import { MOTION_TIER_PROFILE } from '@/motion/tiers'
import { type ThemeId, useUiStore } from '@/stores/ui'

/**
 * Transisi tema (AGENTS.md bagian 10).
 *
 * Urutan: tema diterapkan di dalam callback View Transitions agar snapshot lama
 * masih memakai tema sebelumnya, lalu snapshot baru di-reveal melingkar dari titik
 * klik. Bila View Transitions tidak didukung, atau tier animasi `mati`, atau user
 * memakai `prefers-reduced-motion`, tema diterapkan langsung dan transisi warna
 * halus dari kelas `.theme-t` yang mengambil alih.
 *
 * CATATAN ATURAN PROPERTI (AGENTS.md bagian 8.2): reveal ini menganimasikan
 * `clip-path` pada pseudo-element `::view-transition-new(root)`, yaitu lapisan
 * snapshot compositor, bukan elemen DOM hidup. Ini pengecualian sempit yang
 * didokumentasikan, dan hanya berjalan saat tier mengizinkan.
 */

export interface RevealOrigin {
  x: number
  y: number
}

let inFlight = false

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Mengubah tema dengan animasi. Aman dipanggil berkali-kali; transisi yang sedang
 * berjalan membuat pemanggilan berikutnya memakai jalur langsung.
 */
export function setThemeAnimated(theme: ThemeId, origin?: RevealOrigin): void {
  const root = document.documentElement
  const profile = MOTION_TIER_PROFILE[useUiStore.getState().motion]

  const commit = () => {
    root.dataset.theme = theme
    useUiStore.setState({ theme })
  }

  const startViewTransition = document.startViewTransition?.bind(document)
  const canReveal =
    profile.revealDuration > 0 && !prefersReducedMotion() && !!startViewTransition && !inFlight

  if (!canReveal || !startViewTransition) {
    commit()
    return
  }

  const point = origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  inFlight = true
  root.classList.add('theme-transitioning')

  const transition = startViewTransition(commit)

  transition.ready
    .then(() => {
      const radius = Math.hypot(
        Math.max(point.x, window.innerWidth - point.x),
        Math.max(point.y, window.innerHeight - point.y),
      )
      root.animate(
        {
          clipPath: [
            `circle(0px at ${point.x}px ${point.y}px)`,
            `circle(${radius}px at ${point.x}px ${point.y}px)`,
          ],
        },
        {
          duration: profile.revealDuration * 1000,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
    .catch(() => undefined)

  transition.finished
    .catch(() => undefined)
    .finally(() => {
      root.classList.remove('theme-transitioning')
      inFlight = false
    })
}
