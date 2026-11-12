import { useGame } from '@/game/store/useGame'
import { useI18n } from '@/game/useI18n'
import { cn } from '@/lib/utils'

const LANGS = [
  { id: 'en', label: 'EN' },
  { id: 'bn', label: 'বাংলা' },
] as const

export function LanguageToggle() {
  const { locale, t } = useI18n()
  const setLocale = useGame((s) => s.setLocale)
  return (
    <div role="group" aria-label={t('lang.label')} className="flex rounded-lg border border-border p-0.5">
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          lang={l.id}
          aria-pressed={locale === l.id}
          onClick={() => setLocale(l.id)}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-signal',
            locale === l.id ? 'bg-signal text-background' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
