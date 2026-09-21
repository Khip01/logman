import { useRoute } from '@/app/router'
import { useThemeEffect } from '@/app/useThemeEffect'
import { FeatureErrorBoundary } from '@/components/shared/FeatureErrorBoundary'
import { Shell } from '@/components/shared/Shell'
import { LogbookPage } from '@/features/logbook/LogbookPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { MotionProvider } from '@/motion/MotionProvider'
import { DevComponentsPage } from '../../dev/DevComponentsPage'
import { DevMotionPage } from '../../dev/DevMotionPage'
import { DevPerfPage } from '../../dev/DevPerfPage'

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

export function App() {
  useThemeEffect()
  const path = useRoute()

  const match = ROUTES.find((route) => route.path === path)
  const breadcrumb = match?.breadcrumb ?? ['Tidak ditemukan']
  const element = match?.element ?? <NotFound />
  const boundaryName = match?.path ?? 'not-found'

  return (
    <MotionProvider>
      <Shell activePath={match?.path ?? path} breadcrumb={breadcrumb}>
        <FeatureErrorBoundary key={boundaryName} name={boundaryName}>
          {element}
        </FeatureErrorBoundary>
      </Shell>
    </MotionProvider>
  )
}
