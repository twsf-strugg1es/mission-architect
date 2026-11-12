import { CircleCheck, CircleX, ShieldQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { effectParts } from '@/components/missionText'
import { checkStatus, reservePct, type MissionContext, type MissionState, type ResolvedEvent } from '@/game/engine/mission'
import { useI18n } from '@/game/useI18n'
import type { GameEvent } from '@/game/types'

type Props = {
  event: GameEvent
  ctx: MissionContext
  state: MissionState
  /** set once the player has chosen: the card shows the outcome */
  resolved: ResolvedEvent | null
  onChoose: (choiceId: string) => void
  onContinue: () => void
}

/** An event pauses the flight and must be answered: Escape and outside clicks do nothing. */
export function EventCard({ event, ctx, state, resolved, onChoose, onContinue }: Props) {
  const i = useI18n()
  const { t, tx, n } = i
  const check = checkStatus(event.check, ctx, state)
  const chosen = resolved ? event.choices.find((c) => c.id === resolved.choiceId) : undefined
  const checkValue =
    event.check && 'stat' in event.check && check.value !== null
      ? t('sim.yours', { v: event.check.stat === 'fuelReservePct' ? t('unit.pct', { n: n(check.value, 1) }) : n(check.value, 2) })
      : t(check.passed ? 'sim.onBoard' : 'sim.notOnBoard')

  return (
    <Dialog open>
      <DialogContent showCloseButton={false} onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{tx(event.title)}</DialogTitle>
          <DialogDescription className="text-base text-ink-2">{tx(event.text)}</DialogDescription>
        </DialogHeader>

        <p className="flex flex-wrap gap-x-5 text-xs text-ink-3">
          <span>
            {t('sim.spare')}: <span className="font-mono">{t('unit.pct', { n: n(Math.max(0, reservePct(ctx, state)), 1) })}</span>
          </span>
          <span>
            {t('sim.safety')}: <span className="font-mono">{t('unit.pct', { n: n(Math.max(0, state.safety)) })}</span>
          </span>
        </p>

        {event.check && event.checkLabel && (
          <div className="border-t border-rule pt-3 text-sm">
            <p className="flex items-center gap-1.5 font-medium">
              <ShieldQuestion className="size-4 text-ink-3" aria-hidden />
              {t('sim.whatMatters')}
            </p>
            <p>{tx(event.checkLabel)}</p>
            <p className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium ${check.passed ? 'text-ok' : 'text-bad'}`}>
              {check.passed ? <CircleCheck className="size-4" aria-hidden /> : <CircleX className="size-4" aria-hidden />}
              <span>{checkValue}</span>
              <span>{t(check.passed ? 'sim.prepared' : 'sim.unprepared')}</span>
            </p>
          </div>
        )}

        {!resolved || !chosen ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('sim.choose')}</p>
            <div className="grid gap-2">
              {event.choices.map((c) => (
                <Button key={c.id} variant="outline" size="lg" className="h-auto justify-start py-3 text-left whitespace-normal" onClick={() => onChoose(c.id)}>
                  {tx(c.label)}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3" aria-live="polite">
            <p className="text-sm font-medium">{t('sim.outcome')}</p>
            <p>{tx(resolved.prepared && chosen.preparedOutcome ? chosen.preparedOutcome : chosen.outcome)}</p>
            <ul className="flex flex-wrap gap-2">
              {effectParts(resolved.effect, i).map((p) => (
                <li key={p} className="bg-paper-3 px-2 py-1 font-mono text-xs tabular-nums">
                  {p}
                </li>
              ))}
            </ul>
            <Button size="lg" className="w-full" onClick={onContinue} autoFocus>
              {t('sim.continue')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
