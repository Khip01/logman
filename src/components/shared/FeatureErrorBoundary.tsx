import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Nama fitur, dipakai di pesan error. */
  name: string
}

interface State {
  error: Error | null
}

/**
 * Error boundary per fitur (AGENTS.md bagian 15). Satu fitur gagal tidak mematikan
 * aplikasi, dan stack lengkap ditampilkan agar agen bisa membacanya.
 */
export class FeatureErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log ke console agar terbaca agen saat menjalankan dev atau test.
    console.error(`[logman] fitur "${this.props.name}" gagal`, error, info.componentStack)
  }

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="m-6 border border-status-error bg-bg-card p-4">
        <h2 className="mb-2 text-[13px] font-semibold text-status-error">
          Fitur "{this.props.name}" gagal dimuat
        </h2>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all text-[11px] text-text-muted">
          {error.message}
          {error.stack ? `\n\n${error.stack}` : ''}
        </pre>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="theme-t mt-3 border border-border-base px-3 py-1.5 text-[12px] text-text-main hover:bg-bg-card-hover"
        >
          Coba lagi
        </button>
      </div>
    )
  }
}
