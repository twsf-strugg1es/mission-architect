import { Lightbulb } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ChoiceCard } from '@/components/ChoiceCard'
import { ScreenFrame } from '@/components/ScreenFrame'
import { byId, DESTINATIONS, DIFFICULTIES, RULES } from '@/game/data'
import { requiredDeltaV } from '@/game/engine/build'
import type { DictKey } from '@/game/i18n'
import { useGame } from '@/game/store/useGame'
import { useI18n } from '@/game/useI18n'

function levelKey(value: number): DictKey {
  const [low, high] = RULES.radiationBands
  return value <= 0 ? 'level.none' : value < low ? 'level.low' : value < high ? 'level.medium' : 'level.high'
}

export function DestinationScreen() {
  const { t, tx, n, sig } = useI18n()
  const { build, updateBuild, go, difficultyId } = useGame()
  const difficulty = byId(DIFFICULTIES, difficultyId)

  return (
    <ScreenFrame
      title={t('dest.title')}
      intro={t('dest.intro')}
      backLabel={t('nav.home')}
      onBack={() => go('home')}
      nextLabel={t('dest.next')}
      onNext={() => go('vehicle')}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {DESTINATIONS.map((d) => {
          const stats: [DictKey, string][] = [
            ['stat.distance', d.distanceKm >= 1e6 ? t('unit.millionKm', { n: n(d.distanceKm / 1e6) }) : t('unit.km', { n: n(d.distanceKm) })],
            ['stat.travel', t('unit.days', { n: n(d.travelDays) })],
            ['stat.gravity', t('unit.ms2', { n: sig(d.gravityMS2, 3) })],
            ['stat.deltaV', t('unit.kms', { n: n(requiredDeltaV(d, difficulty), 2) })],
            ['stat.radiation', `${n(d.radiationLevel, 1)} (${t(levelKey(d.radiationLevel))})`],
            ['stat.sunlight', t('unit.times', { n: n(d.sunlightFactor, 2) })],
          ]
          if (d.dustStormRisk > 0) stats.push(['stat.dust', t('unit.pct', { n: n(d.dustStormRisk * 100) })])
          return (
            <ChoiceCard
              key={d.id}
              selected={build.destinationId === d.id}
              onSelect={() => updateBuild({ destinationId: d.id })}
              selectedLabel={t('common.selected')}
            >
              <span className="pr-24 text-2xl font-medium">{tx(d.name)}</span>
              <Badge variant="outline">{t(d.landing ? 'dest.lands' : 'dest.rendezvous')}</Badge>
              <span className="text-sm text-ink-3">{tx(d.description)}</span>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {stats.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-ink-3">{t(label)}</dt>
                    <dd className="font-mono tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              <span className="text-xs text-ink-3">
                {t('stat.distance')}: {tx(d.distanceNote)}
              </span>
              <span className="mt-auto flex gap-2 border-t border-rule pt-3 text-sm text-ink-2">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
                <span>
                  <span className="font-medium">{t('dest.funFact')} </span>
                  {tx(d.funFact)}
                </span>
              </span>
            </ChoiceCard>
          )
        })}
      </div>
    </ScreenFrame>
  )
}
