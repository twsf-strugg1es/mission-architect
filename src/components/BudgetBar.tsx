import { useId } from 'react'
import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BarStatus = 'ok' | 'warn' | 'bad'

const STATUS = {
  ok: { Icon: CircleCheck, fill: 'bg-ok', text: 'text-ok' },
  warn: { Icon: TriangleAlert, fill: 'bg-warn', text: 'text-warn' },
  bad: { Icon: CircleX, fill: 'bg-bad', text: 'text-bad' },
} as const

type Props = {
  label: string
  value: number
  max: number
  /** Visible numbers, e.g. "41.2 / 63.8 t". */
  valueText: string
  status: BarStatus
  /** Plain-language status, e.g. "Over by 3.1 t". Shown next to an icon, never colour alone. */
  statusText: string
  className?: string
}

/** Accessible budget bar: progressbar role with real values, a numeric label and a status icon + text. */
export function BudgetBar({ label, value, max, valueText, status, statusText, className }: Props) {
  const id = useId()
  const { Icon, fill, text } = STATUS[status]
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span id={id} className="text-sm font-medium">
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums">{valueText}</span>
      </div>
      <div
        role="progressbar"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(Math.max(value, 0), max)}
        aria-valuetext={`${valueText}. ${statusText}`}
        className="h-2.5 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn('h-full rounded-full transition-[width] duration-300', fill)} style={{ width: `${pct}%` }} />
      </div>
      <p className={cn('flex items-center gap-1.5 text-xs font-medium', text)}>
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {statusText}
      </p>
    </div>
  )
}
