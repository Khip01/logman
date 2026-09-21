import { AlertTriangle, Check, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { type SaveState, useSaveStatusStore } from '@/stores/saveStatus'

const LABEL: Record<SaveState, string> = {
  idle: 'Siap',
  dirty: 'Ada perubahan',
  saving: 'Menyimpan',
  saved: 'Tersimpan',
  error: 'Gagal menyimpan',
}

const DOT_CLASS: Record<SaveState, string> = {
  idle: 'bg-status-idle',
  dirty: 'bg-status-warn',
  saving: 'bg-status-warn',
  saved: 'bg-status-ok',
  error: 'bg-status-error',
}

/**
 * Status bar sticky di bawah, mengikuti pola status bar editor.
 * Lihat AGENTS.md bagian 7.
 */
export function StatusBar() {
  const state = useSaveStatusStore((s) => s.state)
  const message = useSaveStatusStore((s) => s.message)
  const lastSavedAt = useSaveStatusStore((s) => s.lastSavedAt)

  const savedTime =
    lastSavedAt === null
      ? null
      : new Date(lastSavedAt).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })

  return (
    <footer
      className={cn(
        'theme-t no-print z-40 flex shrink-0 items-center justify-between gap-4',
        'border-t border-border-base bg-bg-sidebar px-3 text-[11px] text-text-muted',
      )}
      style={{ height: 'var(--statusbar-height)' }}
    >
      <div className="flex items-center gap-2">
        <span className={cn('size-1.5 shrink-0', DOT_CLASS[state])} aria-hidden />
        <span data-testid="save-status" className="text-text-main">
          {LABEL[state]}
        </span>
        {state === 'saving' ? (
          <Loader2 className="size-3 animate-spin text-status-warn-text" aria-hidden />
        ) : null}
        {state === 'saved' ? <Check className="size-3 text-status-ok-text" aria-hidden /> : null}
        {state === 'error' ? (
          <AlertTriangle className="size-3 text-status-error-text" aria-hidden />
        ) : null}
        {message ? <span className="text-text-dim">{message}</span> : null}
      </div>

      <div className="flex items-center gap-3 text-text-dim">
        {savedTime ? <span>Tersimpan {savedTime}</span> : null}
        <span className="flex items-center gap-1">
          <Circle className="size-2" aria-hidden />
          logman
        </span>
      </div>
    </footer>
  )
}
