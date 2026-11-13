import { useEffect } from 'react'
import { StepIndicator } from '@/components/StepIndicator'
import { screenFromHash, useGame } from '@/game/store/useGame'
import { useI18n } from '@/game/useI18n'
import { BuilderScreen } from '@/screens/BuilderScreen'
import { DestinationScreen } from '@/screens/DestinationScreen'
import { HomeScreen } from '@/screens/HomeScreen'
import { DataDialog, HowToPlayDialog } from '@/screens/InfoDialogs'
import { LaunchWindowScreen } from '@/screens/LaunchWindowScreen'
import { ResultsScreen } from '@/screens/ResultsScreen'
import { SimulationScreen } from '@/screens/SimulationScreen'
import { VehicleScreen } from '@/screens/VehicleScreen'

const SCREENS = {
  home: HomeScreen,
  destination: DestinationScreen,
  vehicle: VehicleScreen,
  builder: BuilderScreen,
  launchWindow: LaunchWindowScreen,
  simulation: SimulationScreen,
  results: ResultsScreen,
}

function App() {
  const { t } = useI18n()
  const screen = useGame((s) => s.screen)
  const seed = useGame((s) => s.seed)
  const Screen = SCREENS[screen]

  // A hash typed or navigated to in an open tab (or back/forward) opens that screen.
  useEffect(() => {
    const onHash = () => {
      const { screen: current, go } = useGame.getState()
      const next = screenFromHash()
      if (next !== current) go(next)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // New screen: mirror it in the URL hash, start at the top, and move focus to its heading for screen-reader users.
  useEffect(() => {
    const { pathname, search } = window.location
    window.history.replaceState(null, '', screen === 'home' ? pathname + search : `${pathname}${search}#${screen}`)
    window.scrollTo(0, 0)
    document.getElementById('screen-title')?.focus({ preventScroll: true })
  }, [screen])

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-rule bg-paper-3">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <p className="font-medium">{t('app.title')}</p>
        </div>
        {screen !== 'home' && <StepIndicator current={screen} />}
      </header>
      <main className="flex-1">
        <Screen key={screen === 'simulation' ? `sim-${seed}` : screen} />
      </main>
      <HowToPlayDialog />
      <DataDialog />
    </div>
  )
}

export default App
