import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

// Setup placeholder: proves Vite + React + Tailwind + shadcn/ui render.
// Replaced by the game screens in the next session.
function App() {
  const [checked, setChecked] = useState(0)

  return (
    <main className="starfield flex min-h-svh flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          Mission Architect — setup complete
        </h1>
        <p className="text-muted-foreground">NASA Space Apps Challenge 2026 · Space Mission Design Game</p>
      </div>
      <div className="w-full max-w-sm space-y-2">
        <Progress value={checked} aria-label="Systems check" />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Systems check: {checked}%{checked === 100 && ' · all systems go'}
        </p>
      </div>
      <Button size="lg" onClick={() => setChecked(100)}>
        Run systems check
      </Button>
    </main>
  )
}

export default App
