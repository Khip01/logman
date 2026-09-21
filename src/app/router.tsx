import { useSyncExternalStore } from 'react'

/**
 * Router minimal berbasis History API. Tanpa dependency tambahan agar bundle kecil
 * dan mudah dipahami agen. Route halaman di-resolve di `src/app/App.tsx`.
 */

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  return () => window.removeEventListener('popstate', onChange)
}

function getSnapshot(): string {
  return window.location.pathname
}

function getServerSnapshot(): string {
  return '/'
}

export function useRoute(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function navigate(to: string, options?: { replace?: boolean }): void {
  const current = window.location.pathname
  if (to === current) return
  if (options?.replace) {
    window.history.replaceState(null, '', to)
  } else {
    window.history.pushState(null, '', to)
  }
  window.dispatchEvent(new PopStateEvent('popstate'))
}
