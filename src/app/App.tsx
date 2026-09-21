import { lazy, Suspense } from 'react'
import { useRoute } from '@/app/router'
import { useThemeEffect } from '@/app/useThemeEffect'
import { FeatureErrorBoundary } from '@/components/shared/FeatureErrorBoundary'
import { Shell } from '@/components/shared/Shell'
import { Spinner } from '@/components/ui/Spinner'
import { AppProviders } from '@/motion/AppProviders'

/**
 * Code splitting per route (AGENTS.md bagian 13). Halaman berat dan halaman dev
 * dimuat terpisah dari bundle awal. Shell dan primitif inti tetap di bundle awal
 * karena selalu terlihat.
 */
const LogbookPage = lazy(() =>
  import('@/features/logbook/LogbookPage').then((m) => ({ default: m.LogbookPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const DevComponentsPage = lazy(() =>
  import('../../dev/DevComponentsPage').then((m) => ({ default: m.DevComponentsPage })),
)
const DevMotionPage = lazy(() =>
  import('../../dev/DevMotionPage').then((m) => ({ default: m.DevMotionPage })),
)
const DevPerfPage = lazy(() =>
  import('../../dev/DevPerfPage').then((m) => ({ default: m.DevPerfPage })),
)

interface RouteDef {
  path: string
  breadcrumb: string[]
  element: React.ReactNode
}

const ROUTES: RouteDef[] = [
  { path: '/', breadcrumb: ['Log Book'], element: <LogbookPage /> },
  { path: '/settings', breadcrumb: ['Pengaturan'], element: <SettingsPage /> },
  { path: '/dev/components', breadcrumb: ['Dev', 'Komponen'], element: <DevComponentsPage /> },
  { path: '/dev/motion', breadcrumb: ['Dev', 'Motion'], element: <DevMotionPage /> },
  { path: '/dev/perf', breadcrumb: ['Dev', 'Performa'], element: <DevPerfPage /> },
]

function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-[17px] font-semibold text-text-primary">Halaman tidak ditemukan</h1>
    </div>
  )
}

function RouteFallback() {
  return (
    <div className="grid min-h-40 place-items-center">
      <Spinner />
    </div>
  )
}

export function App() {
  useThemeEffect()
  const path = useRoute()

  const match = ROUTES.find((route) => route.path === path)
  const breadcrumb = match?.breadcrumb ?? ['Tidak ditemukan']
  const element = match?.element ?? <NotFound />
  const boundaryName = match?.path ?? 'not-found'

  return (
    <AppProviders>
      <Shell activePath={match?.path ?? path} breadcrumb={breadcrumb}>
        <FeatureErrorBoundary key={boundaryName} name={boundaryName}>
          <Suspense fallback={<RouteFallback />}>{element}</Suspense>
        </FeatureErrorBoundary>
      </Shell>
    </AppProviders>
  )
}
