import { fmt, fmtSig, money, t, tx, type DictKey } from './i18n'
import { useGame } from './store/useGame'
import type { Text } from './types'

/** The dictionary bound to the current language. */
export function useI18n() {
  const locale = useGame((s) => s.locale)
  return {
    locale,
    t: (key: DictKey, vars?: Record<string, string | number>) => t(locale, key, vars),
    tx: (text: Text) => tx(locale, text),
    n: (value: number, digits = 0) => fmt(locale, value, digits),
    sig: (value: number, significant = 2) => fmtSig(locale, value, significant),
    money: (usdM: number) => money(locale, usdM),
  }
}
