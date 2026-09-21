import { m } from 'motion/react'
import { useId } from 'react'
import { cn } from '@/lib/utils/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onValueChange: (value: T) => void
  className?: string
  /** Ukuran kontrol. */
  size?: 'sm' | 'md'
  'aria-label'?: string
}

/**
 * Segmented control kustom dengan indikator geser memakai shared layout Motion.
 * Perpindahan memakai `transform` lewat layout animation (AGENTS.md bagian 8.2).
 * Indikator hanya tampil bila tier animasi mengizinkan; kontrol tetap berfungsi
 * tanpa Motion.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  className,
  size = 'md',
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  const groupId = useId()
  const height = size === 'sm' ? 'h-7 text-[12px]' : 'h-9 text-[13px]'

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('theme-t inline-flex border border-border-base bg-bg-input p-0.5', className)}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          // biome-ignore lint/a11y/useSemanticElements: role radio dipakai sengaja untuk kontrol segmented kustom
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'theme-t relative px-3.5 font-medium',
              height,
              isActive ? 'text-accent-text' : 'text-text-muted hover:text-text-primary',
            )}
          >
            {isActive ? (
              <m.span
                layoutId={`segmented-indicator-${groupId}`}
                transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.6 }}
                className="absolute inset-0 bg-accent"
                aria-hidden
              />
            ) : null}
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
