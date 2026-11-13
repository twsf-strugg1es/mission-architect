// Maps a voiceover to the script for the Remotion edit. Reads Buzz's subtitles (assets/captions-<a|b>.srt,
// names and terms already fixed), finds each script line's good take and writes assets/voice-<a|b>.json.
// A messed-up line is re-read after a pause, so the LAST complete reading of each line wins.
// usage: node tools/video/voice-map.mjs a voice-a.norm.wav
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scriptA, scriptB } from './remotion/src/script.ts'
import { TEAM } from './remotion/src/team.ts'

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), 'assets')
const [v, file] = process.argv.slice(2)
const ms = (t) => {
  const [h, m, s] = t.trim().replace(',', '.').split(':')
  return Math.round((+h * 3600 + +m * 60 + +s) * 1000)
}
const segs = readFileSync(join(ASSETS, `captions-${v}.srt`), 'utf8')
  .trim()
  .split(/\r?\n\s*\r?\n/)
  .map((block) => {
    const [, time, ...text] = block.trim().split(/\r?\n/)
    const [a, b] = time.split('-->')
    return { startMs: ms(a), endMs: ms(b), text: text.join(' ').trim() }
  })

const words = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
/** How well two texts share words, 0..1 (F1 over word counts). */
const overlap = (a, b) => {
  const bag = new Map()
  for (const w of b) bag.set(w, (bag.get(w) ?? 0) + 1)
  let hit = 0
  for (const w of a) if (bag.get(w) > 0) (hit++, bag.set(w, bag.get(w) - 1))
  return (2 * hit) / (a.length + b.length || 1)
}

let cursor = 0
const lines = Object.entries((v === 'a' ? scriptA : scriptB)(TEAM)).map(([id, text]) => {
  const want = words(text)
  const bestFrom = (from) => {
    let p = null
    for (let a = from; a < segs.length; a++)
      for (let b = a; b < Math.min(segs.length, a + 14); b++) {
        const score = overlap(want, words(segs.slice(a, b + 1).map((s) => s.text).join(' ')))
        if (!p || score > p.score) p = { a, b, score }
      }
    return p
  }
  let pick = bestFrom(cursor)
  // a later, complete reading of the same line is a re-read: it replaces the earlier take
  for (let next = pick && bestFrom(pick.b + 1); next && next.score >= 0.8; next = bestFrom(pick.b + 1)) pick = next
  if (!pick || pick.score < 0.6) throw new Error(`no good take for line "${id}" (best overlap ${pick?.score.toFixed(2)})`)
  cursor = pick.b + 1
  const take = segs.slice(pick.a, pick.b + 1)
  // a little air around the words: Whisper's segment edges sit tight on the speech
  const startMs = Math.max(segs[pick.a - 1]?.endMs ?? 0, take[0].startMs - 150)
  const endMs = Math.min(segs[pick.b + 1]?.startMs ?? Infinity, take.at(-1).endMs + 250)
  const said = take.map((s) => s.text).join(' ')
  console.log(`${id.padEnd(9)} ${pick.score.toFixed(2)}  #${pick.a}-${pick.b}  ${(startMs / 1000).toFixed(1)}-${(endMs / 1000).toFixed(1)} s  ${said}`)
  return { id, startMs, endMs, text: said, segs: take }
})
console.log(`speech: ${(lines.reduce((n, l) => n + l.endMs - l.startMs, 0) / 1000).toFixed(1)} s in ${lines.length} lines`)
writeFileSync(join(ASSETS, `voice-${v}.json`), JSON.stringify({ file: `assets/${file}`, lines }, null, 1))
