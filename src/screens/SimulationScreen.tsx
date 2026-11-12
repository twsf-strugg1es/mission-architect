import { useEffect, useMemo, useState } from 'react'
import { motion, useAnimationFrame, useReducedMotion } from 'motion/react'
import { CircleCheck, CircleX, FastForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BudgetBar } from '@/components/BudgetBar'
import { EventCard } from '@/components/EventCard'
import { logText } from '@/components/missionText'
import { byId, EVENTS, RULES } from '@/game/data'
import { beginLeg, createContext, endLeg, reservePct, resolveEvent, startMission, type MissionContext, type MissionState, type ResolvedEvent } from '@/game/engine/mission'
import { useGame } from '@/game/store/useGame'
import { useI18n } from '@/game/useI18n'
import { cn } from '@/lib/utils'

const EARTH = { x: 90, y: 200 }
const DEST = { x: 700, y: 95 }
const CTRL = { x: 380, y: -10 }
const DEST_STYLE: Record<string, { r: number; fill: string }> = {
  moon: { r: 16, fill: 'fill-moon' },
  mars: { r: 20, fill: 'fill-mars' },
  bennu: { r: 9, fill: 'fill-bennu' },
}

const bezier = (p: number) => ({
  x: (1 - p) ** 2 * EARTH.x + 2 * (1 - p) * p * CTRL.x + p ** 2 * DEST.x,
  y: (1 - p) ** 2 * EARTH.y + 2 * (1 - p) * p * CTRL.y + p ** 2 * DEST.y,
})

/** Where the craft is drawn for a leg and progress through it (0–1). */
function craftAt(ctx: MissionContext, leg: number, frac: number) {
  const id = ctx.legs[leg]?.id ?? 'return'
  if (id === 'launch') return bezier(0.06 * frac)
  if (id === 'transit') return bezier(0.06 + 0.86 * frac)
  if (id === 'arrival') return bezier(0.92 + 0.08 * frac)
  if (id === 'surface' || !ctx.returns) {
    const a = frac * Math.PI * 6
    return { x: DEST.x + Math.cos(a) * 30, y: DEST.y + Math.sin(a) * 30 }
  }
  return bezier(1 - frac)
}

export function SimulationScreen() {
  const i18n = useI18n()
  const { t, tx, n, money } = i18n
  const { build, difficultyId, windowId, seed, mission, setMission, finishMission } = useGame()
  const ctx = useMemo(() => createContext(build, difficultyId, windowId), [build, difficultyId, windowId])
  const reduceMotion = useReducedMotion()
  const starts = useMemo(() => ctx.legs.reduce<number[]>((acc, l, i) => [...acc, acc[i] + l.animSeconds], [0]), [ctx])
  const total = starts[starts.length - 1]

  const [elapsed, setElapsed] = useState(0)
  const [shownDay, setShownDay] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [card, setCard] = useState<{ planIndex: number; resolved: ResolvedEvent | null } | null>(null)

  useEffect(() => {
    if (!mission) setMission(startMission(ctx, seed))
  }, [mission, ctx, seed, setMission])

  /** Run the engine through every checkpoint (leg start, event, leg end) up to `target` seconds. Stops at events. */
  function advanceTo(target: number) {
    const current = useGame.getState().mission
    if (!current) return
    let m: MissionState = current
    // where the clock ends up: the target, an event (flight pauses), or the moment the mission ended
    let time = Math.min(target, total)
    while (m.status === 'flying') {
      const leg = m.legIndex
      const next = m.plan[m.resolved.length]
      const kind = !m.legStarted ? 'begin' : next && next.legIndex === leg ? 'event' : 'end'
      const at = kind === 'begin' ? starts[leg] : kind === 'event' ? starts[leg] + next.at * ctx.legs[leg].animSeconds : starts[leg + 1]
      if (at > target) break
      if (kind === 'event') {
        time = at
        setCard({ planIndex: m.resolved.length, resolved: null })
        break
      }
      m = kind === 'begin' ? beginLeg(ctx, m) : endLeg(ctx, m)
      if (m.status !== 'flying') time = at
    }
    // mission clock: day at the leg start plus progress through it; never runs backwards while flying
    const leg = Math.min(m.legIndex, ctx.legs.length - 1)
    const frac = Math.min(1, Math.max(0, (time - starts[leg]) / ctx.legs[leg].animSeconds))
    const day = m.status === 'flying' && m.legStarted ? m.day + frac * ctx.legs[leg].days : m.day
    setShownDay((prev) => (m.status === 'flying' ? Math.max(prev, day) : day))
    setElapsed(time)
    if (m !== current) setMission(m)
  }

  useAnimationFrame((_, delta) => {
    if (card || !mission || mission.status !== 'flying') return
    advanceTo(elapsed + (Math.min(delta, 100) / 1000) * speed)
  })

  if (!mission) return null

  const legIndex = Math.min(mission.legIndex, ctx.legs.length - 1)
  const leg = ctx.legs[legIndex]
  const rawFrac = mission.status === 'flying' ? Math.min(1, Math.max(0, (elapsed - starts[legIndex]) / leg.animSeconds)) : 1
  const frac = reduceMotion ? 0.5 : rawFrac
  const craft = craftAt(ctx, mission.status === 'complete' ? ctx.legs.length - 1 : legIndex, frac)
  const reserve = reservePct(ctx, mission)
  const fb = RULES.flightBars
  const dest = DEST_STYLE[ctx.destination.id] ?? DEST_STYLE.moon
  const over = mission.status !== 'flying'
  const pending = card ? byId(EVENTS, mission.plan[card.planIndex].eventId) : null

  return (
    <section aria-labelledby="screen-title" className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="screen-title" tabIndex={-1} className="max-w-none text-2xl font-medium outline-none sm:text-3xl">
            {t('sim.title')}: {tx(ctx.destination.name)}
          </h1>
          <p className="font-mono text-4xl tabular-nums" aria-live="off">
            {t('sim.day', { d: n(Math.floor(shownDay)) })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label={t('sim.speed')} className="flex border border-rule p-0.5">
            {[1, 2].map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={speed === s}
                onClick={() => setSpeed(s)}
                className={cn(
                  'relative min-h-8 px-3 text-sm transition-colors duration-(--dur-micro) after:absolute after:inset-x-0 after:-inset-y-1.5',
                  speed === s ? 'bg-signal text-signal-ink' : 'text-ink-3 hover:text-ink',
                )}
              >
                {t('unit.times', { n: n(s) })}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={() => advanceTo(Infinity)} disabled={over || Boolean(card)}>
            <FastForward aria-hidden data-icon="inline-start" />
            {t('sim.skip')}
          </Button>
        </div>
      </div>

      <ol className="grid grid-cols-5 gap-1 text-xs sm:text-sm">
        {ctx.legs.map((l, i) => (
          <li
            key={l.id}
            aria-current={i === legIndex && !over ? 'step' : undefined}
            className={cn(
              'border-t-2 pt-1.5',
              i < mission.legIndex || mission.status === 'complete' ? 'border-signal/60 text-ink-3' : 'border-rule text-ink-3',
              i === legIndex && !over && 'border-signal font-medium text-foreground',
            )}
          >
            {t(l.label)}
          </li>
        ))}
      </ol>

      <div className="overflow-hidden border border-rule bg-paper-3">
        <svg viewBox="0 0 800 260" role="img" aria-label={t('sim.trajectory', { dest: tx(ctx.destination.name) })} className="h-auto w-full">
          <path
            d={`M ${EARTH.x} ${EARTH.y} Q ${CTRL.x} ${CTRL.y} ${DEST.x} ${DEST.y}`}
            fill="none"
            className="stroke-ink-4"
            strokeWidth={2}
            strokeDasharray="6 8"
          />
          <circle cx={EARTH.x} cy={EARTH.y} r={26} className="fill-earth" />
          <circle cx={DEST.x} cy={DEST.y} r={dest.r} className={dest.fill} />
          {!ctx.returns && ctx.legs[legIndex]?.id === 'return' && !reduceMotion && (
            <path d={`M ${DEST.x - 20} ${DEST.y + 10} L ${EARTH.x + 30} ${EARTH.y - 10}`} className="stroke-ink-3" strokeWidth={1.5} strokeDasharray="3 9" />
          )}
          <motion.circle
            cx={craft.x}
            cy={craft.y}
            r={7}
            className={mission.status === 'failed' ? 'fill-bad' : 'fill-signal'}
          />
        </svg>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4 border border-rule bg-paper-2 p-4">
          <BudgetBar
            label={t('sim.fuel')}
            value={Math.max(0, mission.fuelPct)}
            max={100}
            valueText={t('unit.pct', { n: n(Math.max(0, mission.fuelPct), 1) })}
            status={reserve < 0 ? 'bad' : reserve < fb.reserveWarnPct ? 'warn' : 'ok'}
            statusText={`${t('fuel.title')}: ${t('status.margin', { x: t('unit.pct', { n: n(reserve, 1) }) })}`}
          />
          <BudgetBar
            label={t('sim.safety')}
            value={Math.max(0, mission.safety)}
            max={100}
            valueText={t('unit.pct', { n: n(Math.max(0, mission.safety)) })}
            status={mission.safety >= fb.safetyOk ? 'ok' : mission.safety >= fb.safetyWarn ? 'warn' : 'bad'}
            statusText={t(mission.safety >= fb.safetyOk ? 'status.ok' : 'status.tight')}
          />
          <dl className="grid grid-cols-2 gap-3 border-t border-rule pt-3">
            <div>
              <dt className="text-xs text-ink-3">{t('sim.science')}</dt>
              <dd className="font-mono text-2xl tabular-nums">{n(Math.max(0, mission.science), 1)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">{t('sim.budget')}</dt>
              <dd className="font-mono text-2xl tabular-nums">{money(mission.budgetLeft)}</dd>
            </div>
          </dl>
        </div>

        <div className=" border border-rule bg-paper-2 p-4">
          <h2 className="mb-2 text-sm font-medium">{t('sim.log')}</h2>
          <ol aria-live="polite" className="max-h-64 space-y-1.5 overflow-y-auto text-sm">
            {[...mission.log].reverse().map((e, k) => (
              <li key={mission.log.length - k} className="flex gap-2">
                <span className="w-16 shrink-0 text-xs text-ink-3 tabular-nums">{t('sim.day', { d: n(Math.floor(e.day)) })}</span>
                <span>{logText(e, ctx, i18n)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {over && (
        <div
          role="status"
          className={cn('flex flex-wrap items-center justify-between gap-3 border p-4', mission.status === 'complete' ? 'border-ok/50' : 'border-bad/50')}
        >
          <p className="flex items-center gap-2 text-lg font-medium">
            {mission.status === 'complete' ? <CircleCheck className="size-5 text-ok" aria-hidden /> : <CircleX className="size-5 text-bad" aria-hidden />}
            {t(mission.status === 'complete' ? 'sim.complete' : 'sim.lost')}
          </p>
          <Button size="lg" onClick={finishMission} autoFocus>
            {t('sim.toResults')}
          </Button>
        </div>
      )}

      {pending && card && (
        <EventCard
          event={pending}
          ctx={ctx}
          state={mission}
          resolved={card.resolved}
          onChoose={(choiceId) => {
            const m = resolveEvent(ctx, mission, card.planIndex, choiceId)
            setMission(m)
            setCard({ planIndex: card.planIndex, resolved: m.resolved[m.resolved.length - 1] })
          }}
          onContinue={() => setCard(null)}
        />
      )}
    </section>
  )
}
