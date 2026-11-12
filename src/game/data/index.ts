// Typed access to the game data. JSON can't carry TypeScript unions, so each list is
// asserted to its type here once; data.test.ts checks the JSON really matches at runtime.
import type { Destination, Difficulty, Engine, GameEvent, Module, Rules, Source, Vehicle } from '../types'
import destinationsJson from './destinations.json'
import difficultiesJson from './difficulties.json'
import enginesJson from './engines.json'
import eventsJson from './events.json'
import modulesJson from './modules.json'
import rulesJson from './rules.json'
import vehiclesJson from './vehicles.json'

export const DESTINATIONS = destinationsJson.destinations as Destination[]
export const VEHICLES = vehiclesJson.vehicles as Vehicle[]
export const ENGINES = enginesJson.engines as Engine[]
export const MODULES = modulesJson.modules as Module[]
export const EVENTS = eventsJson.events as GameEvent[]
export const DIFFICULTIES = difficultiesJson.difficulties as Difficulty[]
export const RULES = rulesJson as Rules

/** Every file's sources, for the Data & Assumptions screen. */
export const SOURCES: { file: string; sources: Source[] }[] = [
  { file: 'destinations.json', sources: destinationsJson.sources },
  { file: 'vehicles.json', sources: vehiclesJson.sources },
  { file: 'engines.json', sources: enginesJson.sources },
  { file: 'modules.json', sources: modulesJson.sources },
  { file: 'events.json', sources: eventsJson.sources },
  { file: 'difficulties.json', sources: difficultiesJson.sources },
  { file: 'rules.json', sources: rulesJson.sources },
]

export function byId<T extends { id: string }>(list: T[], id: string): T {
  const item = list.find((x) => x.id === id)
  if (!item) throw new Error(`Unknown id: ${id}`)
  return item
}
