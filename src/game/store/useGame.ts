// Game state machine: which screen is showing, the build in progress, the flight, and saved settings.
// No router: screens are driven by `screen`. Language, difficulty and best score persist in localStorage.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { byId, MODULES, RULES } from '../data'
import { createContext, type MissionState } from '../engine/mission'
import { scoreMission } from '../engine/score'
import type { Build, Grade, Locale } from '../types'

export type Screen = 'home' | 'destination' | 'vehicle' | 'builder' | 'launchWindow' | 'simulation' | 'results'
export type Overlay = 'howToPlay' | 'data' | null
export type Best = { score: number; grade: Grade; destinationId: string; difficultyId: string }

/** The mission flow after home, in order (for the step indicator and Back buttons). */
export const FLOW: Screen[] = ['destination', 'vehicle', 'builder', 'launchWindow', 'simulation', 'results']

const freshBuild = (): Build => ({
  destinationId: 'moon',
  vehicleId: 'falcon-heavy',
  engineId: 'cryogenic',
  propellantTonnes: RULES.propellant.startTonnes,
  modules: {},
})

/** ?seed=N in the URL pins the event RNG, so a playthrough can be replayed exactly. */
/** Screens that only need the build (which has defaults) can be opened from the URL hash, e.g. #builder. */
const LINKABLE: Screen[] = ['destination', 'vehicle', 'builder', 'launchWindow']
export const screenFromHash = (): Screen => {
  const hash = window.location.hash.slice(1) as Screen
  return LINKABLE.includes(hash) ? hash : 'home'
}

const newSeed = () => {
  const pinned = Number(new URLSearchParams(window.location.search).get('seed'))
  return Number.isInteger(pinned) && pinned > 0 ? pinned : Math.floor(Math.random() * 2 ** 31)
}

type GameState = {
  locale: Locale
  difficultyId: string
  best: Best | null
  screen: Screen
  overlay: Overlay
  build: Build
  windowId: string
  seed: number
  mission: MissionState | null
  newBest: boolean

  setLocale: (locale: Locale) => void
  setDifficulty: (id: string) => void
  setOverlay: (overlay: Overlay) => void
  go: (screen: Screen) => void
  startNewMission: () => void
  updateBuild: (patch: Partial<Build>) => void
  addModule: (id: string) => void
  removeModule: (id: string) => void
  setWindow: (id: string) => void
  launch: () => void
  setMission: (mission: MissionState) => void
  finishMission: () => void
  flyAgain: () => void
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      difficultyId: 'cadet',
      best: null,
      screen: screenFromHash(),
      overlay: null,
      build: freshBuild(),
      windowId: 'standard',
      seed: 0,
      mission: null,
      newBest: false,

      setLocale: (locale) => set({ locale }),
      setDifficulty: (difficultyId) => set({ difficultyId }),
      setOverlay: (overlay) => set({ overlay }),
      go: (screen) => set({ screen, overlay: null }),
      startNewMission: () => set({ screen: 'destination', build: freshBuild(), windowId: 'standard', mission: null }),
      updateBuild: (patch) => set((s) => ({ build: { ...s.build, ...patch } })),
      addModule: (id) =>
        set((s) => {
          const n = s.build.modules[id] ?? 0
          if (n >= byId(MODULES, id).maxCount) return s
          return { build: { ...s.build, modules: { ...s.build.modules, [id]: n + 1 } } }
        }),
      removeModule: (id) =>
        set((s) => {
          const modules = { ...s.build.modules }
          if ((modules[id] ?? 0) <= 1) delete modules[id]
          else modules[id] -= 1
          return { build: { ...s.build, modules } }
        }),
      setWindow: (windowId) => set({ windowId }),
      launch: () => set({ seed: newSeed(), mission: null, screen: 'simulation' }),
      setMission: (mission) => set({ mission }),
      finishMission: () => {
        const { build, difficultyId, windowId, mission, best } = get()
        if (!mission) return
        const { score, grade } = scoreMission(createContext(build, difficultyId, windowId), mission)
        const newBest = grade !== 'Fail' && (!best || score > best.score)
        set({
          screen: 'results',
          newBest,
          best: newBest ? { score, grade, destinationId: build.destinationId, difficultyId } : best,
        })
      },
      flyAgain: () => get().launch(),
    }),
    {
      name: 'mission-architect',
      partialize: (s) => ({ locale: s.locale, difficultyId: s.difficultyId, best: s.best }),
    },
  ),
)
