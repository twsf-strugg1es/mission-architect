// The JSON is asserted to its types in index.ts; these tests prove the data really matches.
import { describe, expect, it } from 'vitest'
import { DICT } from '../i18n'
import type { Effect } from '../types'
import { DESTINATIONS, DIFFICULTIES, ENGINES, EVENTS, MODULES, RULES, SOURCES, VEHICLES, byId } from './index'

const LEGS = ['launch', 'transit', 'arrival', 'surface', 'return']
const CATEGORIES = ['command', 'landing', 'power', 'science', 'comms', 'protection', 'surface']
const filled = (t: string) => t.trim().length > 0
const isEffect = (e: Effect) =>
  ['scienceDelta', 'safetyDelta', 'fuelDeltaPercent', 'budgetDelta', 'timeDeltaDays'].every((k) => Number.isFinite(e[k as keyof Effect]))

describe('game data', () => {
  it('every file lists its sources with https links', () => {
    for (const { file, sources } of SOURCES) {
      expect(sources.length, file).toBeGreaterThan(0)
      for (const s of sources) if (s.url) expect(s.url, file).toMatch(/^https:\/\//)
    }
  })

  it('destinations use the brief\'s values', () => {
    const v = (id: string) => byId(DESTINATIONS, id)
    expect([v('moon').deltaVRequired, v('mars').deltaVRequired, v('bennu').deltaVRequired]).toEqual([5.9, 6.3, 5.1])
    expect([v('moon').radiationLevel, v('mars').radiationLevel, v('bennu').radiationLevel]).toEqual([0.4, 0.9, 0.7])
    expect([v('moon').sunlightFactor, v('mars').sunlightFactor, v('bennu').sunlightFactor]).toEqual([1, 0.43, 0.85])
    expect(v('mars').dustStormRisk).toBe(0.3)
    for (const d of DESTINATIONS) expect(filled(d.name) && filled(d.description) && filled(d.funFact) && filled(d.distanceNote)).toBe(true)
  })

  it('vehicles and engines use the brief\'s values', () => {
    expect(VEHICLES.map((v) => [v.id, v.payloadToLEOTonnes, v.costUSDm])).toEqual([
      ['falcon-9', 22.8, 67], ['falcon-heavy', 63.8, 97], ['sls-block-1', 95, 2200], ['starship', 100, 250],
    ])
    expect(byId(VEHICLES, 'starship').inDevelopment).toBe(true)
    expect(ENGINES.map((e) => [e.id, e.ispSeconds, e.massTonnes, e.costUSDm])).toEqual([
      ['chemical', 330, 1.2, 40], ['cryogenic', 450, 1.6, 90], ['nuclear-thermal', 900, 6, 600], ['ion', 3000, 0.8, 150],
    ])
    expect(byId(ENGINES, 'ion')).toMatchObject({ landingCapable: false, travelTimeMultiplier: 3 })
  })

  it('has 16–20 well-formed modules', () => {
    expect(MODULES.length).toBeGreaterThanOrEqual(16)
    expect(MODULES.length).toBeLessThanOrEqual(20)
    for (const m of MODULES) {
      expect(CATEGORIES, m.id).toContain(m.category)
      for (const k of ['science', 'crewSupport', 'protection', 'comms'] as const) expect(m[k], `${m.id}.${k}`).toBeGreaterThanOrEqual(0)
      for (const k of ['science', 'crewSupport', 'protection', 'comms'] as const) expect(m[k], `${m.id}.${k}`).toBeLessThanOrEqual(10)
      expect(m.massTonnes).toBeGreaterThan(0)
      expect(m.maxCount).toBeGreaterThanOrEqual(1)
      expect(filled(m.name) && filled(m.blurb) && filled(m.requiresPowerNote), m.id).toBe(true)
    }
  })

  it('has at least 10 event cards that reference real things', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(10)
    for (const id of ['solar-flare', 'equipment-failure', 'dust-storm', 'micrometeorite', 'comms-blackout', 'discovery', 'landing-hazard', 'crew-illness'])
      expect(EVENTS.map((e) => e.id)).toContain(id)
    for (const e of EVENTS) {
      expect(e.choices, e.id).toHaveLength(2)
      for (const leg of e.condition.legs) expect(LEGS, e.id).toContain(leg)
      for (const d of e.condition.destinations ?? []) byId(DESTINATIONS, d)
      for (const en of e.condition.engines ?? []) byId(ENGINES, en)
      for (const m of e.condition.missingModules ?? []) byId(MODULES, m)
      if (e.check && 'anyModule' in e.check) for (const m of e.check.anyModule) byId(MODULES, m)
      expect(Boolean(e.check), e.id).toBe(Boolean(e.checkLabel))
      expect(filled(e.title) && filled(e.text) && filled(e.debriefUnprepared), e.id).toBe(true)
      for (const c of e.choices) {
        expect(isEffect(c.effect), `${e.id}/${c.id}`).toBe(true)
        if (c.preparedEffect) expect(isEffect(c.preparedEffect) && Boolean(c.preparedOutcome), `${e.id}/${c.id}`).toBe(true)
        expect(filled(c.label) && filled(c.outcome), `${e.id}/${c.id}`).toBe(true)
      }
    }
    expect(byId(EVENTS, 'solar-flare').source).toMatch(/DONKI/)
  })

  it('difficulties and rules are consistent', () => {
    expect(DIFFICULTIES.map((d) => [d.id, d.budgetMultiplier, d.deltaVMultiplier, d.hints])).toEqual([
      ['cadet', 1.5, 0.9, 'on'], ['engineer', 1, 1, 'onDemand'], ['commander', 0.75, 1.05, 'off'],
    ])
    for (const d of DIFFICULTIES) expect(d.eventCount[0]).toBeLessThanOrEqual(d.eventCount[1])
    expect(RULES.legs.map((l) => l.id)).toEqual(LEGS)
    expect(RULES.legs.reduce((a, l) => a + l.deltaVShare, 0)).toBeCloseTo(1, 9)
    const w = RULES.scoring
    expect(w.science + w.safety + w.budget + w.deltaVMargin + w.events).toBe(100)
  })

  it('every UI string is filled in', () => {
    for (const [key, value] of Object.entries(DICT)) expect(filled(value), key).toBe(true)
  })
})
