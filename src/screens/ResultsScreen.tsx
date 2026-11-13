import { useMemo, useState } from 'react'
import { CircleCheck, CircleX, ClipboardCopy, Home, Info, PencilRuler, RotateCcw, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BudgetBar } from '@/components/BudgetBar'
import { debriefText, eventChoice, logText } from '@/components/missionText'
import { byId, DIFFICULTIES, RULES } from '@/game/data'
import { createContext } from '@/game/engine/mission'
import { buildDebrief, scoreMission, type Tone } from '@/game/engine/score'
import type { DictKey } from '@/game/i18n'
import { useGame } from '@/game/store/useGame'
import { useI18n } from '@/game/useI18n'
import { cn } from '@/lib/utils'

const TONE = {
  good: { Icon: CircleCheck, className: 'text-ok' },
  bad: { Icon: CircleX, className: 'text-bad' },
  info: { Icon: Info, className: 'text-signal' },
} satisfies Record<Tone, unknown>

export function ResultsScreen() {
  const i18n = useI18n()
  const { t, n, money } = i18n
  const { build, difficultyId, windowId, mission, newBest, flyAgain, go } = useGame()
  const ctx = useMemo(() => createContext(build, difficultyId, windowId), [build, difficultyId, windowId])
  const [copy, setCopy] = useState<'idle' | 'done' | 'failed'>('idle')
  if (!mission) return null

  const result = scoreMission(ctx, mission)
  const debrief = buildDebrief(ctx, mission, result)
  const fb = RULES.flightBars
  const failure = mission.failure ? t(mission.failure.reason === 'fuel' ? 'log.failFuel' : 'log.failSafety', { leg: t(ctx.legs[mission.failure.legIndex].label) }) : null

  const summary = [
    t('sum.header', { dest: ctx.destination.name, difficulty: byId(DIFFICULTIES, difficultyId).name }),
    t('sum.build', {
      vehicle: ctx.vehicle.name,
      engine: ctx.engine.name,
      mass: n(ctx.totals.totalMass, 1),
      cost: money(ctx.missionCost),
      window: ctx.window.name,
    }),
    t('sum.result', {
      grade: result.grade,
      score: n(result.score),
      science: n(result.science, 1),
      safety: n(Math.max(0, mission.safety)),
      fuel: n(Math.max(0, mission.fuelPct), 1),
    }),
    t('sum.events', {
      list: mission.resolved.map((r) => {
        const { event, choice } = eventChoice(r.eventId, r.choiceId)
        return `${event.title} (${choice.label})`
      }).join('; ') || '—',
    }),
    failure ?? '',
  ]
    .filter(Boolean)
    .join('\n')

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary)
      setCopy('done')
    } catch {
      setCopy('failed')
    }
  }

  return (
    <section aria-labelledby="screen-title" className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:py-8">
      <h1 id="screen-title" tabIndex={-1} className="max-w-none text-2xl font-medium outline-none sm:text-3xl">
        {t('res.title')}: {ctx.destination.name}
      </h1>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4 border border-rule bg-paper-2 p-5 text-center">
          <p className="text-sm text-ink-3">{t('res.grade')}</p>
          <p className={cn('text-8xl leading-none font-medium', result.grade === 'Fail' ? 'text-bad' : 'text-signal')} data-testid="grade">
            {result.grade}
          </p>
          <p className="text-2xl tabular-nums">
            {t('res.score')}: {t('res.scoreValue', { score: n(result.score) })}
          </p>
          {newBest && (
            <p className="flex items-center justify-center gap-1.5 font-medium text-ok">
              <Trophy className="size-4" aria-hidden />
              {t('res.newBest')}
            </p>
          )}
          {failure && <p className="font-medium text-bad">{t('res.failed', { reason: failure })}</p>}
        </div>

        <div className="space-y-4 border border-rule bg-paper-2 p-5">
          <h2 className="font-medium">{t('res.breakdown')}</h2>
          {result.parts.map((p) => {
            const ratio = p.max ? p.points / p.max : 0
            return (
              <BudgetBar
                key={p.key}
                label={t(`score.${p.key}` as DictKey)}
                value={p.points}
                max={p.max}
                valueText={t('res.points', { p: n(p.points), max: n(p.max) })}
                status={ratio >= fb.scoreOk ? 'ok' : ratio >= fb.scoreWarn ? 'warn' : 'bad'}
                statusText={t('unit.pct', { n: n(ratio * 100) })}
              />
            )
          })}
        </div>
      </div>

      <div className=" border border-rule bg-paper-2 p-5">
        <h2 className="mb-3 font-medium">{t('res.debrief')}</h2>
        <ul className="space-y-2.5">
          {debrief.map((d, k) => {
            const { Icon, className } = TONE[d.tone]
            return (
              <li key={k} className="flex gap-2.5">
                <Icon className={cn('mt-0.5 size-4 shrink-0', className)} aria-hidden />
                <span>{debriefText(d, ctx, i18n)}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={flyAgain}>
          <RotateCcw aria-hidden data-icon="inline-start" />
          {t('res.flyAgain')}
        </Button>
        <Button size="lg" variant="outline" onClick={() => go('builder')}>
          <PencilRuler aria-hidden data-icon="inline-start" />
          {t('res.changeDesign')}
        </Button>
        <Button size="lg" variant="outline" onClick={() => go('home')}>
          <Home aria-hidden data-icon="inline-start" />
          {t('res.home')}
        </Button>
        <Button size="lg" variant="outline" onClick={copySummary}>
          <ClipboardCopy aria-hidden data-icon="inline-start" />
          {t('res.copy')}
        </Button>
        <p role="status" className="self-center text-sm font-medium">
          {copy === 'done' && <span className="text-ok">{t('res.copied')}</span>}
          {copy === 'failed' && <span className="text-warn">{t('res.copyFailed')}</span>}
        </p>
      </div>
      {copy === 'failed' && (
        <textarea readOnly value={summary} rows={5} className="w-full border border-rule bg-card p-3 font-mono text-sm" aria-label={t('res.copy')} />
      )}

      <details className=" border border-rule bg-paper-2 p-5">
        <summary className="cursor-pointer font-medium">{t('res.log')}</summary>
        <ol className="mt-3 space-y-1.5 text-sm">
          {mission.log.map((e, k) => (
            <li key={k} className="flex gap-2">
              <span className="w-16 shrink-0 text-xs text-ink-3 tabular-nums">{t('sim.day', { d: n(Math.floor(e.day)) })}</span>
              <span>{logText(e, ctx, i18n)}</span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  )
}
