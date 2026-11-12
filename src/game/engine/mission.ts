// The flight: legs, event planning with a seeded RNG, and a step-by-step state machine.
// The UI calls beginLeg / resolveEvent / endLeg as the animation runs; simulateMission runs them all.
import { byId, EVENTS, MODULES, RULES } from '../data'
import type { DictKey } from '../i18n'
import type { Build, Choice, Effect, EventCheck, GameEvent, LaunchWindow, LegId } from '../types'
import { analyzeBuild, commsFactor, count, type BuildReport } from './build'

/** Seedable PRNG (mulberry32): the same seed always gives the same mission. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type PlannedLeg = { id: LegId; label: DictKey; days: number; deltaVShare: number; animSeconds: number }

export type MissionContext = BuildReport & {
  build: Build
  window: LaunchWindow
  crewed: boolean
  /** crewed or carrying samples: the last leg is a real return trip, otherwise a short report */
  returns: boolean
  legs: PlannedLeg[]
  /** science collected at the destination (before comms losses) */
  surfaceScience: number
  /** science that only counts when samples reach Earth */
  sampleScience: number
}

const LEG_LABELS: Record<LegId, DictKey> = {
  launch: 'leg.launch',
  transit: 'leg.transit',
  arrival: 'leg.arrival',
  surface: 'leg.surface',
  return: 'leg.return',
}

export function createContext(build: Build, difficultyId: string, windowId: string): MissionContext {
  const window = byId(RULES.launchWindows, windowId)
  const report = analyzeBuild(build, difficultyId, window)
  let surfaceScience = 0
  let sampleScience = 0
  for (const m of MODULES) {
    const n = count(build, m.id)
    if (m.returnsSamples) sampleScience += m.science * n
    else surfaceScience += m.science * n
  }
  const crewed = report.totals.crew > 0
  const returns = crewed || sampleScience > 0
  const transitDays = Math.round(report.destination.travelDays * window.travelTimeMultiplier * report.engine.travelTimeMultiplier)
  const days: Record<LegId, number> = {
    launch: RULES.launchDays,
    transit: transitDays,
    arrival: RULES.arrivalDays,
    surface: report.destination.surfaceDays,
    return: returns ? transitDays : RULES.reportDays,
  }
  const legs = RULES.legs.map((l) => {
    let label = LEG_LABELS[l.id]
    if (l.id === 'surface' && !report.destination.landing) label = 'leg.proximity'
    if (l.id === 'return' && !returns) label = 'leg.report'
    return { ...l, label, days: days[l.id] }
  })
  return { ...report, build, window, crewed, returns, legs, surfaceScience, sampleScience }
}

export type PlannedEvent = { eventId: string; legIndex: number; /** 0–1 position within the leg */ at: number }

function weightOf(e: GameEvent, ctx: MissionContext): number {
  const by =
    e.weightBy === 'radiationLevel'
      ? ctx.destination.radiationLevel
      : e.weightBy === 'dustStormRisk'
        ? ctx.destination.dustStormRisk
        : e.weightBy === 'launchRisk'
          ? (1 - ctx.vehicle.reliability) * RULES.launchRiskScale
          : 1
  return e.weight * by
}

function eventLegs(e: GameEvent, ctx: MissionContext): number[] {
  return ctx.legs.flatMap((l, i) => (e.condition.legs.includes(l.id) && (l.id !== 'return' || ctx.returns) ? [i] : []))
}

export function isEligible(e: GameEvent, ctx: MissionContext): boolean {
  const c = e.condition
  if (eventLegs(e, ctx).length === 0) return false
  if (c.destinations && !c.destinations.includes(ctx.destination.id)) return false
  if (c.crewed !== undefined && c.crewed !== ctx.crewed) return false
  if (c.landing !== undefined && c.landing !== ctx.destination.landing) return false
  if (c.engines && !c.engines.includes(ctx.engine.id)) return false
  if (c.missingModules?.some((id) => count(ctx.build, id) > 0)) return false
  return weightOf(e, ctx) > 0
}

/** Draw this mission's events: weighted sampling without replacement, then a leg and a moment for each. */
export function planMission(ctx: MissionContext, seed: number): PlannedEvent[] {
  const rng = createRng(seed)
  const [min, max] = ctx.difficulty.eventCount
  const n = min + Math.floor(rng() * (max - min + 1))
  const picked = EVENTS.filter((e) => isEligible(e, ctx))
    .map((e) => ({ e, key: rng() ** (1 / weightOf(e, ctx)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, n)
  const [lo, hi] = RULES.eventPosition
  return picked
    .map(({ e }) => {
      const legs = eventLegs(e, ctx)
      return { eventId: e.id, legIndex: legs[Math.floor(rng() * legs.length)], at: lo + rng() * (hi - lo) }
    })
    .sort((a, b) => a.legIndex - b.legIndex || a.at - b.at)
}

export type ResolvedEvent = { eventId: string; choiceId: string; prepared: boolean; effect: Effect }

export type LogEntry =
  | { type: 'launch'; day: number }
  | { type: 'burn'; day: number; legIndex: number; pct: number }
  | { type: 'dose'; day: number; legIndex: number; days: number; x: number }
  | { type: 'science'; day: number; x: number }
  | { type: 'samples'; day: number; x: number }
  | ({ type: 'event'; day: number } & ResolvedEvent)
  | { type: 'fail'; day: number; legIndex: number; reason: 'fuel' | 'safety' }
  | { type: 'complete'; day: number }

export type MissionState = {
  status: 'flying' | 'complete' | 'failed'
  legIndex: number
  /** the current leg's burn has happened */
  legStarted: boolean
  /** mission day at the start of the current leg, including event delays */
  day: number
  fuelPct: number
  safety: number
  science: number
  budgetLeft: number
  /** safety lost to deep-space radiation */
  dose: number
  plan: PlannedEvent[]
  resolved: ResolvedEvent[]
  log: LogEntry[]
  failure: { reason: 'fuel' | 'safety'; legIndex: number; atEvent: boolean } | null
}

const EPS = 1e-9

export function startMission(ctx: MissionContext, seed: number): MissionState {
  return {
    status: 'flying',
    legIndex: 0,
    legStarted: false,
    day: 0,
    fuelPct: 100,
    safety: 100,
    science: 0,
    budgetLeft: ctx.budget - ctx.missionCost,
    dose: 0,
    plan: planMission(ctx, seed),
    resolved: [],
    log: [],
    failure: null,
  }
}

function fail(s: MissionState, reason: 'fuel' | 'safety', atEvent: boolean): MissionState {
  return {
    ...s,
    status: 'failed',
    failure: { reason, legIndex: s.legIndex, atEvent },
    log: [...s.log, { type: 'fail', day: s.day, legIndex: s.legIndex, reason }],
  }
}

/** % of fuel the planned burns of a leg use. */
export function legBurnPct(ctx: MissionContext, legIndex: number): number {
  return ctx.deltaV > 0 ? ((ctx.requiredDeltaV * ctx.legs[legIndex].deltaVShare) / ctx.deltaV) * 100 : Infinity
}

/** Fuel beyond the burns still to come: the real spare. */
export function reservePct(ctx: MissionContext, s: MissionState): number {
  let future = 0
  for (let i = s.legStarted ? s.legIndex + 1 : s.legIndex; i < ctx.legs.length; i++) future += legBurnPct(ctx, i)
  return s.fuelPct - future
}

/** Start of a leg: the engine burn for it. */
export function beginLeg(ctx: MissionContext, s: MissionState): MissionState {
  const used = legBurnPct(ctx, s.legIndex)
  const log = [...s.log]
  if (s.legIndex === 0) log.push({ type: 'launch', day: s.day })
  if (used > 0) log.push({ type: 'burn', day: s.day, legIndex: s.legIndex, pct: used })
  const next = { ...s, legStarted: true, fuelPct: s.fuelPct - used, log }
  return next.fuelPct < -EPS ? fail(next, 'fuel', false) : next
}

export function checkStatus(check: EventCheck | null, ctx: MissionContext, s: MissionState): { value: number | null; passed: boolean } {
  if (!check) return { value: null, passed: false }
  if ('anyModule' in check) return { value: null, passed: check.anyModule.some((id) => count(ctx.build, id) > 0) }
  const t = ctx.totals
  const value =
    check.stat === 'protection'
      ? t.protectionTotal
      : check.stat === 'crewSupport'
        ? t.crewSupportTotal
        : check.stat === 'fuelReservePct'
          ? reservePct(ctx, s)
          : t.stormPowerKw - t.powerUsedKw
  return { value, passed: value >= check.atLeast }
}

/** The effect a choice will really have, given how the ship was built. */
export function effectFor(event: GameEvent, choice: Choice, ctx: MissionContext, s: MissionState): { effect: Effect; prepared: boolean } {
  const prepared = checkStatus(event.check, ctx, s).passed
  return { effect: prepared && choice.preparedEffect ? choice.preparedEffect : choice.effect, prepared }
}

export function resolveEvent(ctx: MissionContext, s: MissionState, planIndex: number, choiceId: string): MissionState {
  const event = byId(EVENTS, s.plan[planIndex].eventId)
  const choice = event.choices.find((c) => c.id === choiceId)
  if (!choice) throw new Error(`Unknown choice ${choiceId} for ${event.id}`)
  const { effect, prepared } = effectFor(event, choice, ctx, s)
  const resolved: ResolvedEvent = { eventId: event.id, choiceId, prepared, effect }
  const next: MissionState = {
    ...s,
    science: s.science + effect.scienceDelta,
    safety: Math.min(100, s.safety + effect.safetyDelta),
    fuelPct: s.fuelPct + effect.fuelDeltaPercent,
    budgetLeft: s.budgetLeft + effect.budgetDelta,
    day: Math.max(0, s.day + effect.timeDeltaDays),
    resolved: [...s.resolved, resolved],
    log: [...s.log, { type: 'event', day: s.day, ...resolved }],
  }
  if (next.fuelPct < -EPS) return fail(next, 'fuel', true)
  if (next.safety <= 0) return fail(next, 'safety', true)
  return next
}

/** End of a leg: deep-space radiation for crews, science at the destination, samples at home, the clock. */
export function endLeg(ctx: MissionContext, s: MissionState): MissionState {
  const leg = ctx.legs[s.legIndex]
  const day = s.day + leg.days
  const log = [...s.log]
  let { safety, science, dose } = s
  if (ctx.crewed && (leg.id === 'transit' || (leg.id === 'return' && ctx.returns))) {
    const shield = Math.min(ctx.totals.protectionTotal, RULES.protectionCap) / RULES.protectionCap
    const x = ctx.destination.radiationLevel * leg.days * RULES.radiationSafetyPerDay * (1 - shield)
    if (x > 0) {
      safety -= x
      dose += x
      log.push({ type: 'dose', day, legIndex: s.legIndex, days: leg.days, x })
    }
  }
  if (leg.id === 'surface' && ctx.surfaceScience > 0) {
    const x = ctx.surfaceScience * commsFactor(ctx.totals.comms)
    science += x
    log.push({ type: 'science', day, x })
  }
  if (leg.id === 'return' && ctx.returns && ctx.sampleScience > 0) {
    science += ctx.sampleScience
    log.push({ type: 'samples', day, x: ctx.sampleScience })
  }
  const next: MissionState = { ...s, safety, science, dose, log, day, legIndex: s.legIndex + 1, legStarted: false }
  if (safety <= 0) return fail({ ...next, legIndex: s.legIndex, day: s.day }, 'safety', false)
  if (next.legIndex >= ctx.legs.length) return { ...next, status: 'complete', log: [...log, { type: 'complete', day }] }
  return next
}

export type Chooser = (event: GameEvent, s: MissionState, ctx: MissionContext) => string
export const firstChoice: Chooser = (event) => event.choices[0].id

/** Fly the whole mission without a UI (tests, balance checks). Same seed + same choices = same result. */
export function simulateMission(ctx: MissionContext, seed: number, choose: Chooser = firstChoice): MissionState {
  let s = startMission(ctx, seed)
  for (let leg = 0; leg < ctx.legs.length && s.status === 'flying'; leg++) {
    s = beginLeg(ctx, s)
    for (let i = 0; i < s.plan.length && s.status === 'flying'; i++) {
      if (s.plan[i].legIndex !== leg) continue
      s = resolveEvent(ctx, s, i, choose(byId(EVENTS, s.plan[i].eventId), s, ctx))
    }
    if (s.status === 'flying') s = endLeg(ctx, s)
  }
  return s
}
