import { BudgetBar } from '@/components/BudgetBar'
import type { Bar, BuildReport } from '@/game/engine/build'
import { useI18n } from '@/game/useI18n'

/** The four budget bars, all numbers straight from the engine's BuildReport. */
export function BuildBars({ report, only, large }: { report: BuildReport; only?: 'deltaV'; large?: boolean }) {
  const i = useI18n()
  const { t, n, money } = i
  const { mass, cost, power, deltaV } = report.bars

  const limitText = (b: Bar, fmt: (x: number) => string) =>
    b.status === 'bad' ? t('status.over', { x: fmt(b.value - b.max) }) : b.status === 'warn' ? t('status.tight') : t('status.ok')
  const unitOf = (key: 'unit.t' | 'unit.kw' | 'unit.kms') => t(key, { n: '' }).trim()
  const marginPct = deltaV.max > 0 ? (deltaV.value / deltaV.max - 1) * 100 : 0
  const dvText =
    deltaV.status === 'bad'
      ? t('status.short', { x: t('unit.kms', { n: n(deltaV.max - deltaV.value, 2) }) })
      : t(deltaV.status === 'warn' ? 'status.thin' : 'status.margin', { x: t('unit.pct', { n: n(marginPct, 1) }) })

  const dvBar = (
    <BudgetBar
      label={t('bar.deltaV')}
      value={deltaV.value}
      max={deltaV.max}
      valueText={t('bar.of', { value: n(deltaV.value, 2), max: n(deltaV.max, 2) })}
      unit={unitOf('unit.kms')}
      status={deltaV.status}
      statusText={dvText}
      large={large}
    />
  )
  if (only === 'deltaV') return dvBar

  return (
    <div className="space-y-4">
      <BudgetBar
        label={t('bar.mass')}
        value={mass.value}
        max={mass.max}
        valueText={t('bar.of', { value: n(mass.value, 1), max: n(mass.max, 1) })}
        unit={unitOf('unit.t')}
        status={mass.status}
        statusText={limitText(mass, (x) => t('unit.t', { n: n(x, 1) }))}
        large={large}
      />
      <BudgetBar
        label={t('bar.cost')}
        value={cost.value}
        max={cost.max}
        valueText={t('bar.of', { value: money(cost.value), max: money(cost.max) })}
        status={cost.status}
        statusText={limitText(cost, money)}
        large={large}
      />
      <BudgetBar
        label={t('bar.power')}
        value={power.value}
        max={power.max}
        valueText={t('bar.of', { value: n(power.value, 2), max: n(power.max, 2) })}
        unit={unitOf('unit.kw')}
        status={power.status}
        statusText={limitText(power, (x) => t('unit.kw', { n: n(x, 2) }))}
        large={large}
      />
      {dvBar}
    </div>
  )
}
