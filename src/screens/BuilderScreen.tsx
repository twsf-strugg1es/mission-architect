import { useState } from 'react'
import { CircleCheck, CircleX, Lightbulb, Minus, Plus, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BuildBars } from '@/components/BuildBars'
import { FuelControl } from '@/components/FuelControl'
import { hintKey, problemText, warningText } from '@/components/issues'
import { ScreenFrame } from '@/components/ScreenFrame'
import { MODULES } from '@/game/data'
import { analyzeBuild, count } from '@/game/engine/build'
import { G0 } from '@/game/engine/physics'
import type { DictKey } from '@/game/i18n'
import { useGame } from '@/game/store/useGame'
import { useI18n } from '@/game/useI18n'
import type { Module, ModuleCategory } from '@/game/types'
import { cn } from '@/lib/utils'

const CATEGORIES: ModuleCategory[] = ['command', 'landing', 'power', 'science', 'comms', 'protection', 'surface']

function ModuleRow({ m }: { m: Module }) {
  const { t, n, money } = useI18n()
  const build = useGame((s) => s.build)
  const addModule = useGame((s) => s.addModule)
  const removeModule = useGame((s) => s.removeModule)
  const c = count(build, m.id)
  const name = m.name
  const stats: [DictKey, string][] = [
    ['mod.mass', t('unit.t', { n: n(m.massTonnes, 2) })],
    ['mod.cost', money(m.costUSDm)],
  ]
  if (m.powerKw !== 0) stats.push(['mod.power', t('unit.kw', { n: `${m.powerKw > 0 ? '+' : '−'}${n(Math.abs(m.powerKw), 2)}` })])
  if (m.science) stats.push(['mod.science', `+${n(m.science)}`])
  if (m.protection) stats.push(['mod.protection', `+${n(m.protection)}`])
  if (m.crewSupport) stats.push(['mod.crewSupport', `+${n(m.crewSupport)}`])
  if (m.comms) stats.push(['mod.comms', n(m.comms)])
  if (m.crew) stats.push(['mod.crew', n(m.crew)])

  return (
    <li className={cn('flex min-w-0 flex-col gap-2 border p-4', c > 0 ? 'border-signal bg-signal-soft' : 'border-rule bg-paper-2')}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium">{name}</h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button size="icon" variant="outline" className="relative after:absolute after:-inset-1.5" aria-label={t('build.remove', { name })} disabled={c === 0} onClick={() => removeModule(m.id)}>
            <Minus aria-hidden />
          </Button>
          <span className="w-6 text-center font-mono tabular-nums" aria-label={t('build.inBuild', { n: c })}>
            {n(c)}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="relative after:absolute after:-inset-1.5"
            aria-label={c >= m.maxCount ? `${t('build.add', { name })}: ${t('build.max')}` : t('build.add', { name })}
            disabled={c >= m.maxCount}
            onClick={() => addModule(m.id)}
          >
            <Plus aria-hidden />
          </Button>
        </div>
      </div>
      <p className="text-sm text-ink-2">{m.blurb}</p>
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {stats.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <dt className="text-ink-3">{t(label)}</dt>
            <dd className="font-mono tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-ink-3">{m.requiresPowerNote}</p>
    </li>
  )
}

export function BuilderScreen() {
  const i18n = useI18n()
  const { t, n } = i18n
  const { build, go, difficultyId } = useGame()
  const report = analyzeBuild(build, difficultyId)
  const [hintAsked, setHintAsked] = useState(false)
  const { problems, warnings, totals, engine } = report
  const hintMode = report.difficulty.hints
  const showHint = hintMode === 'on' || (hintMode === 'onDemand' && hintAsked)
  const capabilities: [DictKey, number][] = [
    ['mod.science', totals.scienceTotal],
    ['mod.protection', totals.protectionTotal],
    ['mod.crewSupport', totals.crewSupportTotal],
    ['mod.comms', totals.comms],
  ]

  return (
    <ScreenFrame
      title={t('build.title')}
      backLabel={t('nav.back')}
      onBack={() => go('vehicle')}
      nextLabel={t('build.next')}
      onNext={() => go('launchWindow')}
      nextDisabled={problems.length > 0}
      nextHint={t('problems.title')}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <aside
          aria-labelledby="summary"
          className="space-y-5 border border-rule bg-paper-2 p-4 lg:sticky lg:top-4 lg:order-last lg:max-h-[calc(100svh-2rem)] lg:overflow-y-auto"
        >
          <h2 id="summary" className="text-lg font-medium">
            {t('summary.title')}
          </h2>
          <BuildBars report={report} large />

          <div className="space-y-2 border-t border-rule pt-4" aria-live="polite">
            {problems.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-ok">
                <CircleCheck className="size-4 shrink-0" aria-hidden />
                {t('problems.none')}
              </p>
            ) : (
              <>
                <h3 className="text-sm font-medium text-bad">{t('problems.title')}</h3>
                <ul className="space-y-1.5 text-sm">
                  {problems.map((p) => (
                    <li key={p.code} className="flex gap-2">
                      <CircleX className="mt-0.5 size-4 shrink-0 text-bad" aria-hidden />
                      {problemText(p, build, i18n)}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {warnings.length > 0 && (
              <>
                <h3 className="pt-2 text-sm font-medium text-warn">{t('warnings.title')}</h3>
                <ul className="space-y-1.5 text-sm">
                  {warnings.map((w) => (
                    <li key={w.code} className="flex gap-2">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
                      {warningText(w, build, i18n)}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {hintMode === 'onDemand' && !hintAsked && (
              <Button variant="outline" size="sm" onClick={() => setHintAsked(true)}>
                <Lightbulb aria-hidden data-icon="inline-start" />
                {t('hint.show')}
              </Button>
            )}
            {showHint && (
              <p className="flex gap-2 border-l-2 border-rule py-1 pl-3 text-sm">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
                <span>
                  <span className="font-medium">{t('hint.title')}: </span>
                  {t(problems[0] ? hintKey(problems[0]) : 'hint.ready')}
                </span>
              </p>
            )}
          </div>

          <div className="border-t border-rule pt-4">
            <FuelControl report={report} />
          </div>

          <dl className="grid grid-cols-4 gap-2 border-t border-rule pt-4">
            {capabilities.map(([label, value]) => (
              <div key={label} className="flex min-w-0 flex-col-reverse justify-end">
                <dt className="text-xs text-ink-3">{t(label)}</dt>
                <dd className="font-mono text-3xl tabular-nums">{n(value)}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="equation" className="space-y-1 border-t border-rule pt-4">
            <h3 id="equation" className="text-sm font-medium">
              {t('eq.title')}
            </h3>
            <p className="font-mono text-sm">Δv = Isp × g₀ × ln(m₀ / m_f)</p>
            <p className="font-mono text-sm tabular-nums">
              = {n(engine.ispSeconds)} × {n(G0, 2)} × ln({n(totals.totalMass, 1)} / {n(totals.dryMass, 1)}) = {t('unit.kms', { n: n(report.deltaV, 2) })}
            </p>
            <p className="text-xs text-ink-3">
              {t('eq.values', { m0: n(totals.totalMass, 1), mf: n(totals.dryMass, 1), isp: n(engine.ispSeconds), g0: n(G0, 2) })}
            </p>
          </section>
        </aside>

        <div className="min-w-0 space-y-6">
          <h2 className="sr-only">{t('build.catalogue')}</h2>
          {CATEGORIES.map((c) => (
            <section key={c} aria-labelledby={`cat-${c}`} className="space-y-3 border-t border-rule pt-3">
              <h3 id={`cat-${c}`} className="text-sm font-medium text-ink-3">
                {t(`cat.${c}`)}
              </h3>
              <ul className="grid gap-3 md:grid-cols-2">
                {MODULES.filter((m) => m.category === c).map((m) => (
                  <ModuleRow key={m.id} m={m} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </ScreenFrame>
  )
}
