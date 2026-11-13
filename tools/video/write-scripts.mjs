// Writes the voiceover scripts the team reads aloud (assets/script-a.txt, script-b.txt) from the same
// lines the edit uses (remotion/src/script.ts, with the names in remotion/src/team.ts).
// usage: node tools/video/write-scripts.mjs
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scriptA, scriptB } from './remotion/src/script.ts'
import { TEAM } from './remotion/src/team.ts'

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), 'assets')
/** Recording tips; `one` = a single paragraph read in one go (Video B). */
const how = (one) => [
  'How to record',
  '- One file for this video. A quiet room. Phone about 20 cm from your mouth.',
  one ? '- Read the whole text in one go, word for word.' : '- Read each line word for word. Do not read the line numbers.',
  ...(one ? [] : ['- Pause about 2 seconds after each line.']),
  `- If you make a mistake, pause 2 seconds, then read the whole ${one ? 'text' : 'line'} again.`,
  '- Say OSDR as "O-S-D-R", DONKI as "DON-kee", JPL as "J-P-L", Bennu as "BEN-oo", delta-v as "delta vee".',
]
const write = (name, head, lines, one = false) => writeFileSync(join(ASSETS, name), [...head, '', ...how(one), '', ...lines].join('\r\n') + '\r\n')

write(
  'script-a.txt',
  ['Mission Architect: Video A (local judging, under 4 minutes)', 'Save the recording as voice-a.mp3 (or .m4a or .wav) in tools/video/assets/.', 'Read at a calm, normal speed. The video fills the time with gameplay.'],
  Object.values(scriptA(TEAM)).flatMap((text, i) => [`${i + 1}. ${text}`, '']),
)
write(
  'script-b.txt',
  ['Mission Architect: Video B (global judging, 30 seconds)', 'Save the recording as voice-b.mp3 (or .m4a or .wav) in tools/video/assets/.', 'Read it in one go, fast but clear. Aim for about 25 seconds; it must stay under 28 seconds.'],
  [scriptB(TEAM).all, ''],
  true,
)
console.log('wrote assets/script-a.txt and assets/script-b.txt')
