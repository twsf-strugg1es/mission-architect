// Shared types for the game data (src/game/data/*.json) and the engine.

export type Locale = 'en' | 'bn'
export type Text = { en: string; bn: string }
export type Source = { name: string; url?: string; note?: string }

export type LegId = 'launch' | 'transit' | 'arrival' | 'surface' | 'return'
export type ModuleCategory = 'command' | 'landing' | 'power' | 'science' | 'comms' | 'protection' | 'surface'
export type HintMode = 'on' | 'onDemand' | 'off'
export type Grade = 'S' | 'A' | 'B' | 'C' | 'Fail'
export type BarStatus = 'ok' | 'warn' | 'bad'

export type Destination = {
  id: string
  name: Text
  distanceKm: number
  distanceNote: Text
  travelDays: number
  surfaceDays: number
  gravityMS2: number
  /** km/s from low Earth orbit (simplified educational value) */
  deltaVRequired: number
  /** 0–1 */
  radiationLevel: number
  /** 0–1 */
  dustStormRisk: number
  /** solar array output multiplier vs Earth orbit (inverse-square) */
  sunlightFactor: number
  /** the mission lands (needs a Lander; low-thrust engines can't do it) */
  landing: boolean
  /** module ids a crewed mission must carry */
  crewRequires: string[]
  /** science points for full marks */
  scienceTarget: number
  description: Text
  funFact: Text
}

export type Vehicle = {
  id: string
  name: string
  payloadToLEOTonnes: number
  costUSDm: number
  /** 0–1 */
  reliability: number
  inDevelopment: boolean
  description: Text
}

export type Engine = {
  id: string
  name: Text
  ispSeconds: number
  massTonnes: number
  costUSDm: number
  /** electric power draw (negative = consumes), e.g. ion engines */
  powerKw: number
  /** false = thrust too low for landing burns */
  landingCapable: boolean
  travelTimeMultiplier: number
  description: Text
  restriction: Text | null
}

export type Module = {
  id: string
  name: Text
  category: ModuleCategory
  massTonnes: number
  costUSDm: number
  /** + generates, − consumes (kW, at Earth's distance from the Sun for solar) */
  powerKw: number
  science: number
  crewSupport: number
  protection: number
  /** comms strength 0–10 (comms modules only) */
  comms: number
  /** crew seats (command modules) */
  crew: number
  /** solar output scales with the destination's sunlight */
  solar: boolean
  /** kW still available in a dust storm or eclipse (batteries) */
  backupKw: number
  /** science only counts once the capsule is home */
  returnsSamples: boolean
  maxCount: number
  requiresPowerNote: Text
  blurb: Text
}

export type Effect = {
  scienceDelta: number
  safetyDelta: number
  fuelDeltaPercent: number
  budgetDelta: number
  timeDeltaDays: number
}

export type CheckStat = 'protection' | 'crewSupport' | 'fuelReservePct' | 'stormMarginKw'
export type EventCheck = { stat: CheckStat; atLeast: number } | { anyModule: string[] }

export type Choice = {
  id: string
  label: Text
  effect: Effect
  outcome: Text
  /** used instead when the build passes the event's check */
  preparedEffect?: Effect
  preparedOutcome?: Text
}

export type EventCondition = {
  legs: LegId[]
  destinations?: string[]
  crewed?: boolean
  landing?: boolean
  engines?: string[]
  missingModules?: string[]
}

export type GameEvent = {
  id: string
  title: Text
  text: Text
  condition: EventCondition
  weight: number
  weightBy?: 'radiationLevel' | 'dustStormRisk' | 'launchRisk'
  check: EventCheck | null
  checkLabel: Text | null
  debriefPrepared: Text | null
  debriefUnprepared: Text
  choices: Choice[]
  source: string
  sourceUrl?: string
}

export type Difficulty = {
  id: string
  name: Text
  description: Text
  budgetMultiplier: number
  deltaVMultiplier: number
  /** [min, max] events per mission */
  eventCount: number[]
  hints: HintMode
  gradeThresholds: { S: number; A: number; B: number; C: number }
}

export type LaunchWindow = {
  id: string
  name: Text
  description: Text
  travelTimeMultiplier: number
  deltaVMultiplier: number
}

export type LegRule = { id: LegId; deltaVShare: number; animSeconds: number }

export type Rules = {
  dryStructureTonnes: number
  baseBudgetUSDm: number
  propellant: { startTonnes: number; stepTonnes: number }
  barWarnRatio: number
  deltaVWarnMargin: number
  launchWindows: LaunchWindow[]
  legs: LegRule[]
  launchDays: number
  arrivalDays: number
  reportDays: number
  radiationSafetyPerDay: number
  protectionCap: number
  commsFactorBase: number
  commsFactorPerPoint: number
  dustStormSolarFactor: number
  launchRiskScale: number
  eventPosition: number[]
  warnings: { radiationLevel: number; protection: number; powerMarginPct: number }
  debrief: { marginExcess: number; scienceHigh: number }
  /** radiation level bands: below [0] low, below [1] medium, else high */
  radiationBands: number[]
  /** status thresholds for the flight and results bars */
  flightBars: { reserveWarnPct: number; safetyOk: number; safetyWarn: number; scoreOk: number; scoreWarn: number }
  scoring: {
    science: number
    safety: number
    budget: number
    deltaVMargin: number
    events: number
    deltaVMarginFull: number
    failMultiplier: number
  }
}

/** What the player has chosen so far. Module counts keyed by module id. */
export type Build = {
  destinationId: string
  vehicleId: string
  engineId: string
  propellantTonnes: number
  modules: Record<string, number>
}
