import { CircleCheck, CircleX } from 'lucide-react'
import { ChoiceCard } from '@/components/ChoiceCard'
import { ScreenFrame } from '@/components/ScreenFrame'
import { RULES } from '@/game/data'
import { analyzeBuild } from '@/game/engine/build'
import { useGame } from '@/game/store/useGame'
import { useI18n } from '@/game/useI18n'

// Sketch of the transfer: inner circle = where you start, outer = the destination's orbit.
// Early cuts across (steep), standard is the half-ellipse, late swings the long way round.
const END_ANGLE: Record<string, number> = { early: -50, standard: 0, late: 35 }

function OrbitDiagram({ windowId, label }: { windowId: string; label: string }) {
  const cx = 70
  const cy = 60
  const r1 = 22
  const r2 = 48
  const a = ((END_ANGLE[windowId] ?? 0) * Math.PI) / 180
  const ex = cx + r2 * Math.cos(a)
  const ey = cy + r2 * Math.sin(a)
  const arc = windowId === 'standard' ? `A ${(r1 + r2) / 2} ${Math.sqrt(r1 * r2) + 6} 0 0 1` : windowId === 'early' ? 'A 40 40 0 0 1' : 'A 42 38 0 1 1'
  return (
    <svg viewBox="0 0 140 120" role="img" aria-label={label} className="h-28 w-full">
      <circle cx={cx} cy={cy} r={r1} fill="none" className="stroke-ink-4" strokeDasharray="2 3" />
      <circle cx={cx} cy={cy} r={r2} fill="none" className="stroke-ink-4" strokeDasharray="2 3" />
      <circle cx={cx} cy={cy} r={4} className="fill-ink-4" />
      <path d={`M ${cx - r1} ${cy} ${arc} ${ex} ${ey}`} fill="none" className="stroke-ink-2" strokeWidth={2} />
      <circle cx={cx - r1} cy={cy} r={4} className="fill-earth" />
      <circle cx={ex} cy={ey} r={4} className="fill-ink" />
    </svg>
  )
}

export function LaunchWindowScreen() {
  const { t, n } = useI18n()
  const { build, windowId, setWindow, launch, go, difficultyId } = useGame()
  const options = RULES.launchWindows.map((w) => ({ w, r: analyzeBuild(build, difficultyId, w) }))
  const selected = options.find((o) => o.w.id === windowId) ?? options[1]
  const canLaunch = selected.r.problems.length === 0

  return (
    <ScreenFrame
      title={t('win.title')}
      intro={t('win.intro')}
      backLabel={t('nav.back')}
      onBack={() => go('builder')}
      nextLabel={t('win.launch')}
      onNext={launch}
      nextDisabled={!canLaunch}
      nextHint={t('win.cantLaunch')}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {options.map(({ w, r }) => {
          const days = Math.round(r.destination.travelDays * w.travelTimeMultiplier * r.engine.travelTimeMultiplier)
          const ok = r.deltaV >= r.requiredDeltaV
          return (
            <ChoiceCard key={w.id} selected={w.id === windowId} onSelect={() => setWindow(w.id)} selectedLabel={t('common.selected')}>
              <OrbitDiagram windowId={w.id} label={t('win.diagram', { name: w.name })} />
              <span className="text-xl font-medium">{w.name}</span>
              <span className="text-sm text-ink-3">{w.description}</span>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-ink-3">{t('win.travel')}</dt>
                  <dd className="font-mono tabular-nums">{t('unit.days', { n: n(days) })}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-3">{t('win.need')}</dt>
                  <dd className="font-mono tabular-nums">{t('unit.kms', { n: n(r.requiredDeltaV, 2) })}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-3">{t('win.yours')}</dt>
                  <dd className="font-mono tabular-nums">{t('unit.kms', { n: n(r.deltaV, 2) })}</dd>
                </div>
              </dl>
              <span className={`mt-auto flex items-center gap-1.5 text-sm font-medium ${ok ? 'text-ok' : 'text-bad'}`}>
                {ok ? <CircleCheck className="size-4" aria-hidden /> : <CircleX className="size-4" aria-hidden />}
                {t(ok ? 'win.ok' : 'win.short')}
              </span>
            </ChoiceCard>
          )
        })}
      </div>
    </ScreenFrame>
  )
}
