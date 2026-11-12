import { ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DESTINATIONS, ENGINES, RULES, SOURCES, byId } from '@/game/data'
import type { DictKey } from '@/game/i18n'
import { useGame } from '@/game/store/useGame'
import { useI18n } from '@/game/useI18n'

const FILE_KEYS: Record<string, DictKey> = {
  'destinations.json': 'data.file.destinations',
  'vehicles.json': 'data.file.vehicles',
  'engines.json': 'data.file.engines',
  'modules.json': 'data.file.modules',
  'events.json': 'data.file.events',
  'difficulties.json': 'data.file.difficulties',
  'rules.json': 'data.file.rules',
}

const HOW_STEPS: DictKey[] = ['how.1', 'how.2', 'how.3', 'how.4', 'how.5', 'how.6']

export function HowToPlayDialog() {
  const { t } = useI18n()
  const { overlay, setOverlay } = useGame()
  return (
    <Dialog open={overlay === 'howToPlay'} onOpenChange={(open) => !open && setOverlay(null)}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('how.title')}</DialogTitle>
          <DialogDescription>{t('app.tagline')}</DialogDescription>
        </DialogHeader>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {HOW_STEPS.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ol>
        <p className="text-sm text-ink-3">{t('how.controls')}</p>
      </DialogContent>
    </Dialog>
  )
}

export function DataDialog() {
  const { t, tx, n } = useI18n()
  const { overlay, setOverlay } = useGame()
  const list = (items: string[]) => items.join(', ')
  const ion = byId(ENGINES, 'ion')
  const simplifications = [
    t('simp.leo'),
    t('simp.deltaV', { list: list(DESTINATIONS.map((d) => t('simp.item', { name: tx(d.name), value: t('unit.kms', { n: n(d.deltaVRequired, 1) }) }))) }),
    t('simp.solar', { list: list(DESTINATIONS.map((d) => t('simp.item', { name: tx(d.name), value: t('unit.times', { n: n(d.sunlightFactor, 2) }) }))) }),
    t('simp.windows', {
      list: list(RULES.launchWindows.map((w) => t('simp.windowItem', { name: tx(w.name), travel: n(w.travelTimeMultiplier, 2), dv: n(w.deltaVMultiplier, 2) }))),
    }),
    t('simp.ion', { x: n(ion.travelTimeMultiplier) }),
    t('simp.fuel'),
    t('simp.radiation'),
    t('simp.costs'),
  ]
  return (
    <Dialog open={overlay === 'data'} onOpenChange={(open) => !open && setOverlay(null)}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('data.title')}</DialogTitle>
          <DialogDescription>{t('data.creditsText')}</DialogDescription>
        </DialogHeader>
        <section className="space-y-2">
          <h3 className="font-medium">{t('data.simplifications')}</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {simplifications.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
        <section className="space-y-3">
          <h3 className="font-medium">{t('data.sources')}</h3>
          {SOURCES.map(({ file, sources }) => (
            <div key={file} className="space-y-1">
              <h4 className="text-sm font-medium">{t(FILE_KEYS[file])}</h4>
              <ul className="space-y-1 text-sm">
                {sources.map((s) => (
                  <li key={s.name + (s.url ?? '')}>
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 break-all text-ink underline decoration-ink-4 underline-offset-4 hover:decoration-ink"
                      >
                        {s.name}
                        <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                        <span className="sr-only">{t('data.newTab')}</span>
                      </a>
                    ) : (
                      <span className="text-ink-3">{t('data.gameValues')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <section className="space-y-1">
          <h3 className="font-medium">{t('data.credits')}</h3>
          <p className="text-sm text-ink-3">{t('app.disclaimer')}</p>
        </section>
      </DialogContent>
    </Dialog>
  )
}
