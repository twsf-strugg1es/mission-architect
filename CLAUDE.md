# Mission Architect

## Context

- **Project:** "Mission Architect", a web-based space mission design game for the NASA Space Apps Challenge 2026, challenge "Space Mission Design Game".
- **Game loop:** the player chooses a destination (Moon / Mars / asteroid), picks a launch vehicle, and assembles a spacecraft from modules with real mass / cost / power / science values. Live budget bars track mass vs launcher capacity, budget, power, and delta-v from the rocket equation Δv = Isp × g0 × ln(m0/mf). Then they choose a launch window, fly a simulation with random event cards (solar flare, equipment failure, etc.), and get a score plus an educational debrief.
- **NASA data sources:** NASA Open Science Data Repository (OSDR, incl. RadLab radiation data), NASA Planetary Fact Sheets (NSSDC), NASA JPL Small-Body Database, and NASA DONKI space weather via api.nasa.gov.
- **Constraints:** hackathon deadline. Keep everything lean: no heavy frameworks, no backend, no database, no auth. Deployed as a static site.

## Stack

| Layer | What is installed |
| --- | --- |
| Build | Vite 8 (`npm run dev`, `npm run build` = `tsc -b && vite build`, `npm run lint` = oxlint) |
| UI | React 19 + TypeScript 7 |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite`; no tailwind config file, theme tokens live in `src/index.css` |
| Components | shadcn/ui, style `radix-nova` (Radix primitives, Lucide icons, Geist font). Installed: button, card, slider, progress, badge, dialog, tabs, tooltip. Add more with `npx shadcn@latest add <name>` |
| State | zustand 5 |
| Animation | motion (`import { motion } from "motion/react"`) |
| Icons | lucide-react |

Import alias: `@/` maps to `src/`. The app is wrapped in `TooltipProvider` (`src/main.tsx`) and runs in dark mode (`class="dark"` on `<html>`).

## Folder structure

```
src/
  game/
    data/      JSON data: destinations, vehicles, modules, events
    engine/    pure simulation functions
    store/     zustand store
  components/  UI components (shadcn primitives in components/ui/)
  screens/     game screens
  lib/         shadcn cn helper
tools/         dev artefacts (setup screenshot)
scrollcraft/   scroll-craft workspace (landing/story builds, fingerprint registry)
```

## Tools installed in this project

| Tool | Where it lives | When to use it |
| --- | --- | --- |
| hallmark (skill) | `.claude/skills/hallmark/`, pinned in `skills-lock.json` | Any UI or design pass. `/hallmark <prompt>`; `/hallmark audit <path>` reports only. |
| ponytail (plugin) | enabled in `.claude/settings.json`; Claude Code caches the files in `~/.claude/plugins/` | Always on as lean-coding mode. Run `/ponytail:ponytail-review` for code reviews and before or after refactors, `/ponytail:ponytail-audit` for the whole repo. Keep code lean. |
| scroll-craft (plugin `nateherk-design`) | enabled in `.claude/settings.json`; workspace in `scrollcraft/` | Landing / story page only, never the core game screens. `/nateherk-design:scroll-craft`. |
| Playwright MCP | `.mcp.json`, `npx @playwright/mcp@latest` | After every feature: run the game (`npm run dev`), click through the flow, take a screenshot. |
| Firecrawl MCP | `.mcp.json`, `npx -y firecrawl-mcp`, key from the `FIRECRAWL_API_KEY` environment variable | Fetching NASA data pages and turning them into JSON in `src/game/data/`. Keep the source URL next to the numbers. |

## Working rules

- **Data-first.** Every game balance number (masses, costs, power, Isp, capacities, event odds, scoring) lives in JSON under `src/game/data/`. Never hard-code them in components.
- **Pure engine.** Simulation logic is pure functions in `src/game/engine/`. The rocket equation is implemented once and reused everywhere. Random event cards take their random source as an argument so the engine stays testable.
- **No backend.** Static site only: bake fetched data into JSON, or call public APIs from the browser. Vite only exposes `VITE_`-prefixed env vars to the browser, and anything shipped to the browser is public.
- **Bangla + English toggle is planned.** Keep user-facing text out of game logic so it can move into per-language string files. Geist has no Bengali glyphs, so add a Bengali font when the toggle lands.
- **Accessibility matters.** Pair numbers and icons, never colour alone (every budget bar shows its value as text). Keyboard reachable, visible focus, respect reduced motion. Note: the generated shadcn `Progress` does not forward `value` to the Radix root, so it exposes no `aria-valuenow`; pass it through when building the budget bars.
- **Secrets.** Real keys only in the local `.env` (git-ignored). `.env.example` lists the keys.
