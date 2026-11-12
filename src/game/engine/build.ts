// Everything about a build before launch: totals, budgets, bar states, problems and warnings.
import { byId, DESTINATIONS, DIFFICULTIES, ENGINES, MODULES, RULES, VEHICLES } from '../data'
import type { BarStatus, Build, Destination, Difficulty, Engine, LaunchWindow, Vehicle } from '../types'
import { computeDeltaV } from './physics'

export type Totals = {
  /** modules + engine + dry structure, tonnes */
  dryMass: number
  /** dry mass + propellant */
  totalMass: number
  /** spacecraft cost: modules + engine ($M); the rocket is added in missionCost */
  totalCost: number
  /** solar scaled by the destination's sunlight, plus RTGs (kW) */
  powerGeneratedKw: number
  powerUsedKw: number
  /** what is left in a dust storm: steady sources + batteries + a fraction of solar */
  stormPowerKw: number
  scienceTotal: number
  protectionTotal: number
  crewSupportTotal: number
  /** best comms module, 0–10 */
  comms: number
  crew: number
  commandModules: number
}

export function count(build: Build, moduleId: string): number {
  return build.modules[moduleId] ?? 0
}

export function computeTotals(build: Build, destination: Destination, engine: Engine): Totals {
  const t: Totals = {
    dryMass: engine.massTonnes + RULES.dryStructureTonnes,
    totalMass: 0,
    totalCost: engine.costUSDm,
    powerGeneratedKw: 0,
    powerUsedKw: Math.max(0, -engine.powerKw),
    stormPowerKw: 0,
    scienceTotal: 0,
    protectionTotal: 0,
    crewSupportTotal: 0,
    comms: 0,
    crew: 0,
    commandModules: 0,
  }
  for (const [id, n] of Object.entries(build.modules)) {
    if (!n) continue
    const m = byId(MODULES, id)
    t.dryMass += m.massTonnes * n
    t.totalCost += m.costUSDm * n
    if (m.powerKw > 0) {
      const out = (m.solar ? m.powerKw * destination.sunlightFactor : m.powerKw) * n
      t.powerGeneratedKw += out
      t.stormPowerKw += m.solar ? out * RULES.dustStormSolarFactor : out
    } else {
      t.powerUsedKw += -m.powerKw * n
    }
    t.stormPowerKw += m.backupKw * n
    t.scienceTotal += m.science * n
    t.protectionTotal += m.protection * n
    t.crewSupportTotal += m.crewSupport * n
    t.comms = Math.max(t.comms, m.comms)
    t.crew += m.crew * n
    if (m.category === 'command') t.commandModules += n
  }
  t.totalMass = t.dryMass + build.propellantTonnes
  return t
}

export const missionBudget = (difficulty: Difficulty): number => RULES.baseBudgetUSDm * difficulty.budgetMultiplier

export function requiredDeltaV(destination: Destination, difficulty: Difficulty, window?: LaunchWindow): number {
  return destination.deltaVRequired * difficulty.deltaVMultiplier * (window?.deltaVMultiplier ?? 1)
}

/** Share of science data that reaches Earth for a comms rating (0–10). */
export const commsFactor = (comms: number): number => Math.min(1, RULES.commsFactorBase + RULES.commsFactorPerPoint * comms)

/** Blocking problems: any one of them disables launch. Numbers are raw; the UI formats them. */
export type Problem =
  | { code: 'mass'; mass: number; cap: number }
  | { code: 'cost'; cost: number; budget: number }
  | { code: 'power'; used: number; gen: number }
  | { code: 'deltaV'; dv: number; need: number }
  | { code: 'noCommand' }
  | { code: 'twoCommand' }
  | { code: 'crewNeeds'; missing: string[] }
  | { code: 'habitatNoCrew' }
  | { code: 'lander' }
  | { code: 'ionLanding' }

export type Warning =
  | { code: 'thinDeltaV'; pct: number }
  | { code: 'noComms'; pct: number }
  | { code: 'noScience' }
  | { code: 'lowProtection'; p: number }
  | { code: 'noSpares' }
  | { code: 'tightPower'; pct: number }
  | { code: 'inDev' }
  | { code: 'dustStorm'; pct: number; kw: number }

export function checkLaunch(
  build: Build,
  vehicle: Vehicle,
  destination: Destination,
  difficulty: Difficulty,
  window?: LaunchWindow,
): { problems: Problem[]; warnings: Warning[] } {
  const engine = byId(ENGINES, build.engineId)
  const t = computeTotals(build, destination, engine)
  const dv = computeDeltaV(engine, t.totalMass, build.propellantTonnes)
  const need = requiredDeltaV(destination, difficulty, window)
  const budget = missionBudget(difficulty)
  const cost = t.totalCost + vehicle.costUSDm
  const problems: Problem[] = []
  const warnings: Warning[] = []

  if (t.totalMass > vehicle.payloadToLEOTonnes) problems.push({ code: 'mass', mass: t.totalMass, cap: vehicle.payloadToLEOTonnes })
  if (cost > budget) problems.push({ code: 'cost', cost, budget })
  if (t.powerUsedKw > t.powerGeneratedKw) problems.push({ code: 'power', used: t.powerUsedKw, gen: t.powerGeneratedKw })
  if (dv < need) problems.push({ code: 'deltaV', dv, need })
  if (t.commandModules === 0) problems.push({ code: 'noCommand' })
  if (t.commandModules > 1) problems.push({ code: 'twoCommand' })
  if (t.crew > 0) {
    const missing = destination.crewRequires.filter((id) => count(build, id) === 0)
    if (missing.length) problems.push({ code: 'crewNeeds', missing })
  }
  if (count(build, 'habitat') > 0 && t.crew === 0) problems.push({ code: 'habitatNoCrew' })
  if (destination.landing && count(build, 'lander') === 0) problems.push({ code: 'lander' })
  if (destination.landing && !engine.landingCapable) problems.push({ code: 'ionLanding' })

  const margin = need > 0 ? dv / need - 1 : 0
  if (dv >= need && margin < RULES.deltaVWarnMargin) warnings.push({ code: 'thinDeltaV', pct: margin * 100 })
  if (t.comms === 0) warnings.push({ code: 'noComms', pct: commsFactor(0) * 100 })
  if (t.scienceTotal === 0) warnings.push({ code: 'noScience' })
  if (destination.radiationLevel >= RULES.warnings.radiationLevel && t.protectionTotal < RULES.warnings.protection)
    warnings.push({ code: 'lowProtection', p: t.protectionTotal })
  if (count(build, 'spare-parts') === 0) warnings.push({ code: 'noSpares' })
  const powerMarginPct = t.powerGeneratedKw > 0 ? ((t.powerGeneratedKw - t.powerUsedKw) / t.powerGeneratedKw) * 100 : 0
  if (t.powerUsedKw <= t.powerGeneratedKw && t.powerGeneratedKw > 0 && powerMarginPct < RULES.warnings.powerMarginPct)
    warnings.push({ code: 'tightPower', pct: powerMarginPct })
  if (vehicle.inDevelopment) warnings.push({ code: 'inDev' })
  if (destination.dustStormRisk > 0)
    warnings.push({ code: 'dustStorm', pct: RULES.dustStormSolarFactor * 100, kw: t.stormPowerKw - t.powerUsedKw })

  return { problems, warnings }
}

export type Bar = { value: number; max: number; status: BarStatus }

/** Limit bars (mass, cost, power): warn near the limit, bad past it. */
export function limitBar(value: number, max: number): Bar {
  const status: BarStatus = value > max ? 'bad' : value > max * RULES.barWarnRatio ? 'warn' : 'ok'
  return { value, max, status }
}

/** Target bar (delta-v): bad below the requirement, warn on a thin margin. */
export function targetBar(value: number, max: number): Bar {
  const status: BarStatus = value < max ? 'bad' : value < max * (1 + RULES.deltaVWarnMargin) ? 'warn' : 'ok'
  return { value, max, status }
}

export type BuildReport = {
  destination: Destination
  vehicle: Vehicle
  engine: Engine
  difficulty: Difficulty
  totals: Totals
  deltaV: number
  requiredDeltaV: number
  budget: number
  missionCost: number
  bars: { mass: Bar; cost: Bar; power: Bar; deltaV: Bar }
  problems: Problem[]
  warnings: Warning[]
}

/** One call for the UI: everything the builder screen shows, from the engine. */
export function analyzeBuild(build: Build, difficultyId: string, window?: LaunchWindow): BuildReport {
  const destination = byId(DESTINATIONS, build.destinationId)
  const vehicle = byId(VEHICLES, build.vehicleId)
  const engine = byId(ENGINES, build.engineId)
  const difficulty = byId(DIFFICULTIES, difficultyId)
  const totals = computeTotals(build, destination, engine)
  const deltaV = computeDeltaV(engine, totals.totalMass, build.propellantTonnes)
  const need = requiredDeltaV(destination, difficulty, window)
  const budget = missionBudget(difficulty)
  const missionCost = totals.totalCost + vehicle.costUSDm
  return {
    destination,
    vehicle,
    engine,
    difficulty,
    totals,
    deltaV,
    requiredDeltaV: need,
    budget,
    missionCost,
    bars: {
      mass: limitBar(totals.totalMass, vehicle.payloadToLEOTonnes),
      cost: limitBar(missionCost, budget),
      power: limitBar(totals.powerUsedKw, totals.powerGeneratedKw),
      deltaV: targetBar(deltaV, need),
    },
    ...checkLaunch(build, vehicle, destination, difficulty, window),
  }
}
