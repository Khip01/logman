import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'

interface TopHeaderProps {
  breadcrumb: string[]
}

/**
 * Header atas berisi breadcrumb dan slot aksi. Tombol buka/tutup sidebar ada di
 * dalam Sidebar sendiri, supaya tidak pernah tertutup oleh drawer yang terbuka.
 */
export function TopHeader({ breadcrumb }: TopHeaderProps) {
  const t = useT()
  return (
    <header
      className={cn(
        'theme-t no-print z-30 flex shrink-0 items-center justify-between gap-4',
        'border-b border-border-base bg-bg-body px-4',
      )}
      style={{ height: 'var(--header-height)' }}
    >
      <nav aria-label={t('nav.breadcrumb')} className="flex min-w-0 items-center gap-2 text-[13px]">
        {breadcrumb.map((part, index) => {
          const isLast = index === breadcrumb.length - 1
          const trail = breadcrumb.slice(0, index + 1).join('/')
          return (
            <span key={trail} className="flex min-w-0 items-center gap-2">
              {index > 0 ? <span className="text-text-dim">/</span> : null}
              <span
                className={cn(
                  'truncate',
                  isLast ? 'font-semibold text-text-primary' : 'text-text-muted',
                )}
              >
                {part}
              </span>
            </span>
          )
        })}
      </nav>

      <div id="header-actions" className="flex shrink-0 items-center gap-2" />
    </header>
  )
}
