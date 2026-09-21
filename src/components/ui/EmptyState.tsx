import { createElement } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Tampilan saat data kosong. Level judul dapat diatur agar halaman tetap punya
 * struktur heading yang benar (h1 untuk tingkat halaman).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  headingLevel = 2,
  className,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  description?: string
  action?: React.ReactNode
  headingLevel?: 1 | 2 | 3
  className?: string
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn('flex flex-col items-center gap-3 px-6 py-16 text-center', className)}
    >
      {Icon ? <Icon className="size-7 text-text-dim" strokeWidth={1.5} /> : null}
      {createElement(
        `h${headingLevel}`,
        { className: 'text-[15px] font-semibold text-text-primary' },
        title,
      )}
      {description ? (
        <p className="max-w-md text-[13px] leading-relaxed text-text-muted">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
