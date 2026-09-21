import { cn } from '@/lib/utils/cn'

/** Garis pembatas berulang untuk area kosong, seperti kertas bertitik. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn('flex flex-col items-center gap-3 px-6 py-16 text-center', className)}
    >
      {Icon ? <Icon className="size-7 text-text-dim" strokeWidth={1.5} /> : null}
      <h2 className="text-[15px] font-semibold text-text-primary">{title}</h2>
      {description ? (
        <p className="max-w-md text-[13px] leading-relaxed text-text-muted">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
