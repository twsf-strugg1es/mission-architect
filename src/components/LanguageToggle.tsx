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
    <div role="group" aria-label={t('lang.label')} className="flex border border-rule p-0.5">
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          lang={l.id}
          aria-pressed={locale === l.id}
          onClick={() => setLocale(l.id)}
          className={cn(
            'relative min-h-8 px-3 text-sm transition-colors duration-(--dur-micro) after:absolute after:inset-x-0 after:-inset-y-1.5',
            locale === l.id ? 'bg-signal text-signal-ink' : 'text-ink-3 hover:text-ink',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
