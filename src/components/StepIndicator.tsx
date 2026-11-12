import type { DictKey } from '@/game/i18n'
import { FLOW, type Screen } from '@/game/store/useGame'
import { useI18n } from '@/game/useI18n'
import { cn } from '@/lib/utils'

const LABELS: Record<Screen, DictKey> = {
  home: 'nav.home',
  destination: 'step.destination',
  vehicle: 'step.vehicle',
  builder: 'step.builder',
  launchWindow: 'step.window',
  simulation: 'step.flight',
  results: 'step.results',
}

export function StepIndicator({ current }: { current: Screen }) {
  const { t } = useI18n()
  const index = FLOW.indexOf(current)
  return (
    <nav aria-label={t('step.progress', { n: index + 1, total: FLOW.length })} className="mx-auto max-w-6xl px-4 pb-3">
      <p className="text-sm text-ink-3 sm:hidden">
        {t('step.progress', { n: index + 1, total: FLOW.length })}: <span className="text-foreground">{t(LABELS[current])}</span>
      </p>
      <ol className="hidden gap-1 sm:flex">
        {FLOW.map((s, i) => (
          <li
            key={s}
            aria-current={s === current ? 'step' : undefined}
            className={cn(
              'flex-1 border-t-2 pt-1.5 text-xs',
              i < index && 'border-signal/50 text-ink-3',
              i === index && 'border-signal font-medium text-ink',
              i > index && 'border-rule text-ink-3',
            )}
          >
            {t(LABELS[s])}
          </li>
        ))}
      </ol>
    </nav>
  )
}
