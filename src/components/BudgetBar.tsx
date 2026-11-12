import { useId } from 'react'
import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import type { BarStatus } from '@/game/types'
import { cn } from '@/lib/utils'

const STATUS = {
  ok: { Icon: CircleCheck, fill: 'bg-ok', text: 'text-ok' },
  warn: { Icon: TriangleAlert, fill: 'bg-warn', text: 'text-warn' },
  bad: { Icon: CircleX, fill: 'bg-bad', text: 'text-bad' },
} as const

type Props = {
  label: string
  value: number
  max: number
  /** Visible numbers, e.g. "41.2 / 63.8". */
  valueText: string
  /** unit set after the figure at a smaller size, e.g. "t" */
  unit?: string
  status: BarStatus
  /** Plain-language status, e.g. "Over by 3.1 t". Shown next to an icon, never colour alone. */
  statusText: string
  /** bigger numbers for the builder's budget sheet */
  large?: boolean
  className?: string
}

/** Accessible budget bar: progressbar role with real values, a numeric label and a status icon + text. */
export function BudgetBar({ label, value, max, valueText, unit, status, statusText, large, className }: Props) {
  const id = useId()
  const { Icon, fill, text } = STATUS[status]
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className={cn('flex gap-x-3', large ? 'flex-col' : 'items-baseline justify-between')}>
        <span id={id} className="text-sm text-ink-2">
          {label}
        </span>
        <span className={cn('font-mono tabular-nums', large ? 'text-2xl' : 'text-sm')}>
          {valueText}
          {unit && <span className={cn('text-ink-3', large ? 'text-sm' : 'text-xs')}> {unit}</span>}
        </span>
      </div>
      <div
        role="progressbar"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(Math.max(value, 0), max)}
        aria-valuetext={`${valueText}${unit ? ` ${unit}` : ''}. ${statusText}`}
        className="relative h-2 overflow-hidden bg-paper-3"
      >
        <div
          className={cn('absolute inset-0 origin-left transition-transform duration-(--dur-short) ease-out', fill)}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
      <p className={cn('flex items-center gap-1.5 text-xs', text)}>
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {statusText}
      </p>
    </div>
  )
}
