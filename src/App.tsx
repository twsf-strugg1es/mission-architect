import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BudgetBar } from '@/components/BudgetBar'

// Phase 0 placeholder: checks the Bengali font fallback and the accessible BudgetBar.
// Replaced by the game screens in Phase 3/4.
function App() {
  const [checked, setChecked] = useState(40)

  return (
    <main className="starfield flex min-h-svh flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">Mission Architect</h1>
        <p lang="bn" className="text-xl">
          মিশন আর্কিটেক্ট
        </p>
      </div>
      <BudgetBar
        className="w-full max-w-sm text-left"
        label="Systems check"
        value={checked}
        max={100}
        valueText={`${checked} / 100 %`}
        status={checked === 100 ? 'ok' : 'warn'}
        statusText={checked === 100 ? 'All systems go' : 'Checks pending'}
      />
      <Button size="lg" onClick={() => setChecked(100)}>
        Run systems check
      </Button>
    </main>
  )
}

export default App
