import { BookOpen, Database, ExternalLink, Rocket, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChoiceCard } from '@/components/ChoiceCard'
import { byId, DESTINATIONS, DIFFICULTIES } from '@/game/data'
import type { DictKey } from '@/game/i18n'
import { useGame } from '@/game/store/useGame'
import { useI18n } from '@/game/useI18n'
import type { HintMode } from '@/game/types'

const HINTS: Record<HintMode, DictKey> = { on: 'diff.hints.on', onDemand: 'diff.hints.onDemand', off: 'diff.hints.off' }

export function HomeScreen() {
  const { t, n } = useI18n()
  const { difficultyId, setDifficulty, startNewMission, setOverlay, best } = useGame()

  return (
    <section className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:py-16">
      <div className="max-w-3xl space-y-5">
        <h1 className="text-4xl font-medium text-balance sm:text-6xl">{t('app.title')}</h1>
        <p className="text-lg text-ink-2 sm:text-xl">{t('app.tagline')}</p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={startNewMission}>
            <Rocket aria-hidden data-icon="inline-start" />
            {t('home.start')}
          </Button>
          <Button size="lg" variant="outline" onClick={() => setOverlay('howToPlay')}>
            <BookOpen aria-hidden data-icon="inline-start" />
            {t('home.howToPlay')}
          </Button>
          <Button size="lg" variant="outline" onClick={() => setOverlay('data')}>
            <Database aria-hidden data-icon="inline-start" />
            {t('home.data')}
          </Button>
          <Button size="lg" variant="outline" asChild>
          <a href="https://github.com/twsf-strugg1es/mission-architect" target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden data-icon="inline-start" />
            GitHub
          </a>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 id="difficulty" className="text-lg font-medium">
          {t('home.difficulty')}
        </h2>
        <div role="group" aria-labelledby="difficulty" className="grid gap-3 sm:grid-cols-3">
          {DIFFICULTIES.map((d) => {
            const [min, max] = d.eventCount
            return (
              <ChoiceCard key={d.id} selected={d.id === difficultyId} onSelect={() => setDifficulty(d.id)} selectedLabel={t('common.selected')}>
                <span className="text-xl font-medium">{d.name}</span>
                <span className="text-sm text-ink-3">{d.description}</span>
                <ul className="mt-auto space-y-0.5 text-sm tabular-nums">
                  <li>{t('diff.budget', { x: n(d.budgetMultiplier, 2) })}</li>
                  <li>{t('diff.deltaV', { x: n(d.deltaVMultiplier, 2) })}</li>
                  <li>{min === max ? t('diff.events', { n: min }) : t('diff.eventsRange', { min, max })}</li>
                  <li>{t(HINTS[d.hints])}</li>
                </ul>
              </ChoiceCard>
            )
          })}
        </div>
      </div>

      <p className="flex items-center gap-2 text-sm">
        <Trophy className="size-4 text-ink-3" aria-hidden />
        <span className="font-medium">{t('home.best')}:</span>
        <span className="tabular-nums">
          {best
            ? t('home.bestValue', { score: best.score, grade: best.grade, dest: byId(DESTINATIONS, best.destinationId).name })
            : t('home.noBest')}
        </span>
      </p>

      <p className="max-w-3xl border-t border-rule pt-4 text-xs text-ink-3">{t('app.disclaimer')}</p>
    </section>
  )
}
