import { Loader2 } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'

/**
 * Indikator memuat. Putaran memakai animasi bawaan Lucide (transform), sesuai
 * aturan properti (AGENTS.md bagian 8.2).
 */
export function Spinner({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  const t = useT()
  return (
    <span
      data-slot="spinner"
      role="status"
      aria-label={t('common.memuat')}
      className={cn('inline-flex text-text-muted', className)}
      {...props}
    >
      <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
    </span>
  )
}
