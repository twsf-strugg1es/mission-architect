// Score, grade and the debrief, computed once from the flown mission.
import { byId, ENGINES, EVENTS, RULES } from '../data'
import type { Effect, Grade } from '../types'
import { commsFactor } from './build'
import type { MissionContext, MissionState } from './mission'
import { propellantFor } from './physics'

export type ScorePart = { key: 'science' | 'safety' | 'budget' | 'deltaV' | 'events'; points: number; max: number }
export type ScoreResult = { score: number; grade: Grade; failed: boolean; parts: ScorePart[]; science: number }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export function scoreMission(ctx: MissionContext, s: MissionState): ScoreResult {
  const w = RULES.scoring
  const failed = s.status === 'failed'
  const science = Math.max(0, s.science)
  const margin = ctx.deltaV / ctx.requiredDeltaV - 1
  const survived = s.resolved.length - (s.failure?.atEvent ? 1 : 0)
  const exact: ScorePart[] = [
    { key: 'science', points: w.science * clamp01(science / ctx.destination.scienceTarget), max: w.science },
    { key: 'safety', points: w.safety * clamp01(s.safety / 100), max: w.safety },
    { key: 'budget', points: w.budget * clamp01(s.budgetLeft / ctx.budget), max: w.budget },
    { key: 'deltaV', points: w.deltaVMargin * clamp01(margin / w.deltaVMarginFull), max: w.deltaVMargin },
    { key: 'events', points: w.events * (s.plan.length ? clamp01(survived / s.plan.length) : 1), max: w.events },
  ]
  // Round each part so the breakdown on screen adds up to the score.
  const parts = exact.map((p) => ({ ...p, points: Math.round(p.points) }))
  const raw = parts.reduce((sum, p) => sum + p.points, 0)
  const score = failed ? Math.round(raw * w.failMultiplier) : raw
  const g = ctx.difficulty.gradeThresholds
  const grade: Grade = failed ? 'Fail' : score >= g.S ? 'S' : score >= g.A ? 'A' : score >= g.B ? 'B' : score >= g.C ? 'C' : 'Fail'
  return { score, grade, failed, parts, science }
}

export type Tone = 'good' | 'bad' | 'info'
export type DebriefItem =
  | { kind: 'fail'; tone: 'bad'; reason: 'fuel' | 'safety'; legIndex: number }
  | { kind: 'event'; tone: Tone; eventId: string; choiceId: string; prepared: boolean; effect: Effect }
  | { kind: 'margin'; tone: Tone; level: 'thin' | 'good' | 'excess'; pct: number }
  | { kind: 'engine'; tone: 'info'; engineId: string; prop: number; altEngineId: string; altProp: number }
  | { kind: 'window'; tone: 'info'; windowId: string; days: number; need: number }
  | { kind: 'science'; tone: Tone; earned: number; target: number }
  | { kind: 'comms'; tone: 'bad'; pct: number }
  | { kind: 'dose'; tone: 'bad'; x: number }
  | { kind: 'budget'; tone: 'info'; pct: number }

/** Plain-language lessons from this exact playthrough: the decisions that helped and the ones that hurt. */
export function buildDebrief(ctx: MissionContext, s: MissionState, result: ScoreResult): DebriefItem[] {
  const items: DebriefItem[] = []
  if (s.failure) items.push({ kind: 'fail', tone: 'bad', reason: s.failure.reason, legIndex: s.failure.legIndex })
  for (const r of s.resolved) {
    const event = byId(EVENTS, r.eventId)
    const tone: Tone = event.check ? (r.prepared ? 'good' : 'bad') : 'info'
    items.push({ kind: 'event', tone, ...r })
  }

  const margin = ctx.deltaV / ctx.requiredDeltaV - 1
  const level = margin < RULES.deltaVWarnMargin ? 'thin' : margin > RULES.debrief.marginExcess ? 'excess' : 'good'
  items.push({ kind: 'margin', tone: level === 'good' ? 'good' : level === 'thin' ? 'bad' : 'info', level, pct: margin * 100 })

  const alt = byId(ENGINES, ctx.engine.id === 'chemical' ? 'cryogenic' : 'chemical')
  const altDry = ctx.totals.dryMass - ctx.engine.massTonnes + alt.massTonnes
  items.push({
    kind: 'engine',
    tone: 'info',
    engineId: ctx.engine.id,
    prop: propellantFor(ctx.engine.ispSeconds, ctx.totals.dryMass, ctx.requiredDeltaV),
    altEngineId: alt.id,
    altProp: propellantFor(alt.ispSeconds, altDry, ctx.requiredDeltaV),
  })
  items.push({ kind: 'window', tone: 'info', windowId: ctx.window.id, days: ctx.legs[1].days, need: ctx.requiredDeltaV })

  const target = ctx.destination.scienceTarget
  items.push({ kind: 'science', tone: result.science >= target * RULES.debrief.scienceHigh ? 'good' : 'bad', earned: result.science, target })
  const cf = commsFactor(ctx.totals.comms)
  if (cf < 1 && ctx.surfaceScience > 0) items.push({ kind: 'comms', tone: 'bad', pct: cf * 100 })
  if (s.dose >= 1) items.push({ kind: 'dose', tone: 'bad', x: s.dose })
  items.push({ kind: 'budget', tone: 'info', pct: ((ctx.budget - s.budgetLeft) / ctx.budget) * 100 })
  return items
}
