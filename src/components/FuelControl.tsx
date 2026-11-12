import { useId } from 'react'
import { Slider } from '@/components/ui/slider'
import { RULES } from '@/game/data'
import type { BuildReport } from '@/game/engine/build'
import { useGame } from '@/game/store/useGame'
import { useI18n } from '@/game/useI18n'

/** Propellant slider with the live rocket-equation readout. Max = the rocket's capacity. */
export function FuelControl({ report }: { report: BuildReport }) {
  const { t, tx, n } = useI18n()
  const propellant = useGame((s) => s.build.propellantTonnes)
  const updateBuild = useGame((s) => s.updateBuild)
  const id = useId()
  const max = report.vehicle.payloadToLEOTonnes

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <label id={id} className="text-sm font-medium">
          {t('fuel.label')}
        </label>
        <span className="font-mono text-2xl tabular-nums">
          {n(propellant, 1)} <span className="text-sm text-ink-3">{t('unit.t', { n: '' }).trim()}</span>
        </span>
      </div>
      <Slider
        aria-labelledby={id}
        aria-valuetext={t('unit.t', { n: n(propellant, 1) })}
        min={0}
        max={max}
        step={RULES.propellant.stepTonnes}
        value={[Math.min(propellant, max)]}
        onValueChange={([v]) => updateBuild({ propellantTonnes: v })}
      />
      <p className="text-sm font-medium tabular-nums" aria-live="polite">
        {t('eq.yours', { dv: n(report.deltaV, 2), dest: tx(report.destination.name), need: n(report.requiredDeltaV, 2) })}
      </p>
      <p className="text-xs text-muted-foreground">{t('fuel.note')}</p>
    </div>
  )
}
