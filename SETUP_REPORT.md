# Setup report: Mission Architect

Session date: 2026-11-13. Scope: setup only. Project folder: `D:\towsif hackaton\nasa spaceapps\mission-architect`.

| Tool / item | Type | Install location | Status | How I invoke or use it |
| --- | --- | --- | --- | --- |
| Node v25.2.1, npm 11.6.2, git 2.52.0 | tool | already on the machine | OK (Node ≥ 20) | — |
| Vite 8.3.8 + React 19.3.1 + TypeScript 7.0.2 (react-ts template) | npm | `package.json`, `package-lock.json` | OK: `npm run build` passes | `npm run dev`, `npm run build`, `npm run lint` (oxlint) |
| Tailwind CSS 4.3.5 via `@tailwindcss/vite` | npm | `vite.config.ts`, `src/index.css` | OK | Utility classes; theme tokens in `src/index.css` |
| zustand 5.1.0, motion 14.13.0, lucide-react 1.72.0 | npm | `package.json` | OK (installed, not used yet) | `zustand`, `motion/react`, `lucide-react` imports |
| shadcn/ui (CLI 4.23.0, style `radix-nova`): button, card, slider, progress, badge, dialog, tabs, tooltip | npm + generated code | `components.json`, `src/components/ui/` | OK: all 8 type-check; Button and Progress render on the placeholder | `import { Button } from "@/components/ui/button"`; more: `npx shadcn@latest add <name>` |
| hallmark 2.0.0 | skill | `.claude/skills/hallmark/` (copied files), pinned in `skills-lock.json` | OK: `/hallmark` registered | `/hallmark <prompt>`, `/hallmark audit <path>`, `/hallmark redesign <path>` |
| ponytail 5.3.3 (6 skills, 3 hooks) | plugin | enabled in `.claude/settings.json` (project scope); Claude Code keeps the files in `~/.claude/plugins/cache/ponytail/` | OK: all 6 commands registered | Always on. `/ponytail:ponytail-review`, `/ponytail:ponytail-audit`, `/ponytail [lite\|full\|ultra\|off]`, `/ponytail:ponytail-help` |
| scroll-craft (plugin `nateherk-design` 0.3.1) | plugin | enabled in `.claude/settings.json`; files in `~/.claude/plugins/cache/nateherk/`; workspace `scrollcraft/` | OK: registered. Its doctor reports ffmpeg missing, needed before it builds pages | `/nateherk-design:scroll-craft` |
| Playwright MCP (`@playwright/mcp@latest`, currently 0.0.85) | MCP | `.mcp.json` | OK: connects from Claude Code; used it to take the setup screenshot. Waiting for your approval | Ask Claude to run the game and screenshot it; tools `mcp__playwright__browser_*` |
| Firecrawl MCP (`firecrawl-mcp` 3.40.0) | MCP | `.mcp.json`, key from the `FIRECRAWL_API_KEY` environment variable | Pending key: connects in keyless mode (scrape and search only, rate-limited) | Ask Claude to fetch a NASA page into `src/game/data/`; tools `mcp__firecrawl__*` |
| CLAUDE.md | doc | project root | OK | Loaded by Claude Code in every session opened in this folder |
| Setup screenshot | tool | `tools/setup-screenshot.png` | OK: heading found, button click works, 0 console errors | — |
| Git repo, first commit | tool | `.git/`, branch `master` | OK: `8085216 chore: project scaffold, skills and MCP setup` | — |

## Needs your action

1. **Open `mission-architect` as the folder for your next Claude Code session.** This session started in the parent folder. `.mcp.json`, the project plugins in `.claude/settings.json` and `CLAUDE.md` load from the folder a session starts in.
2. **Approve the MCP servers** (playwright, firecrawl) when the new session asks, and trust the folder (ponytail runs hooks). You will know they loaded when `/mcp` lists both as connected and Claude has tools named `mcp__playwright__browser_navigate` and `mcp__firecrawl__firecrawl_scrape`.
3. **Firecrawl key.** Claude Code does not read `.env` for MCP servers; `.mcp.json` takes the key from your environment. In your own terminal run `setx FIRECRAWL_API_KEY "fc-your-key"`, then fully quit and reopen the Claude app. Don't paste the key into chat. Until then Firecrawl runs keyless.
4. **NASA key.** Get one at api.nasa.gov and put it in `.env` (`DEMO_KEY` works but is heavily rate-limited). Vite only exposes `VITE_`-prefixed variables to browser code, and anything in the browser bundle is public.
5. **ffmpeg for scroll-craft** (system-level install, so your call): `winget install Gyan.FFmpeg`, or point `SCROLLCRAFT_FFMPEG` at a full build. Its doctor marks ffmpeg as required before building; it is used to encode scroll-scrubbed video.
6. Optional: hallmark's in-browser checks need puppeteer-core. The README says `npm i -g puppeteer-core`, but hallmark's scripts also look in the project, so `npm i -D puppeteer-core` works without a global install. The static checks run without it.
7. Optional: scroll-craft's verification pass needs `npm i playwright-core` in its build folder.
8. Your terminal `claude` CLI (2.1.245) has an expired login. This only matters if you use Claude Code from a terminal.
9. This report was written after the commit, following the step order, so it is not committed yet.

## Skipped, and why

- **No global installs.** puppeteer-core (optional for hallmark) and ffmpeg (scroll-craft, system-level) were not installed.
- **hallmark's `install-hook.mjs`** (an edit-time lint hook): the README offers it only in the install-from-a-clone route, so it was not added.
- **MCP approval:** left for you (step 2 above).
- **In-app preview runner:** it only reads a launch config from the parent folder, so the dev server was started directly for the check. `.claude/launch.json` stays in the project for when you open this folder.

## Differences from your instructions (README wins)

1. **hallmark:** ran `npx skills add nutlope/hallmark --agent claude-code --skill hallmark --copy -y`. The README's command is `npx skills add nutlope/hallmark -g` and says to leave off `-g` to install into the current project. `--agent claude-code` is the README's one-harness option. `--copy` writes real files instead of symlinks, so the skill travels with git on Windows. `-y` is for non-interactive mode. Telemetry was off for the run (`DO_NOT_TRACK=1`, `DISABLE_TELEMETRY=1`). The CLI also wrote `skills-lock.json`.
2. **ponytail and scroll-craft:** both READMEs install a Claude Code plugin (`/plugin marketplace add …` then `/plugin install …`), not a `.claude/skills/` folder. I ran the CLI equivalents with `--scope project`, so the marketplace and enablement live in `.claude/settings.json` and travel with the repo; teammates get prompted to install. Plugin files always live in Claude Code's cache (`~/.claude/plugins/`); there is no in-project option. Plugin commands are namespaced, so the README's `/ponytail-review` is `/ponytail:ponytail-review`.
   - ponytail runs 3 hooks (SessionStart, SubagentStart, UserPromptSubmit: Node scripts that load and track its mode) and adds about 430 tokens per session. By default it logs per-task cost rows locally to `~/.config/ponytail/band/`; its webhook is empty, so nothing leaves the machine. `/ponytail off` turns it off.
   - scroll-craft's README first-run steps were run: `doctor.mjs` (ffmpeg missing, playwright-core not installed, Chrome found) and `workspace.mjs --ensure`, which created `scrollcraft/` with an empty `FINGERPRINTS.md` registry.
3. **shadcn/ui:** the Vite guide adds `baseUrl` to the tsconfigs, but TypeScript 7 removed `baseUrl`, so only `paths` was added (tsc and the shadcn alias check both pass). `init` needs a component base and a preset; I chose Radix (`--base radix`) and the default Nova preset (`--preset nova`: Lucide icons, Geist font). shadcn 4 imports `cn` from its own `cn` npm package and adds `shadcn` as a dependency for its CSS. The app is wrapped in `TooltipProvider`, as the CLI instructs for tooltip.
4. **Tailwind:** v4 with the Vite plugin, which is what shadcn's Vite guide uses and works cleanly with Vite 8. I added `@source not` lines for `.claude/` and `scrollcraft/` in `src/index.css`: Tailwind v4 scans the whole repo, and hallmark's example pages had grown the CSS from 46.5 kB to 63.6 kB.
5. **Firecrawl config:** the README puts the key directly in `env`. `.mcp.json` uses `"${FIRECRAWL_API_KEY:-}"` instead, which Claude Code fills from your environment. The empty default keeps the config loading, so the server starts keyless instead of failing.
6. **Playwright check:** servers in a new `.mcp.json` load only in a new session after approval. For Step 5 I launched the same `npx @playwright/mcp@latest` server over stdio and drove it with its own tools: navigate, snapshot, click, console check, screenshot. Plain `npx` (no `cmd /c` wrapper) connects from Claude Code on this machine, checked with `claude mcp list` using temporary local entries that were removed afterwards.
7. **Small extras:** the Vite boilerplate README was replaced with a short one. Unused template files were removed (`App.css`, `src/assets/*`, `public/icons.svg`). `.gitignore` also ignores `.playwright-mcp/`, where the Playwright MCP writes its logs and snapshots. The placeholder's "Run systems check" button fills the progress bar, which proves React state and the Radix components work.

## No game features built

`src/game/data`, `src/game/engine`, `src/game/store` and `src/screens` contain only `.gitkeep`. The only UI is the placeholder page: heading, Progress bar, Button.

Two notes for the next session are recorded in `CLAUDE.md`:
- The generated shadcn `Progress` doesn't pass `value` to Radix, so screen readers get no `aria-valuenow`.
- Geist has no Bengali glyphs.
