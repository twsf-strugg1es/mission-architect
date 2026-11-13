# Build report: Mission Architect

Built 2026-11-13, phase by phase. Each phase passed `npm run build`, a Playwright MCP click-through with a screenshot, and a git commit.

| Phase | Commit | What landed |
| --- | --- | --- |
| 0 | `108a66b` | Bengali font fallback (Hind Siliguri), accessible `BudgetBar` |
| 1 | `b72e369` | NASA-sourced JSON data (7 files, each with sources), en/bn dictionary |
| 2 | `ea9cb6d` | Engine: rocket equation, launch checks, seeded mission sim, scoring, 21 tests |
| 3 | `bbb5d29` | zustand state machine, persisted settings, all screens wired |
| 4 | `d348e6a` | hallmark design pass (Rim, station colourway) on every screen |
| 5 | `9eb7d9b` | focus/keyboard polish, playthroughs, README, this report |

## Update: English only, in plain language

After the build, the game was changed to English only, and all of its text was rewritten in plain English for players with limited English.

- **Bangla removed:** the language switch, the Bangla dictionary, the `bn` side of every JSON text, the saved language setting and the Hind Siliguri font. JSON texts are now plain strings. The last bilingual version is commit `9eb7d9b`. The JS bundle shrank from 628 kB to 569 kB (199 kB to 184 kB gzipped).
- **Plain English:** every UI string and every piece of game content (destinations, rockets, engines, 20 parts, 12 events, levels, launch windows) was rewritten. Sentences are short, words are common, there are no idioms, each idea has one name, and space words are explained the first time ("Delta-v means change in speed").
  - Readability of all player-facing text: Flesch reading ease 74 → 87 (higher is easier), Flesch-Kincaid grade 4.4 → 2.5, words of 3+ syllables 11.6% → 7.5%, sentences over 15 words 12 → 1 (a list of NASA source names).
  - Hard part names became plain names, and each description keeps the real term: Robot Probe, Rock Scanner (spectrometer), Quake Sensor (seismometer), Nuclear Battery (RTG), Small and Big Antenna, Backup Computer, Solar Panels, Mini Science Lab. "Propellant" is "fuel" everywhere, and "modules" are "parts".
  - Sentences no longer put a destination name mid-sentence ("Moon needs…" became "You need…"), so no article ("the Moon") goes missing.
- **Only text changed.** A script flattened the 219 `{en, bn}` pairs and rewrote the strings, then checked that the JSON structure and every number stayed the same. The engine, balance and scoring are untouched.
- **Re-verified:** build, the 21 tests and lint all pass. The Playwright playthroughs below were re-run with the new wording (148 steps, all passed, no console errors). They used the same seeds and got the same grades, and confirmed that no Bengali text and no language switch remain.

## What was built, screen by screen

Screenshots are in `tools/build/`. `phase-0` to `phase-3` show the look before the Phase 4 design pass; the rest show the final look.

| Screen | What it does | Screenshot |
| --- | --- | --- |
| Home | Title, Start mission, three level cards (each card's multipliers shown from JSON), How to play and About the numbers overlays, best score (localStorage), non-affiliation note | `a-01-home.png`, `h-01-how-to-play.png`, `m-02-home-phone.png` |
| Destination | Moon, Mars, Bennu cards: distance (with what it measures), travel time, gravity, delta-v needed for the chosen difficulty, radiation, sunlight, dust storm risk, fun fact | `a-02-destination.png` |
| Rocket & engine | Four vehicles (capacity, cost, reliability, "in development" flag), four engines (Isp in one line, mass, cost, restrictions), propellant slider with a live delta-v readout | `a-03-vehicle.png` |
| Spacecraft (builder) | 20 modules in 7 groups with add/remove; summary with 4 budget bars (mass, cost, power, delta-v), capability tallies, the rocket equation filled with the player's own numbers, blocking problems and warnings in plain language, hints (auto on Cadet, on request on Engineer) | `a-04-builder.png`, `phase-4.png`, `b-01-builder-blocked.png`, `m-03-builder-phone.png` |
| Launch window | Early / Standard / Late cards with an SVG transfer sketch, travel days, delta-v needed vs yours, can / can't make it | `a-05-launch-window.png` |
| Flight | SVG trajectory with the craft dot driven by motion's `useAnimationFrame`, mission clock in days, leg strip, fuel and safety bars, science and budget, live log; event cards pause the flight and show "What matters here" with the player's real value; 1×/2× speed and Skip to next event; a clean run is 70 s at 1× | `a-06-flight.png`, `a-07-event-card.png`, `c-02-event-card.png`, `m-04-flight-phone.png` |
| Results | Big grade, score, per-part breakdown bars, a debrief built from this playthrough (each event with the choice made and what the build did, delta-v margin, an engine comparison computed from the rocket equation, window, science, comms, budget), mission log, Fly again / Change design / Home / Copy mission summary | `a-08-results.png`, `c-03-results.png`, `m-01-results-phone.png` |

## Playthroughs (Playwright MCP: Phase 5 run, 141 steps; re-run after the English-only change, 148 steps; all passed)

Flights use `?seed=N` so they are reproducible; event choices were made by label, picking the careful option. Names below are the current, plain-English ones.

| Run | Setup | What happened | Result |
| --- | --- | --- | --- |
| **a** | Cadet, Moon, Falcon Heavy, Advanced chemical engine, 32 t fuel, 11 parts (Robot Probe, Lander, Large Solar Panels, Big Antenna, Rock Scanner, Drill, HD Cameras, Quake Sensor, Rover, Spare Parts Kit, one Radiation Shield); seed 5 | Delta-v 5.83 vs 5.31 km/s, cost $937M of $2,250M. Events: Hit by space dust (not ready: no Backup Computer; stopped and checked everything, safety −8, science −1, +6 days), Danger at the landing site (not ready: spare fuel 8.9%, under 12%; landed carefully, safety −20, science −2) | **Mission complete, grade A, 79/100** |
| **b** | Cadet, Moon, Falcon 9, Basic chemical engine, Crew Capsule + Habitat, no power, 20 t fuel | Launch blocked under "You cannot launch yet": "Too heavy. Your spacecraft is 44.2 t. Falcon 9 can lift only 22.8 t.", "Not enough power. You use 5.00 kW but make only 0.00 kW.", "Not enough delta-v. You have 1.95 km/s. You need 5.31 km/s.", "This mission must land. Add a Lander."; Continue verified disabled in the DOM; the Cadet hint shows | **Blocked, as intended** |
| **c** | Commander, Mars, Falcon Heavy, Advanced chemical engine, 48 t fuel, 13 parts (adds Nuclear Battery, Extra Batteries, Backup Computer); seed 3 | Delta-v 7.06 vs 6.62 km/s, cost $1,117M of $1,125M. **5 events:** Solar flare! (ready, protection 8: safety −3), Radio contact lost (ready, Big Antenna: +3 days), Danger at the landing site (not ready: landed carefully, safety −20, science −2), A chance to discover something (ready: kept to the plan), A part broke (ready, Spare Parts Kit: +2 days) | **Mission complete, grade C, 60/100** (Commander's C is 58+; almost no budget left, so 0 budget points) |

The same run also checked:
- English only: no Bengali text, no language switch and `lang="en"` on the home and both results screens.
- The How to play (`h-01-how-to-play.png`) and About the numbers dialogs show the plain-English text.
- No horizontal scroll at 390 px on all seven screens, each one confirmed by its title.
- A keyboard-only path: the first Tab reaches Start mission with a solid focus outline, Enter starts, Tab plus Space selects a destination card.

Balance, from the engine over 200 seeded flights each:
- Careful Cadet Moon flights pass 100% of the time (average 87).
- Always taking the first option fails 35% of the time, so choices matter.
- The lean Commander Mars build lands B or C.

## Verification summary

- `npm run build` passes (`tsc -b` + Vite). There are no `any` types, `@ts-ignore` or `@ts-expect-error` anywhere in `src/`.
- `npm test`: 21 vitest tests pass. They cover the engine (rocket equation and its inverse, totals and solar scaling, every launch rule, seeded determinism, event conditions, completion rates, score parts) and data integrity (the brief's values, sources, 20 modules, 12 events, every UI string filled in).
- `npm run lint` (oxlint) shows no warnings in game code. The three left are fast-refresh notes in the generated shadcn files.
- **Console errors: none in any Playwright MCP run.** Every phase run ended by checking `browser_console_messages` and found 0 errors.
- hallmark sweep (`sloplint --scope app --render`, five screens): **0 FAIL, 0 REFLEX, 0 WARN**, with gate 39b waived on the record and F18 answered. The builder went from 43 FAIL / 59 REFLEX to 0 / 0, keeping every link, handler, heading and figure. The fresh-context finish review returned "fix" with 8 findings, all fixed. Before/after: `.hallmark/compare.html`.

## Simplifications and open items

**Data**
- **Firecrawl could not fetch.** Its keyless mode refused this network ("looks like a VPN or proxy", needs an API key). As your fallback rule allowed, the NSSDC Moon and Mars fact sheets and the JPL SBDB entry for Bennu were read directly, once each, and the values baked in. Every `sources` note says so. With a `FIRECRAWL_API_KEY`, the same three pages can be re-fetched through the MCP to double-check.
- **RadLab link:** `visualization.osdr.nasa.gov/radlab/` returned HTTP 500 at build time, so RadLab is credited through the OSDR page (`osdr.nasa.gov/bio/`). The DONKI host (`kauai.ccmc.gsfc.nasa.gov`) timed out, so DONKI is linked through its CCMC page. Every URL in the game returned HTTP 200 when checked.
- **Bennu sunlight 0.85** is the value from your brief. The inverse-square law at Bennu's mean distance (1.13 AU) gives 0.79. The value is kept and both numbers are documented in the data file.
- **Distances:**
  - Mars: midpoint of the NSSDC minimum and maximum distance from Earth (228 million km).
  - Bennu: midpoint of its closest and farthest distance from Earth, computed from its SBDB orbit (177 million km).
  - The game labels what each number means.
- **Travel times:**
  - Moon: 3 days (Apollo).
  - Mars: 210 days (about seven months; Perseverance took 203).
  - Bennu: 816 days (OSIRIS-REx).
- **Bennu gravity** (0.000083 m/s²) is computed as GM / r² from SBDB's GM and diameter.

**Model**
- **Delta-v:** one simplified number per destination (the brief's 5.9 / 6.3 / 5.1 km/s) covers the whole mission. Each flight leg spends a fixed share of it (launch 50%, transit 5%, arrival 35%, return 10%).
- **Fuel:** "Fuel" is the delta-v budget in %, not tonnes. "Spare fuel" is what is left after the burns still planned. A one-way robotic mission's last leg is a short "Report" that still spends its 10% (final manoeuvres).
- **Radiation:** the levels are the brief's 0–1 values. Crews take a dose only on transit and return legs, reduced by protection. There is no dose model for robots; solar flares and micrometeorites cover them.
- **Values added beyond the brief:**
  - the ion engine draws 2.5 kW;
  - the battery bank supplies 0.5 kW during storms;
  - in a dust storm only 30% of solar output remains;
  - vehicle reliability sets the chance of a launch anomaly;
  - each destination has a science target (16 / 20 / 12).
- **Part simplifications:** one Lander serves crewed and robotic missions. The Rover, Drill and Quake Sensor still count at Bennu even though nothing lands there.
- **Costs and reliabilities:** rounded public prices or game estimates. Starship's $250M and 100 t are planning values. SLS's $2.2B makes it unaffordable on purpose.
- **Shielding:** the Radiation Shield is one part you can add twice (one layer is light, two is heavy), which keeps the catalogue at 20 parts.

**Product and code**
- **Plain English.** All text was rewritten for players with limited English (see the update at the top). A read-through by an English teacher, or a test with a few young players, would still catch words that are too hard.
- **The design pass was a restyle.** The builder keeps its two-column catalogue, which is the weakest point in the critique. A full redesign of that layout is a possible next pass.
- **Unused shadcn parts:** Card, Tabs, Progress and Tooltip (apart from its provider) are left over from setup. They were made Floor-clean but aren't used.
- **Bundle size:** 628 kB JS (199 kB gzipped) triggers Vite's chunk-size notice. Fine for a static game; it could be split later.
- **`npm audit`** flags deepmerge and minimatch inside the `shadcn` CLI's dependencies. That's dev-time tooling, not in the browser bundle, so it was not force-fixed.
- **Added for verification:** `puppeteer-core` (a project dev dependency) for hallmark's render checks, and the `?seed=` and `#screen` URL handling.
- **MCP tools:** the Playwright and Firecrawl MCP tools were not loaded in this session, because the session started in the parent folder. Their servers were driven over stdio with the exact `.mcp.json` commands, via a scratch script outside the repo. This session moves to the `mission-architect` folder for your next turn, so approve both servers when asked.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test
npm run build      # dist/
npm run preview    # serve dist/
```

## Deploy the static build (`dist/`)

Screens use the URL hash, so no server rewrite rules are needed on any host.

- **Vercel**
  - Dashboard: New Project, import the GitHub repo, framework preset **Vite**, build command `npm run build`, output directory `dist`, Deploy.
  - CLI, without a global install: `npx vercel` in the project folder (log in when asked), then `npx vercel --prod`.
- **Netlify**
  - Dashboard: Add new site, import the repo, build command `npm run build`, publish directory `dist`.
  - No account setup: run `npm run build`, then drag the `dist/` folder onto app.netlify.com/drop.
  - CLI: `npx netlify-cli deploy --prod --dir=dist`.
- **GitHub Pages** (served from `/<repo-name>/`)
  1. Build with that base: `npm run build -- --base=/mission-architect/` (use your repo's name).
  2. In the repo, Settings, Pages, Source: **GitHub Actions**. Add a workflow that runs `npm ci` and the build above, then `actions/upload-pages-artifact` with `path: dist` and `actions/deploy-pages`.
  3. Without Actions: `npx gh-pages -d dist` publishes `dist/` to a `gh-pages` branch. Set Pages to deploy from that branch.

## Confirmation

The game is playable end to end: home → destination → rocket and engine → builder → launch window → animated flight with event cards → results with debrief, in plain English, on desktop and phone width, by mouse or keyboard. No console errors appeared in any Playwright run.
