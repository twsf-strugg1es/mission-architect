import { useState } from 'react'
import { DESTINATIONS } from '@/game/data'
import { fmt, fmtSig, t, tx } from '@/game/i18n'
import { createContext, simulateMission } from '@/game/engine/mission'
import { scoreMission } from '@/game/engine/score'
import type { Build, Locale } from '@/game/types'

// Phase 1–2 preview: JSON data, the en/bn dictionary and the engine. Replaced by the game screens in Phase 3/4.
const demo: Build = {
  destinationId: 'moon',
  vehicleId: 'falcon-heavy',
  engineId: 'cryogenic',
  propellantTonnes: 32,
  modules: {
    'probe-core': 1, lander: 1, 'solar-large': 1, 'high-gain-antenna': 1, spectrometer: 1, drill: 1,
    'camera-suite': 1, seismometer: 1, rover: 1, 'spare-parts': 1, 'radiation-shielding': 1,
  },
}
const ctx = createContext(demo, 'cadet', 'standard')

function App() {
  const [locale, setLocale] = useState<Locale>('en')
  const [seed, setSeed] = useState(0)
  const flight = seed ? simulateMission(ctx, seed) : null
  const result = flight ? scoreMission(ctx, flight) : null

  return (
    <main lang={locale} className="starfield min-h-svh px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">{t(locale, 'app.title')}</h1>
          <div role="group" aria-label={t(locale, 'lang.label')} className="flex gap-1">
            {(['en', 'bn'] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={locale === l}
                onClick={() => setLocale(l)}
                className="rounded-md border px-3 py-1.5 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {l === 'en' ? 'EN' : 'বাংলা'}
              </button>
            ))}
          </div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {DESTINATIONS.map((d) => (
            <li key={d.id} className="space-y-2 rounded-xl border bg-card p-4">
              <h2 className="text-xl font-semibold">{tx(locale, d.name)}</h2>
              <p className="text-sm">
                {t(locale, 'stat.deltaV')}: {t(locale, 'unit.kms', { n: fmt(locale, d.deltaVRequired, 1) })}
              </p>
              <p className="text-sm">
                {t(locale, 'stat.gravity')}: {t(locale, 'unit.ms2', { n: fmtSig(locale, d.gravityMS2, 3) })}
              </p>
            </li>
          ))}
        </ul>
        <section className="space-y-3 rounded-xl border bg-card p-4" aria-labelledby="engine-check">
          <h2 id="engine-check" className="text-xl font-semibold">
            {t(locale, 'eq.title')}
          </h2>
          <p>{t(locale, 'eq.yours', { dv: fmt(locale, ctx.deltaV, 2), dest: tx(locale, ctx.destination.name), need: fmt(locale, ctx.requiredDeltaV, 2) })}</p>
          <p className="text-sm text-muted-foreground">
            {t(locale, 'eq.values', { m0: fmt(locale, ctx.totals.totalMass, 1), mf: fmt(locale, ctx.totals.dryMass, 1), isp: ctx.engine.ispSeconds, g0: fmt(locale, 9.80665, 2) })}
          </p>
          <button type="button" className="rounded-md border px-3 py-1.5" onClick={() => setSeed((s) => s + 1)}>
            Fly demo mission
          </button>
          {flight && result && (
            <p data-testid="demo-result">
              {t(locale, 'res.grade')}: {result.grade} · {t(locale, 'res.score')}: {result.score} · {t(locale, 'sim.log')}: {flight.log.length} · {flight.status}
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
