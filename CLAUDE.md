# Mission Architect

## Context

- **Project:** "Mission Architect", a web-based space mission design game for the NASA Space Apps Challenge 2026, challenge "Space Mission Design Game".
- **Game loop:** the player chooses a destination (Moon / Mars / asteroid), picks a launch vehicle, and assembles a spacecraft from modules with real mass / cost / power / science values. Live budget bars track mass vs launcher capacity, budget, power, and delta-v from the rocket equation Δv = Isp × g0 × ln(m0/mf). Then they choose a launch window, fly a simulation with random event cards (solar flare, equipment failure, etc.), and get a score plus an educational debrief.
- **NASA data sources:** NASA Open Science Data Repository (OSDR, incl. RadLab radiation data), NASA Planetary Fact Sheets (NSSDC), NASA JPL Small-Body Database, and NASA DONKI space weather via api.nasa.gov.
- **Constraints:** hackathon deadline. Keep everything lean: no heavy frameworks, no backend, no database, no auth. Deployed as a static site.

## Stack

| Layer | What is installed |
| --- | --- |
| Build | Vite 8 (`npm run dev`, `npm run build` = `tsc -b && vite build`, `npm run lint` = oxlint, `npm test` = vitest on `src/`) |
| UI | React 19 + TypeScript 7 |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite`; no tailwind config file. Design tokens (hallmark Rim, station colourway) in `src/tokens.css`, base rules in `src/base.css`, shadcn variables mapped to them in `src/index.css` |
| Components | shadcn/ui, style `radix-nova` (Radix primitives, Lucide icons). Installed: button, card, slider, progress, badge, dialog, tabs, tooltip. Add more with `npx shadcn@latest add <name>` |
| Fonts | Geist (UI), Geist Mono (every measured number), Hind Siliguri (Bengali glyphs), all self-hosted via @fontsource |
| State | zustand 5 |
| Animation | motion (`import { motion } from "motion/react"`) |
| Icons | lucide-react |

Import alias: `@/` maps to `src/`. The app is wrapped in `TooltipProvider` (`src/main.tsx`) and is dark only (`class="dark"` on `<html>`). Screens are state-driven (no router); the current screen is mirrored in the URL hash (`#builder`), and `?seed=N` pins the flight RNG.

## Folder structure

```
src/
  game/
    data/      JSON data (destinations, vehicles, engines, modules, events, difficulties, rules) + typed index.ts + data.test.ts
    engine/    pure functions: physics (rocket equation), build (totals, checks), mission (seeded sim), score (+ tests)
    store/     zustand store (screen state machine, persisted language/difficulty/best score)
    i18n.ts    en + bn UI dictionary; useI18n.ts binds it to the store
  components/  UI components (shadcn primitives in components/ui/)
  screens/     game screens
  lib/         shadcn cn helper
tools/         dev artefacts (setup screenshot, tools/build/ phase and playthrough screenshots)
.hallmark/     hallmark sweep records and screenshots (mostly git-ignored)
scrollcraft/   scroll-craft workspace (landing/story builds, fingerprint registry)
```

## Tools installed in this project

| Tool | Where it lives | When to use it |
| --- | --- | --- |
| hallmark (skill) | `.claude/skills/hallmark/`, pinned in `skills-lock.json`; render checks use the `puppeteer-core` dev dependency | Any UI or design pass. `/hallmark <prompt>`; `/hallmark audit <path>` reports only. Sweep before handing back UI work: `CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" node .claude/skills/hallmark/scripts/sloplint.mjs src --genre modern-minimal --scope app --render --url http://localhost:5173/#builder` (dev server running). |
| ponytail (plugin) | enabled in `.claude/settings.json`; Claude Code caches the files in `~/.claude/plugins/` | Always on as lean-coding mode. Run `/ponytail:ponytail-review` for code reviews and before or after refactors, `/ponytail:ponytail-audit` for the whole repo. Keep code lean. |
| scroll-craft (plugin `nateherk-design`) | enabled in `.claude/settings.json`; workspace in `scrollcraft/` | Landing / story page only, never the core game screens. `/nateherk-design:scroll-craft`. |
| Playwright MCP | `.mcp.json`, `npx @playwright/mcp@latest` | After every feature: run the game (`npm run dev`), click through the flow, take a screenshot. Screens deep-link via `#destination`, `#vehicle`, `#builder`, `#launchWindow`; `?seed=N` makes a flight reproducible. |
| Firecrawl MCP | `.mcp.json`, `npx -y firecrawl-mcp`, key from the `FIRECRAWL_API_KEY` environment variable | Fetching NASA data pages and turning them into JSON in `src/game/data/`. Keep the source URL next to the numbers. Keyless mode is refused on this network (flagged as VPN/proxy): it needs a real key. |

## Working rules

- **Data-first.** Every game balance number (masses, costs, power, Isp, capacities, event odds, scoring) lives in JSON under `src/game/data/`. Never hard-code them in components.
- **Pure engine.** Simulation logic is pure functions in `src/game/engine/`. The rocket equation is implemented once and reused everywhere. Random event cards take their random source as an argument so the engine stays testable.
- **No backend.** Static site only: bake fetched data into JSON, or call public APIs from the browser. Vite only exposes `VITE_`-prefixed env vars to the browser, and anything shipped to the browser is public.
- **Bangla + English everywhere.** Every UI string goes through `src/game/i18n.ts` (both locales, same keys; a test enforces it); game content comes from the JSON `{ en, bn }` fields. Numbers go through `fmt` so Bangla gets Bengali digits.
- **Accessibility matters.** Pair numbers and icons, never colour alone (`BudgetBar` shows value text, a status icon and words). Keyboard reachable, visible focus, respect reduced motion. Do not use the shadcn `Progress` for budgets: it exposes no `aria-valuenow`; use `src/components/BudgetBar.tsx`.
- **Design system (hallmark Rim, station).** Navy paper, one accent (`signal`) for the primary action, the current selection and state only; green/amber/red only as status beside an icon and words. Square hairline surfaces, nothing round, no glass, glow or starfield. Geist Mono for every measured number, never for labels or sentences. Headings at weight 500. Colours only through tokens; animate `transform`/`opacity` only.
- **Secrets.** Real keys only in the local `.env` (git-ignored). `.env.example` lists the keys.
