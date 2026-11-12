// Engine log entries, effects and debrief items -> plain language in the current locale.
import { byId, ENGINES, EVENTS, RULES } from '@/game/data'
import type { LogEntry, MissionContext } from '@/game/engine/mission'
import type { DebriefItem } from '@/game/engine/score'
import type { Effect } from '@/game/types'
import type { useI18n } from '@/game/useI18n'

type I18n = ReturnType<typeof useI18n>

const signed = (i: I18n, v: number, digits = 0) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${i.n(Math.abs(v), digits)}`

export function effectParts(effect: Effect, i: I18n): string[] {
  const parts: string[] = []
  if (effect.scienceDelta) parts.push(i.t('eff.science', { v: signed(i, effect.scienceDelta) }))
  if (effect.safetyDelta) parts.push(i.t('eff.safety', { v: signed(i, effect.safetyDelta) }))
  if (effect.fuelDeltaPercent) parts.push(i.t('eff.fuel', { v: signed(i, effect.fuelDeltaPercent) }))
  if (effect.budgetDelta) parts.push(i.t('eff.budget', { v: `${effect.budgetDelta > 0 ? '+' : '−'}${i.money(Math.abs(effect.budgetDelta))}` }))
  if (effect.timeDeltaDays) parts.push(i.t('eff.time', { v: signed(i, effect.timeDeltaDays) }))
  return parts.length ? parts : [i.t('eff.none')]
}

export function eventChoice(eventId: string, choiceId: string) {
  const event = byId(EVENTS, eventId)
  return { event, choice: byId(event.choices, choiceId) }
}

export function logText(e: LogEntry, ctx: MissionContext, i: I18n): string {
  const leg = (index: number) => i.t(ctx.legs[index].label)
  switch (e.type) {
    case 'launch':
      return i.t('log.launch', { vehicle: ctx.vehicle.name })
    case 'burn':
      return i.t('log.burn', { leg: leg(e.legIndex), pct: i.n(e.pct, 1) })
    case 'dose':
      return i.t('log.dose', { leg: leg(e.legIndex), days: i.n(e.days), x: i.n(e.x, 1) })
    case 'science':
      return i.t('log.science', { x: i.n(e.x, 1) })
    case 'samples':
      return i.t('log.samples', { x: i.n(e.x, 1) })
    case 'event': {
      const { event, choice } = eventChoice(e.eventId, e.choiceId)
      return `${i.t('log.event', { title: i.tx(event.title), choice: i.tx(choice.label) })} ${effectParts(e.effect, i).join(', ')}`
    }
    case 'fail':
      return i.t(e.reason === 'fuel' ? 'log.failFuel' : 'log.failSafety', { leg: leg(e.legIndex) })
    case 'complete':
      return i.t('log.complete', { d: i.n(e.day) })
  }
}

export function debriefText(d: DebriefItem, ctx: MissionContext, i: I18n): string {
  switch (d.kind) {
    case 'fail':
      return i.t(d.reason === 'fuel' ? 'deb.failFuel' : 'deb.failSafety', { leg: i.t(ctx.legs[d.legIndex].label) })
    case 'event': {
      const { event, choice } = eventChoice(d.eventId, d.choiceId)
      const lesson = d.prepared && event.debriefPrepared ? event.debriefPrepared : event.debriefUnprepared
      return `${i.tx(event.title)} (${i.tx(choice.label)}): ${i.tx(lesson)} ${effectParts(d.effect, i).join(', ')}.`
    }
    case 'margin':
      return i.t(d.level === 'thin' ? 'deb.marginThin' : d.level === 'excess' ? 'deb.marginExcess' : 'deb.marginGood', { pct: i.n(d.pct, 1) })
    case 'engine': {
      const engine = byId(ENGINES, d.engineId)
      const alt = byId(ENGINES, d.altEngineId)
      return i.t('deb.engine', {
        engine: i.tx(engine.name),
        isp: i.n(engine.ispSeconds),
        prop: i.n(d.prop, 1),
        alt: i.tx(alt.name),
        altIsp: i.n(alt.ispSeconds),
        altProp: i.n(d.altProp, 1),
      })
    }
    case 'window':
      return i.t('deb.window', { window: i.tx(byId(RULES.launchWindows, d.windowId).name), days: i.n(d.days), need: i.n(d.need, 2) })
    case 'science':
      return i.t(d.tone === 'good' ? 'deb.scienceHigh' : 'deb.scienceLow', { earned: i.n(d.earned, 1), target: i.n(d.target) })
    case 'comms':
      return i.t('deb.comms', { pct: i.n(d.pct) })
    case 'dose':
      return i.t('deb.dose', { x: i.n(d.x, 1) })
    case 'budget':
      return i.t('deb.budget', { pct: i.n(d.pct) })
  }
}
