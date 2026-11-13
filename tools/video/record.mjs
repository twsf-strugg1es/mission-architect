// Records the gameplay clips for the demo videos. A full-screen Chrome window plays the seed-5
// Cadet + Moon run, and OpenScreen's CLI records only that window, one clip at a time.
// Needs the production build served on :4173 (`npm run build && npm run preview`).
// usage: node tools/video/record.mjs            all clips, in order
//        FFMPEG=<path to ffmpeg.exe> to convert a non-MP4 recording to MP4
//        DRY=1  rehearsal: hidden browser, nothing recorded, prints each clip's marks
import { spawn, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = dirname(fileURLToPath(import.meta.url))
const RAW = join(HERE, 'raw')
const CHROME = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
const OPENSCREEN = join(process.env.LOCALAPPDATA, 'Programs/Openscreen/Openscreen.exe')
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const GAME = 'http://localhost:4173/?seed=5'
const TITLE = 'MAREC Mission Architect' // unique window title: OpenScreen records the window whose title contains it
const DRY = process.env.DRY === '1'
const ONLY = process.env.ONLY?.split(',') // e.g. ONLY=01-home: a quick test clip
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Seconds since the clip's recording started, per named moment; saved as raw/<clip>.marks.json for the edit.
let t0 = 0
let marks = {}
const mark = (name) => (marks[name] = Math.round((performance.now() - t0) / 100) / 10)

// The careful choice for each event, by id (same picks as the verified playthroughs).
const CAREFUL = { 'launch-anomaly': 'replan', 'political-review': 'full-review', 'solar-flare': 'turn-shield', 'cosmic-rays': 'stack-supplies', micrometeorite: 'diagnostics', 'comms-blackout': 'wait', 'equipment-failure': 'repair', 'crew-illness': 'treat', 'landing-hazard': 'land-anyway', 'dust-storm': 'hibernate', discovery: 'stay', 'sampler-sink': 'grab' }
const { events } = JSON.parse(readFileSync(join(HERE, '../../src/game/data/events.json'), 'utf8'))
const carefulLabel = Object.fromEntries(events.map((e) => [e.title, e.choices.find((c) => c.id === CAREFUL[e.id]).label]))

/** Starts `openscreen record` on the game window; returns { stop() -> path of the recorded video }.
 *  Retries while OpenScreen does not list the window yet (a new full-screen window can take a moment). */
async function startRecording(name, attempt = 1) {
  const child = spawn(OPENSCREEN, ['record', '--window', TITLE, '--project', join(RAW, `${name}.openscreen`), '--json'], { stdio: ['pipe', 'pipe', 'ignore'] })
  const seen = []
  let notify = () => {}
  let buf = ''
  child.stdout.on('data', (d) => {
    buf += d
    for (let i; (i = buf.indexOf('\n')) >= 0; ) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      if (!line.startsWith('{')) continue
      const e = JSON.parse(line)
      seen.push(e)
      console.log(`    openscreen: ${line.replace(/Open windows:.*/, 'Open windows: (not shown)').slice(0, 240)}`)
      notify(e)
    }
  })
  const waitFor = (test, ms, what) =>
    new Promise((resolve, reject) => {
      const hit = seen.find(test)
      if (hit) return resolve(hit)
      const timer = setTimeout(() => reject(new Error(`openscreen ${what} timed out (${name})`)), ms)
      notify = (e) => {
        if (e.event === 'error' || e.success === false) reject(new Error(`openscreen error: ${JSON.stringify(e)}`))
        else if (test(e)) (clearTimeout(timer), resolve(e))
      }
    })
  // capture is live at OpenScreen's "Recording started" log; an error event (window not found) rejects
  try {
    await waitFor((e) => e.event === 'log' && /Recording started/i.test(e.message), 30000, 'start')
  } catch (err) {
    child.kill()
    if (attempt >= 3) throw err
    console.log(`  openscreen could not start (attempt ${attempt}), retrying`)
    await sleep(2500)
    return startRecording(name, attempt + 1)
  }
  const startedAt = performance.now() // marks count from here, so they match the video's own clock
  await sleep(800)
  return {
    startedAt,
    async stop() {
      await sleep(800)
      child.stdin.write('stop\n')
      const done = await waitFor((e) => e.event === 'done', 180000, 'stop')
      const found = []
      const walk = (v) => (typeof v === 'string' ? /\.(mp4|webm|mkv|mov)$/i.test(v) && found.push(v) : v && typeof v === 'object' && Object.values(v).forEach(walk))
      walk(done)
      if (!found.length && existsSync(join(RAW, `${name}.openscreen`))) walk(JSON.parse(readFileSync(join(RAW, `${name}.openscreen`), 'utf8')))
      const video = found.find((p) => existsSync(p))
      if (!video) throw new Error(`no recording found for ${name}: ${JSON.stringify(done).slice(0, 400)}`)
      return video
    },
  }
}

/** Saves the recording as raw/<name>.mp4 (copied as-is when already MP4). */
function saveClip(video, name) {
  const out = join(RAW, `${name}.mp4`)
  if (extname(video).toLowerCase() === '.mp4') copyFileSync(video, out)
  else {
    const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', video, '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-an', out])
    if (r.status !== 0) throw new Error(`ffmpeg failed for ${name}: ${r.stderr}`)
  }
  console.log(`  saved raw/${name}.mp4 (from ${video})`)
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: DRY,
  defaultViewport: null,
  ignoreDefaultArgs: ['--enable-automation'],
  args: ['--kiosk', ...(DRY ? ['--window-size=1920,1080'] : []), '--no-first-run', '--no-default-browser-check'],
})
const [page] = await browser.pages()
await page.goto(GAME, { waitUntil: 'networkidle0' })
await page.evaluate((t) => (document.title = t), TITLE)
// Park the (unrecorded) pointer in the empty right margin, so no hover tooltip or link preview lands on camera.
await page.mouse.move(1880, 540)
await sleep(3000)

// In-page helpers: find a button by aria-label, exact text or text start; scroll it into view; click it.
const click = (label) =>
  page.evaluate(async (label) => {
    const all = [...document.querySelectorAll('button')].filter((b) => !b.disabled)
    const el =
      all.find((b) => b.getAttribute('aria-label') === label) ?? all.find((b) => b.textContent.trim() === label) ?? all.find((b) => b.textContent.trim().startsWith(label))
    if (!el) throw new Error(`no button "${label}"`)
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    await new Promise((r) => setTimeout(r, 500))
    el.click()
  }, label)
/** Smoothly scrolls the window (or the element matching `selector`) to `to` (px or 'bottom') over `ms`. */
const glide = (to, ms, selector = null) =>
  page.evaluate(
    (to, ms, selector) =>
      new Promise((resolve) => {
        const el = selector ? document.querySelector(selector) : document.scrollingElement
        const from = el.scrollTop
        const target = to === 'bottom' ? el.scrollHeight - el.clientHeight : to
        const t0 = performance.now()
        const step = (now) => {
          const k = Math.min(1, (now - t0) / ms)
          el.scrollTop = from + (target - from) * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)
          k < 1 ? requestAnimationFrame(step) : resolve()
        }
        requestAnimationFrame(step)
      }),
    to,
    ms,
    selector,
  )
const waitForDialog = () => page.waitForSelector('[role=dialog]', { timeout: 120000 })
async function resolveEvent(n, linger) {
  await waitForDialog()
  mark(`event${n}`)
  await sleep(linger) // time to read the card and its "What helps here" check
  const title = await page.$eval('[role=dialog] h2', (h) => h.textContent.trim())
  console.log(`  event: ${title} -> ${carefulLabel[title]}`)
  await click(carefulLabel[title])
  mark(`event${n}Choice`)
  await sleep(3800) // the result and its effects
  await click('Continue mission')
  mark(`event${n}Done`)
  await sleep(1200)
}

const CLIPS = {
  async '01-home'() {
    await sleep(2500)
    mark('howToPlay')
    await click('How to play')
    await sleep(5000)
    await page.keyboard.press('Escape')
    mark('howToPlayClosed')
    await sleep(2000)
  },
  async '02-destination'() {
    await click('Cadet') // already the default; picked on camera as the brief asks
    await sleep(1500)
    await click('Start mission')
    mark('destination')
    await sleep(3000)
    await glide(260, 1500)
    await sleep(1500)
    await click('Moon')
    mark('moon')
    await sleep(2500)
  },
  async '03-builder'() {
    await click('Choose rocket and engine')
    mark('vehicle')
    await sleep(2500)
    await click('Falcon Heavy')
    await sleep(1200)
    await click('Advanced chemical')
    await sleep(1500)
    await glide('bottom', 1500)
    await sleep(2000)
    await click('Build the spacecraft')
    mark('builder')
    await sleep(2500)
    mark('parts')
    for (const part of ['Robot Probe', 'Lander', 'Large Solar Panels', 'Rock Scanner', 'Drill', 'Quake Sensor', 'HD Cameras', 'Big Antenna', 'Radiation Shield', 'Spare Parts Kit', 'Rover']) {
      await click(`Add ${part}`)
      await sleep(700)
    }
    await glide(0, 1200)
    mark('fuel')
    await page.focus('[role=slider]')
    for (const key of ['PageUp', 'PageUp', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight']) {
      await page.keyboard.press(key)
      await sleep(350)
    }
    mark('ready')
    await sleep(2500)
    // At the page top the side panel runs below the screen; a small page scroll makes it stick fully in view,
    // then its end shows the rocket equation in the player's own numbers.
    await glide(240, 900)
    await glide('bottom', 1200, 'aside')
    mark('equation')
    await sleep(3500)
    await glide(0, 1000, 'aside')
    // A broken design: no power source left, so the launch is blocked with reasons.
    await click('Remove Large Solar Panels')
    await glide(0, 800)
    await glide(0, 600, 'aside')
    mark('broken')
    await sleep(11000)
    await click('Add Large Solar Panels')
    mark('fixed')
    await glide(0, 800)
    await sleep(3000)
  },
  async '04-window-flight'() {
    await click('Choose a launch window')
    mark('window')
    await sleep(3000)
    await click('Standard')
    await sleep(1500)
    await click('Launch')
    mark('launch')
    await resolveEvent(1, 5000)
    await click('Skip to next event')
    await resolveEvent(2, 4000)
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('See results')), { timeout: 120000 })
    mark('complete')
    await sleep(2500)
  },
  async '05-results'() {
    await click('See results')
    mark('results')
    await sleep(4000)
    mark('scroll')
    await glide('bottom', 9000)
    mark('debrief')
    await sleep(2500)
    await glide(0, 3000)
    mark('top')
    await sleep(2500)
  },
  async '06-about-numbers'() {
    await click('Home')
    await sleep(2000)
    await click('About the numbers')
    mark('about')
    await sleep(3000)
    mark('scroll')
    await glide('bottom', 9000, '[role=dialog]')
    mark('sources')
    await sleep(2500)
    await page.keyboard.press('Escape')
    await sleep(1500)
  },
}

try {
  for (const [name, play] of Object.entries(CLIPS)) {
    if (ONLY && !ONLY.includes(name)) continue
    console.log(`clip ${name}`)
    const rec = DRY ? null : await startRecording(name)
    t0 = rec?.startedAt ?? performance.now()
    marks = {}
    try {
      await play()
    } finally {
      mark('end')
      if (rec) saveClip(await rec.stop(), name)
      if (rec) writeFileSync(join(RAW, `${name}.marks.json`), JSON.stringify(marks, null, 1))
      else console.log(`  marks ${JSON.stringify(marks)}`)
    }
  }
} finally {
  await browser.close()
}
