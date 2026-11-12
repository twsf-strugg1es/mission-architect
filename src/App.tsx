import { useState } from 'react'
import { DESTINATIONS } from '@/game/data'
import { fmt, fmtSig, t, tx } from '@/game/i18n'
import type { Locale } from '@/game/types'

// Phase 1 preview: destination data from JSON + the en/bn dictionary. Replaced by the game screens in Phase 3/4.
function App() {
  const [locale, setLocale] = useState<Locale>('en')

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
        <p className="text-muted-foreground">{t(locale, 'dest.intro')}</p>
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
              <p className="text-sm text-muted-foreground">{tx(locale, d.funFact)}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

export default App
