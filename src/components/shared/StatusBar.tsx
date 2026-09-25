import { AlertTriangle, Check, Circle, Loader2 } from 'lucide-react'
import { appVersion } from '@/lib/appVersion'
import { useLocale, useT } from '@/lib/i18n'
import type { MessageKey } from '@/lib/i18n/messages/id'
import { cn } from '@/lib/utils/cn'
import { type SaveState, useSaveStatusStore } from '@/stores/saveStatus'

/** Key pesan untuk tiap keadaan simpan, agar label ikut bahasa aktif. */
const LABEL_KEY: Record<SaveState, MessageKey> = {
  idle: 'status.siap',
  dirty: 'status.adaPerubahan',
  saving: 'status.menyimpan',
  saved: 'status.tersimpan',
  error: 'status.gagal',
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
  const t = useT()
  const locale = useLocale()
  const state = useSaveStatusStore((s) => s.state)
  const message = useSaveStatusStore((s) => s.message)
  const lastSavedAt = useSaveStatusStore((s) => s.lastSavedAt)

  const savedTime =
    lastSavedAt === null
      ? null
      : new Date(lastSavedAt).toLocaleTimeString(locale === 'id' ? 'id-ID' : 'en-GB', {
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
          {t(LABEL_KEY[state])}
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
        {savedTime ? <span>{t('status.tersimpanPada', { jam: savedTime })}</span> : null}
        <span className="flex items-center gap-1" data-testid="app-version">
          <Circle className="size-2" aria-hidden />
          {t('status.versi', { versi: appVersion() })}
        </span>
      </div>
    </footer>
  )
}
