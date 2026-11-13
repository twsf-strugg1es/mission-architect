# Submission videos: report

Team **Minus Zero**: Ahmad Farruk Towsif and MD Toslim Uddin Rahat.
NASA Space Apps Challenge 2026, challenge "Space Mission Design Game". Game: Mission Architect.

## The files

| Video | File | Length (ffprobe) | Picture | Size |
| --- | --- | --- | --- | --- |
| A, local judging | `tools/video/out/mission-architect-local-240s.mp4` | ⟨pending⟩ | 1920×1080, 30 fps, H.264 + AAC | ⟨pending⟩ |
| A, small copy | `tools/video/out/mission-architect-local-240s-small.mp4` | ⟨pending⟩ | ⟨pending⟩ | ⟨pending⟩ |
| B, global judging | `tools/video/out/mission-architect-global-30s.mp4` | ⟨pending⟩ | 1920×1080, 30 fps, H.264 + AAC | ⟨pending⟩ |
| B, small copy | `tools/video/out/mission-architect-global-30s-small.mp4` | ⟨pending⟩ | ⟨pending⟩ | ⟨pending⟩ |
| Poster | `tools/video/out/poster.png` | still | 1920×1080 PNG | ⟨pending⟩ |

**Length check: ⟨pending⟩**

## How the gameplay was recorded

- From the **local production build** (`npm run build`, then `npm run preview` on this computer, port 4173). There is no live link yet, so no video shows or speaks a URL. Both end cards say "Play it live — link on our project page."
- Seed `?seed=5`, Cadet, Moon, Falcon Heavy with the Advanced chemical engine (the game's plain name for the cryogenic engine), the 11 parts of the verified playthrough and 32 t of fuel. The run ends with grade ⟨pending⟩.
- Chrome ran full screen (kiosk mode) at 1920×1080 with 100% zoom, driven by `tools/video/record.mjs`. OpenScreen recorded only that window, so no other window, notification, browser bar or mouse pointer is in the footage.
- Clips in `tools/video/raw/`, unedited, each with a `.marks.json` of its key moments: `01-home`, `02-destination`, `03-builder` (including about 15 s of a design blocked for having no power), `04-window-flight`, `05-results`, plus an extra `06-about-numbers` for the spoken NASA data line (the brief's "Data & Assumptions" screen is now called "About the numbers").
- Before recording, the whole run was rehearsed in a hidden browser (`DRY=1 node tools/video/record.mjs`).

## Tools

| Tool | Repo | How installed | Version | Used for |
| --- | --- | --- | --- | --- |
| OpenScreen | github.com/getopenscreen/openscreen | Windows installer from the official GitHub release, for this user only | 2.2.2 | Recording the gameplay, through its command line (`openscreen record --window`) |
| Remotion | github.com/remotion-dev/remotion | `npx create-video@latest` (blank template) in `tools/video/remotion/`, with its own `package.json` and lockfile; not added to the game | 4.0.543 | All cuts, zooms, title and end cards, subtitles and renders |
| Buzz | github.com/chidiwilliams/buzz | Windows installer from the official GitHub release, for this user only. The first attempt failed because Git Bash rewrote the installer's `/VERYSILENT` switches into file paths; the second attempt installed | 1.4.5 | Voiceover to English subtitles (`buzz add --srt`, Faster Whisper "small", English) |
| compressO | github.com/codeforreal1/compressO | Windows installer from the official GitHub release, for this user only. Its command line only works after the app has been opened once | 4.1.0 | ⟨pending⟩ |
| ffmpeg | Gyan.FFmpeg via `winget`, as the brief says | 9.0.2 | Checking files, voice loudness, frame checks |

Remotion's licence is free for individuals and for companies of up to 3 people, so a team of 2 can use it for free.

## Spec checklist

| Spec | Video A | Video B |
| --- | --- | --- |
| Team name | ✓ title card, spoken, end card | ✓ title card, spoken, end card |
| Every member by name | ✓ shown and spoken | ✓ title card and end card |
| Problem and challenge | ✓ | ✓ |
| Working demo (real gameplay) | ✓ | ✓ |
| NASA data stated out loud | ✓ | ✓ |
| English subtitles | ✓ burned in | ✓ burned in |
| Credits line on the end card | ✓ | ✓ |
| No language toggle shown | ✓ | ✓ |
| No URL shown or spoken | ✓ | ✓ |
| No one under 18 (team confirmed) | ✓ | ✓ |
| Length | ⟨pending⟩ | ⟨pending⟩ |

## Choices made in the edit

- The compositions are called `VideoA-Local240` and `VideoB-Global30`: Remotion names allow only letters, digits and hyphens, so the brief's underscores became hyphens.
- Script A is read as 11 lines, split only at sentence ends: the same words in the same order. Each line can be re-read on its own and sits on its own footage.
- Video A shows the two quiet flight stretches between events at 2× speed, with an on-screen label saying so. The recording itself is at 1×. Without this, Video A would be over 4 minutes.
- The slow 1.0 → 1.15 zoom is used only on the delta-v panel and on the first event card.
- During gameplay without voice, a small label in the empty left margin names what is on screen.
- Video B follows the cut list: title 3 s, builder with delta-v zoom 10 s, event card 8 s, results 5 s, end card 3.5 s. That is 29.5 s, to stay under 30 s.
- End-card credits (both videos): "Built with AI assistance (Claude Code) — disclosed on our project page"; subtitles transcribed with Buzz (OpenAI Whisper); fonts Geist and Geist Mono by Vercel (SIL Open Font License); "Not affiliated with or endorsed by NASA." No music or other third-party assets are used.
- Voice: ⟨pending⟩

## Anything that looked wrong in the game

Nothing was fixed (no game code was changed). Seen on camera at 1920×1080:

1. **Builder: the rocket equation is below the screen at first.** The "Your spacecraft" panel is as tall as the screen, but with the page at the top it starts about 180 px down, so its last part (the rocket-equation box) is cut off at the bottom. Scrolling the panel itself moves it only about 20 px. It shows once the page is scrolled a little, which is what the recording does.
2. **Event card: the first choice looks already picked.** When the card opens, the first answer gets the keyboard focus ring (the same look as a selected card), so viewers may think it was chosen.
3. **Event card: "not on board" and "Not ready" side by side.** "What helps here" shows both labels for the same missing part (a Backup Computer). One would be enough.
4. **Results: two debrief lines seem to disagree.** "You had little spare fuel, so you could not fly around the danger" sits right above "You had 9.8% extra delta-v. That gave you room to change your plans." The first uses the fuel left at the time of the event (8.9%), the second the fuel at launch, but on screen they read as a contradiction.

## Housekeeping

- `tools/video/raw/`, `tools/video/out/` and the voice recordings (`tools/video/assets/voice-*`) are git-ignored: the clips and renders are large, and the voices are personal. The scripts, the edit code and this report are committed.
- OpenScreen also keeps its own copy of every recording in `%APPDATA%\openscreen\recordings\`. These copies can be deleted.
- `tools/video/remotion/public/raw`, `public/assets` and `public/build` are folder links (junctions) to the media. On a fresh copy, recreate them with `mklink /J`.
- Remotion's preview server must not use port 3000 on this computer (another app uses it), so the render commands pass `--port=3917`.

## How to make them again

```bash
npm run build && npm run preview
```

```bash
node tools/video/record.mjs
```

```bash
node tools/video/write-scripts.mjs
```

⟨pending: voice and render commands⟩

**brag and hyperframes were NOT installed or used.**
