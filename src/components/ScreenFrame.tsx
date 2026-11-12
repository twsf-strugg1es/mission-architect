import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  title: string
  intro?: string
  backLabel: string
  onBack: () => void
  nextLabel?: string
  onNext?: () => void
  nextDisabled?: boolean
  /** shown next to a disabled Continue so the reason is never hidden */
  nextHint?: string
  children: ReactNode
}

/** Title, intro, content, then Back / Continue. Every flow screen uses it. */
export function ScreenFrame({ title, intro, backLabel, onBack, nextLabel, onNext, nextDisabled, nextHint, children }: Props) {
  return (
    <section aria-labelledby="screen-title" className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:py-8">
      <div className="space-y-2">
        <h1 id="screen-title" tabIndex={-1} className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {title}
        </h1>
        {intro && <p className="max-w-3xl text-muted-foreground">{intro}</p>}
      </div>
      {children}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <Button variant="outline" size="lg" onClick={onBack}>
          <ArrowLeft aria-hidden data-icon="inline-start" />
          {backLabel}
        </Button>
        {nextLabel && onNext && (
          <div className="flex flex-wrap items-center gap-3">
            {nextDisabled && nextHint && <p className="text-sm text-muted-foreground">{nextHint}</p>}
            <Button size="lg" onClick={onNext} disabled={nextDisabled}>
              {nextLabel}
              <ArrowRight aria-hidden data-icon="inline-end" />
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
