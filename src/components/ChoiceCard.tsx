import type { ReactNode } from 'react'
import { CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  selected: boolean
  onSelect: () => void
  /** visible "Selected" text, so the state is never colour alone */
  selectedLabel: string
  disabled?: boolean
  className?: string
  children: ReactNode
}

/** A whole card that is one button: Tab to it, Enter or Space to choose it. Square, parted by hairlines. */
export function ChoiceCard({ selected, onSelect, selectedLabel, disabled, className, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'relative flex h-full w-full min-w-0 flex-col gap-3 border p-4 text-left transition-colors duration-(--dur-micro)',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected ? 'border-signal bg-signal-soft' : 'border-rule bg-paper-2 hover:border-ink-4',
        className,
      )}
    >
      {children}
      {/* after the content, so the card's accessible name starts with its title; aria-pressed carries the state */}
      {selected && (
        <span className="absolute top-3 right-3 flex items-center gap-1 text-xs text-signal">
          <CircleCheck className="size-4" aria-hidden />
          {selectedLabel}
        </span>
      )}
    </button>
  )
}
