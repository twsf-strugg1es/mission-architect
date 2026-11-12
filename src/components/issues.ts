// Engine problem / warning codes -> plain language in the current locale.
import { byId, DESTINATIONS, MODULES, VEHICLES } from '@/game/data'
import type { Problem, Warning } from '@/game/engine/build'
import type { DictKey } from '@/game/i18n'
import type { Build } from '@/game/types'
import type { useI18n } from '@/game/useI18n'

type I18n = ReturnType<typeof useI18n>

export function problemText(p: Problem, build: Build, i: I18n): string {
  const dest = i.tx(byId(DESTINATIONS, build.destinationId).name)
  switch (p.code) {
    case 'mass':
      return i.t('prob.mass', { mass: i.n(p.mass, 1), vehicle: byId(VEHICLES, build.vehicleId).name, cap: i.n(p.cap, 1) })
    case 'cost':
      return i.t('prob.cost', { cost: i.money(p.cost), budget: i.money(p.budget) })
    case 'power':
      return i.t('prob.power', { used: i.n(p.used, 2), gen: i.n(p.gen, 2) })
    case 'deltaV':
      return i.t('prob.deltaV', { dv: i.n(p.dv, 2), dest, need: i.n(p.need, 2) })
    case 'crewNeeds':
      return i.t('prob.crewNeeds', { dest, modules: p.missing.map((id) => i.tx(byId(MODULES, id).name)).join(', ') })
    case 'lander':
      return i.t('prob.lander', { dest })
    default:
      return i.t(`prob.${p.code}`)
  }
}

export const hintKey = (p: Problem): DictKey => `hint.${p.code}`

export function warningText(w: Warning, build: Build, i: I18n): string {
  const dest = i.tx(byId(DESTINATIONS, build.destinationId).name)
  switch (w.code) {
    case 'thinDeltaV':
      return i.t('warn.thinDeltaV', { pct: i.n(w.pct, 1) })
    case 'noComms':
      return i.t('warn.noComms', { pct: i.n(w.pct) })
    case 'lowProtection':
      return i.t('warn.lowProtection', { dest, p: i.n(w.p) })
    case 'tightPower':
      return i.t('warn.tightPower', { pct: i.n(w.pct) })
    case 'inDev':
      return i.t('warn.inDev', { vehicle: byId(VEHICLES, build.vehicleId).name })
    case 'dustStorm':
      return i.t('warn.dustStorm', { dest, pct: i.n(w.pct), kw: i.n(w.kw, 2) })
    default:
      return i.t(`warn.${w.code}`)
  }
}
