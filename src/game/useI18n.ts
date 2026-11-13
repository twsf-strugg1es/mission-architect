import { fmt, fmtSig, money, t } from './i18n'

const I18N = { t, n: fmt, sig: fmtSig, money }

/** UI strings and number formatting. The game is English only, so this never changes. */
export const useI18n = () => I18N
