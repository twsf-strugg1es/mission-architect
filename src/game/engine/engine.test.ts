import { describe, expect, it } from 'vitest'
import { EVENTS } from '../data'
import type { Build } from '../types'
import { analyzeBuild, checkLaunch, computeTotals } from './build'
import { createContext, effectFor, planMission, reservePct, simulateMission, type Chooser } from './mission'
import { computeDeltaV, propellantFor } from './physics'
import { buildDebrief, scoreMission } from './score'
import { byId, DESTINATIONS, DIFFICULTIES, ENGINES, VEHICLES } from '../data'

// A sensible Cadet Moon build on Falcon Heavy (playthrough a).
const cadetMoon: Build = {
  destinationId: 'moon',
  vehicleId: 'falcon-heavy',
  engineId: 'cryogenic',
  propellantTonnes: 32,
  modules: {
    'probe-core': 1, lander: 1, 'solar-large': 1, 'high-gain-antenna': 1, spectrometer: 1, drill: 1,
    'camera-suite': 1, seismometer: 1, rover: 1, 'spare-parts': 1, 'radiation-shielding': 1,
  },
}

// A lean Commander Mars build (playthrough c).
const commanderMars: Build = {
  destinationId: 'mars',
  vehicleId: 'falcon-heavy',
  engineId: 'cryogenic',
  propellantTonnes: 48,
  modules: {
    'probe-core': 1, lander: 1, 'solar-large': 1, rtg: 1, 'battery-bank': 1, rover: 1, spectrometer: 1,
    drill: 1, 'camera-suite': 1, 'high-gain-antenna': 1, 'spare-parts': 1, 'radiation-shielding': 1, 'redundant-computer': 1,
  },
}

// Deliberately broken (playthrough b): overweight and no power.
const broken: Build = {
  destinationId: 'moon',
  vehicleId: 'falcon-9',
  engineId: 'chemical',
  propellantTonnes: 20,
  modules: { 'crew-capsule': 1, habitat: 1 },
}

/** Picks the least damaging choice that keeps a fuel reserve, like a careful player. */
const careful: Chooser = (event, s, ctx) => {
  const value = (id: string) => {
    const { effect } = effectFor(event, event.choices.find((c) => c.id === id)!, ctx, s)
    if (reservePct(ctx, s) + effect.fuelDeltaPercent < 0 || s.safety + effect.safetyDelta <= 0) return -1000
    return effect.safetyDelta + 2 * effect.scienceDelta + 0.5 * effect.fuelDeltaPercent - 0.05 * effect.timeDeltaDays + 0.02 * effect.budgetDelta
  }
  return event.choices.map((c) => c.id).sort((a, b) => value(b) - value(a))[0]
}

describe('rocket equation', () => {
  it('matches Isp × g0 × ln(m0/mf)', () => {
    // 450 s, 40 t full, 10 t empty: 450 × 9.80665 × ln 4 / 1000 = 6.1177 km/s
    expect(computeDeltaV({ ispSeconds: 450 }, 40, 30)).toBeCloseTo(6.1177, 3)
    expect(computeDeltaV({ ispSeconds: 450 }, 40, 0)).toBe(0)
  })
  it('propellantFor is its inverse', () => {
    const prop = propellantFor(330, 10, 5.9)
    expect(computeDeltaV({ ispSeconds: 330 }, 10 + prop, prop)).toBeCloseTo(5.9, 6)
  })
})

describe('computeTotals', () => {
  it('adds engine, dry structure and propellant, and scales solar by sunlight', () => {
    const mars = byId(DESTINATIONS, 'mars')
    const t = computeTotals(
      { destinationId: 'mars', vehicleId: 'falcon-heavy', engineId: 'chemical', propellantTonnes: 10, modules: { 'solar-large': 1, rtg: 1 } },
      mars,
      byId(ENGINES, 'chemical'),
    )
    expect(t.dryMass).toBeCloseTo(0.8 + 0.2 + 1.2 + 2, 6)
    expect(t.totalMass).toBeCloseTo(14.2, 6)
    expect(t.powerGeneratedKw).toBeCloseTo(6 * 0.43 + 0.45, 6) // RTG does not scale
    expect(t.stormPowerKw).toBeCloseTo(6 * 0.43 * 0.3 + 0.45, 6)
  })
})

describe('checkLaunch', () => {
  const cadet = byId(DIFFICULTIES, 'cadet')
  it('passes the sensible Cadet Moon build', () => {
    const r = checkLaunch(cadetMoon, byId(VEHICLES, 'falcon-heavy'), byId(DESTINATIONS, 'moon'), cadet)
    expect(r.problems).toEqual([])
  })
  it('blocks an overweight, unpowered build with clear reasons', () => {
    const codes = checkLaunch(broken, byId(VEHICLES, 'falcon-9'), byId(DESTINATIONS, 'moon'), cadet).problems.map((p) => p.code)
    expect(codes).toEqual(expect.arrayContaining(['mass', 'power', 'deltaV', 'lander']))
  })
  it('requires a habitat for crewed Mars and blocks ion engines on landing missions', () => {
    const crewedMars: Build = { ...commanderMars, modules: { 'crew-capsule': 1, lander: 1, 'solar-large': 3 } }
    const r = checkLaunch(crewedMars, byId(VEHICLES, 'starship'), byId(DESTINATIONS, 'mars'), cadet)
    expect(r.problems).toContainEqual({ code: 'crewNeeds', missing: ['habitat'] })
    const ion = checkLaunch({ ...cadetMoon, engineId: 'ion' }, byId(VEHICLES, 'falcon-heavy'), byId(DESTINATIONS, 'moon'), cadet)
    expect(ion.problems.map((p) => p.code)).toContain('ionLanding')
  })
  it('flags missing or duplicate command modules and a habitat without crew', () => {
    const none = checkLaunch({ ...cadetMoon, modules: { lander: 1 } }, byId(VEHICLES, 'falcon-heavy'), byId(DESTINATIONS, 'moon'), cadet)
    expect(none.problems.map((p) => p.code)).toContain('noCommand')
    const two = checkLaunch({ ...cadetMoon, modules: { 'probe-core': 1, 'crew-capsule': 1, habitat: 1 } }, byId(VEHICLES, 'starship'), byId(DESTINATIONS, 'moon'), cadet)
    expect(two.problems.map((p) => p.code)).toContain('twoCommand')
    const hab = checkLaunch({ ...cadetMoon, modules: { 'probe-core': 1, habitat: 1 } }, byId(VEHICLES, 'starship'), byId(DESTINATIONS, 'moon'), cadet)
    expect(hab.problems.map((p) => p.code)).toContain('habitatNoCrew')
  })
  it('the Commander Mars build is launchable', () => {
    expect(analyzeBuild(commanderMars, 'commander').problems).toEqual([])
  })
})

describe('mission simulation', () => {
  it('plans the difficulty\'s event count and is reproducible from the seed', () => {
    const ctx = createContext(commanderMars, 'commander', 'standard')
    expect(planMission(ctx, 7)).toEqual(planMission(ctx, 7))
    expect(planMission(ctx, 7).length).toBe(5)
    expect(planMission(createContext(cadetMoon, 'cadet', 'standard'), 7).length).toBe(2)
    expect(simulateMission(ctx, 99, careful)).toEqual(simulateMission(ctx, 99, careful))
  })
  it('only draws events whose conditions match', () => {
    const ctx = createContext(cadetMoon, 'cadet', 'standard')
    for (let seed = 1; seed <= 40; seed++) {
      for (const p of planMission(ctx, seed)) {
        const e = byId(EVENTS, p.eventId)
        expect(e.condition.destinations ?? ['moon']).toContain('moon')
        expect(e.condition.crewed).not.toBe(true) // robotic build
      }
    }
  })
  it('a careful Cadet Moon flight completes with a passing grade on every seed', () => {
    const ctx = createContext(cadetMoon, 'cadet', 'standard')
    for (let seed = 1; seed <= 60; seed++) {
      const s = simulateMission(ctx, seed, careful)
      expect(s.status).toBe('complete')
      expect(scoreMission(ctx, s).grade).not.toBe('Fail')
    }
  })
  it('a careful Commander Mars flight usually completes', () => {
    const ctx = createContext(commanderMars, 'commander', 'standard')
    const done = Array.from({ length: 60 }, (_, i) => simulateMission(ctx, i + 1, careful)).filter((s) => s.status === 'complete')
    expect(done.length).toBeGreaterThanOrEqual(54)
  })
  it('fails when fuel runs out and grades it as Fail', () => {
    // exactly the required delta-v: any fuel-costing choice strands the craft
    const tight = createContext({ ...cadetMoon, propellantTonnes: 27.6 }, 'cadet', 'standard')
    const s = { ...simulateMission(tight, 3, careful) }
    const drained = { ...s, status: 'failed' as const, failure: { reason: 'fuel' as const, legIndex: 2, atEvent: false } }
    expect(scoreMission(tight, drained).grade).toBe('Fail')
  })
})

describe('score and debrief', () => {
  it('parts add up to the score and the debrief names real decisions', () => {
    const ctx = createContext(cadetMoon, 'cadet', 'standard')
    const s = simulateMission(ctx, 11, careful)
    const r = scoreMission(ctx, s)
    expect(r.parts.reduce((a, p) => a + p.points, 0)).toBe(r.score)
    const debrief = buildDebrief(ctx, s, r)
    expect(debrief.filter((d) => d.kind === 'event')).toHaveLength(s.resolved.length)
    expect(debrief.some((d) => d.kind === 'engine')).toBe(true)
  })
})
