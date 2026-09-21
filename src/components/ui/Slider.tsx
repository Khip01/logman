import * as SliderPrimitive from '@radix-ui/react-slider'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

/** Slider kustom untuk pengaturan angka (AGENTS.md bagian 10). */
export function Slider({
  className,
  'aria-label': ariaLabel,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      aria-label={ariaLabel}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="theme-t relative h-1 w-full grow overflow-hidden bg-border-base"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="theme-t absolute h-full bg-accent"
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        aria-label={ariaLabel}
        className={cn(
          'theme-t block size-3.5 shrink-0 border border-border-light bg-bg-body',
          'hover:border-border-focus focus-visible:outline-none',
        )}
      />
    </SliderPrimitive.Root>
  )
}
