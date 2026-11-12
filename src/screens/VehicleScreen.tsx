import { TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BuildBars } from '@/components/BuildBars'
import { ChoiceCard } from '@/components/ChoiceCard'
import { FuelControl } from '@/components/FuelControl'
import { ScreenFrame } from '@/components/ScreenFrame'
import { ENGINES, VEHICLES } from '@/game/data'
import { analyzeBuild } from '@/game/engine/build'
import type { DictKey } from '@/game/i18n'
import { useGame } from '@/game/store/useGame'
import { useI18n } from '@/game/useI18n'

function Stats({ items }: { items: [DictKey, string][] }) {
  const { t } = useI18n()
  return (
    <dl className="mt-auto grid grid-cols-3 gap-2 text-sm">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{t(label)}</dt>
          <dd className="font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function VehicleScreen() {
  const { t, tx, n, money } = useI18n()
  const { build, updateBuild, go, difficultyId } = useGame()
  const report = analyzeBuild(build, difficultyId)

  return (
    <ScreenFrame
      title={t('veh.title')}
      backLabel={t('nav.back')}
      onBack={() => go('destination')}
      nextLabel={t('veh.next')}
      onNext={() => go('builder')}
    >
      <section aria-labelledby="vehicles" className="space-y-3">
        <div>
          <h2 id="vehicles" className="text-lg font-semibold">
            {t('veh.vehicles')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('veh.vehiclesIntro')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VEHICLES.map((v) => (
            <ChoiceCard key={v.id} selected={build.vehicleId === v.id} onSelect={() => updateBuild({ vehicleId: v.id })} selectedLabel={t('common.selected')}>
              <span className="pr-20 text-lg font-semibold">{v.name}</span>
              {v.inDevelopment && <Badge variant="outline">{t('veh.inDev')}</Badge>}
              <span className="text-sm text-muted-foreground">{tx(v.description)}</span>
              <Stats
                items={[
                  ['veh.payload', t('unit.t', { n: n(v.payloadToLEOTonnes, 1) })],
                  ['veh.cost', money(v.costUSDm)],
                  ['veh.reliability', t('unit.pct', { n: n(v.reliability * 100) })],
                ]}
              />
            </ChoiceCard>
          ))}
        </div>
      </section>

      <section aria-labelledby="engines" className="space-y-3">
        <div>
          <h2 id="engines" className="text-lg font-semibold">
            {t('eng.title')}
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground">{t('eng.intro')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ENGINES.map((e) => (
            <ChoiceCard key={e.id} selected={build.engineId === e.id} onSelect={() => updateBuild({ engineId: e.id })} selectedLabel={t('common.selected')}>
              <span className="pr-20 text-lg font-semibold">{tx(e.name)}</span>
              <span className="text-sm text-muted-foreground">{tx(e.description)}</span>
              {e.restriction && (
                <span className="flex gap-1.5 text-xs text-warn">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {tx(e.restriction)}
                </span>
              )}
              <Stats
                items={[
                  ['eng.isp', t('unit.s', { n: n(e.ispSeconds) })],
                  ['eng.mass', t('unit.t', { n: n(e.massTonnes, 1) })],
                  ['eng.cost', money(e.costUSDm)],
                ]}
              />
            </ChoiceCard>
          ))}
        </div>
      </section>

      <section aria-labelledby="fuel" className="grid gap-6 rounded-xl border border-border bg-card/80 p-4 md:grid-cols-2">
        <div className="space-y-3">
          <h2 id="fuel" className="text-lg font-semibold">
            {t('fuel.title')}
          </h2>
          <FuelControl report={report} />
        </div>
        <BuildBars report={report} only="deltaV" />
      </section>
    </ScreenFrame>
  )
}
