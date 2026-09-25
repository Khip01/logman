import { lazy, Suspense, useEffect } from 'react'
import { navigate, useRoute } from '@/app/router'
import {
  useBootstrapData,
  useDeriveMonths,
  useDocPreferenceEffect,
  useFlushOnHidden,
  useUiPreferenceSync,
} from '@/app/useAppData'
import { useThemeEffect } from '@/app/useThemeEffect'
import { FeatureErrorBoundary } from '@/components/shared/FeatureErrorBoundary'
import { Shell } from '@/components/shared/Shell'
import { Spinner } from '@/components/ui/Spinner'
import { pageTitleFor } from '@/lib/domain/pageTitle'
import { LocaleContext, useT } from '@/lib/i18n'
import type { MessageKey } from '@/lib/i18n/messages/id'
import { AppProviders } from '@/motion/AppProviders'
import { useConfigStore } from '@/stores/config'

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
const ExportPage = lazy(() =>
  import('@/features/export/ExportPage').then((m) => ({ default: m.ExportPage })),
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
const DevSeedPage = lazy(() =>
  import('../../dev/DevSeedPage').then((m) => ({ default: m.DevSeedPage })),
)

interface RouteDef {
  path: string
  /** Key pesan breadcrumb, bukan teks siap pakai, agar ikut bahasa aktif. */
  breadcrumb: MessageKey[]
  element: React.ReactNode
}

const ROUTES: RouteDef[] = [
  { path: '/', breadcrumb: ['nav.logbook'], element: <LogbookPage /> },
  { path: '/settings', breadcrumb: ['nav.pengaturan'], element: <SettingsPage /> },
  { path: '/export', breadcrumb: ['nav.ekspor'], element: <ExportPage /> },
  {
    path: '/dev/components',
    breadcrumb: ['nav.dev', 'nav.dev.komponen'],
    element: <DevComponentsPage />,
  },
  { path: '/dev/motion', breadcrumb: ['nav.dev', 'nav.dev.motion'], element: <DevMotionPage /> },
  { path: '/dev/perf', breadcrumb: ['nav.dev', 'nav.dev.performa'], element: <DevPerfPage /> },
  { path: '/dev/seed', breadcrumb: ['nav.dev', 'nav.dev.seed'], element: <DevSeedPage /> },
]

function NotFound() {
  const t = useT()
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-[17px] font-semibold text-text-primary">{t('error.tidakDitemukan')}</h1>
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
  useBootstrapData()
  useUiPreferenceSync()
  useDeriveMonths()
  useDocPreferenceEffect()
  useFlushOnHidden()
  const path = useRoute()
  const configLoaded = useConfigStore((s) => s.loaded)
  const tampilkanDevUi = useConfigStore((s) => s.config.tampilkanDevUi)
  const bahasa = useConfigStore((s) => s.config.bahasa)

  // Judul tab dan atribut `lang` mengikuti halaman serta bahasa aktif (AGENTS.md bagian 21).
  useEffect(() => {
    document.title = pageTitleFor(path, bahasa)
    document.documentElement.lang = bahasa
  }, [path, bahasa])

  // Route pengembangan diblokir bila toggle dev mati (AGENTS.md bagian 11.4): URL
  // dikembalikan ke Log Book, dan selama transisi halaman Log Book yang ditampilkan.
  // Blokir HANYA setelah config termuat, supaya nilai default sementara tidak salah
  // mengalihkan halaman sebelum setelan sebenarnya terbaca.
  const blockedDev = configLoaded && path.startsWith('/dev') && !tampilkanDevUi

  useEffect(() => {
    if (blockedDev) navigate('/', { replace: true })
  }, [blockedDev])

  const match = blockedDev ? ROUTES[0] : ROUTES.find((route) => route.path === path)
  const element = match?.element ?? <NotFound />
  const boundaryName = match?.path ?? 'not-found'

  return (
    <LocaleContext.Provider value={bahasa}>
      <AppProviders>
        <Shell activePath={match?.path ?? path} breadcrumbKeys={match?.breadcrumb ?? null}>
          <FeatureErrorBoundary key={boundaryName} name={boundaryName}>
            <Suspense fallback={<RouteFallback />}>{element}</Suspense>
          </FeatureErrorBoundary>
        </Shell>
      </AppProviders>
    </LocaleContext.Provider>
  )
}
