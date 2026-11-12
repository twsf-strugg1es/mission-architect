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

/** A whole card that is one button: Tab to it, Enter or Space to choose it. */
export function ChoiceCard({ selected, onSelect, selectedLabel, disabled, className, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'group relative flex h-full w-full flex-col gap-3 rounded-xl border bg-card/80 p-4 text-left transition-colors',
        'hover:border-signal focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-signal',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected ? 'border-signal bg-signal-soft' : 'border-border',
        className,
      )}
    >
      {selected && (
        <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium text-signal">
          <CircleCheck className="size-4" aria-hidden />
          {selectedLabel}
        </span>
      )}
      {children}
    </button>
  )
}
