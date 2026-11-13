# Mission Architect submission videos: ffmpeg edit (Path 2), following the Remotion plan in tools/video/remotion/src.
# usage: python3 build.py a   |   python3 build.py b
import json, re, subprocess, sys, os, math, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

WHICH = sys.argv[1]
ROOT = '/home/claude/mission-architect/tools/video'
CLIPS = f'{ROOT}/remotion/public/clips'
BUILD = f'{ROOT}/remotion/public/build'
W = '/home/claude/work_' + WHICH
os.makedirs(W, exist_ok=True)
FPS = 30
TEAM, MEMBERS = 'Minus Zero', ['Ahmad Farruk Towsif', 'MD Toslim Uddin Rahat']
CREDITS = [
    'Built with AI assistance (Claude Code) — disclosed on our project page.',
    'Subtitles: our script, timed to the voiceover with CMU PocketSphinx. Fonts: Geist and Geist Mono by Vercel (SIL Open Font License).',
    'Not affiliated with or endorsed by NASA.',
]

# ---------- colours (the game's Rim "station" tokens, oklch -> sRGB) ----------
def oklch(L, C, h):
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l_, m_, s_ = L + 0.3963377774 * a + 0.2158037573 * b, L - 0.1055613458 * a - 0.0638541728 * b, L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    rgb = (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    f = lambda c: 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
    return tuple(max(0, min(255, round(f(c) * 255))) for c in rgb)
PAPER, PAPER2, PAPER3 = oklch(.19, .055, 262), oklch(.23, .055, 262), oklch(.155, .05, 262)
INK, INK2, INK3, RULE, SIGNAL = oklch(.95, .012, 250), oklch(.86, .016, 250), oklch(.74, .028, 255), oklch(.32, .06, 262), oklch(.84, .1, 200)

def font(size, weight=400, mono=False):
    f = ImageFont.truetype(f'/home/claude/geist{"-mono" if mono else ""}-latin-wght-normal.ttf', size)
    try: f.set_variation_by_axes([weight])
    except Exception: pass
    return f

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(' '.join(cmd)); print(r.stderr[-3000:]); sys.exit(1)
    return r

# ---------- voice lines + word timings (forced alignment, align-<a|b>.json) ----------
AL = json.load(open(f'/home/claude/align-{WHICH}.json'))
words, owner = AL['words'], AL['owner']
def toks(t): return re.findall(r"[a-z']+", t.lower().replace('delta-v', 'delta vee').replace('—', ' '))
LINES = []
k = 0
for li, (lid, text) in enumerate(AL['lines']):
    orig = [w for w in text.split() if w != '—']
    ow = []
    for w in orig:
        n = len(toks(w))
        if n == 0: ow.append([w, None, None]); continue
        ow.append([w, words[k][1], words[k + n - 1][2]]); k += n
    # glue "—" back as a trailing dash on the previous word
    out = []
    for w in text.split():
        if w == '—' and out: out[-1] = out[-1] + ' —'
        else: out.append(w)
    for i, w in enumerate(out): ow[i][0] = w
    LINES.append(dict(id=lid, text=text, words=ow, start=ow[0][1], end=ow[-1][2]))
assert k == len(words), (k, len(words))

def chunks(line, maxw=8, maxc=46):
    parts, cur = [], []
    for w in line['words']:
        cur.append(w)
        txt = ' '.join(x[0] for x in cur)
        if (re.search(r'[,.;:!?—]$', w[0]) and len(cur) >= 3) or len(cur) >= maxw or len(txt) >= maxc:
            parts.append(cur); cur = []
    if cur:
        if len(cur) < 3 and parts: parts[-1] += cur
        else: parts.append(cur)
    res = []
    for i, p in enumerate(parts):
        a = p[0][1]
        b = parts[i + 1][0][1] if i + 1 < len(parts) else p[-1][2] + 0.35
        res.append((a, max(b, a + 0.9), ' '.join(x[0] for x in p)))
    return res

def srt_time(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}'

# captions-<x>.srt in the voice file's own time (the deliverable for Step 2)
with open(f'{ROOT}/assets/captions-{WHICH}.srt', 'w') as f:
    n = 1
    for L in LINES:
        for a, b, t in chunks(L):
            f.write(f'{n}\n{srt_time(a)} --> {srt_time(b)}\n{t}\n\n'); n += 1

# ---------- marks ----------
MK = {c: json.load(open(f'{ROOT}/raw/{c}.marks.json')) for c in ['01-home', '02-destination', '03-builder', '04-window-flight', '05-results', '06-about-numbers']}
m = lambda c, k, plus=0: MK[c][k] + plus
H, D, B, F, R, N = '01-home', '02-destination', '03-builder', '04-window-flight', '05-results', '06-about-numbers'
DV = (1300, 1000)
def shot(clip, a, b, rate=1, label=None, zoom=None): return dict(clip=clip, a=a, b=b, rate=rate, label=label, zoom=zoom)
shot_len = lambda s: (s['b'] - s['a']) / s['rate']
TAIL, PRE, POST = 0.9, 0.15, 0.25

# ---------- cards ----------
def base():
    im = Image.new('RGB', (1920, 1080), PAPER); return im, ImageDraw.Draw(im)

def team_block(d, x, y, size, width):
    d.line([(x, y), (x + width, y)], fill=RULE, width=1)
    y += 36
    d.text((x, y), 'Team', font=font(30), fill=INK3)
    d.text((x, y + 44), TEAM, font=font(size + 12, 500), fill=INK)
    mx = x + max(d.textlength(TEAM, font=font(size + 12, 500)), d.textlength('Team', font=font(30))) + 96
    d.text((mx, y), 'Members', font=font(30), fill=INK3)
    for i, mem in enumerate(MEMBERS):
        d.text((mx, y + 44 + i * size * 1.3), mem, font=font(size), fill=INK)
    return y + 44 + len(MEMBERS) * size * 1.3

def title_card(p):
    im, d = base()
    x, y = 160, 130
    d.text((x, y), 'NASA Space Apps Challenge 2026: Space Mission Design Game', font=font(30), fill=INK3)
    d.text((x, y + 54), 'Mission Architect', font=font(150, 500), fill=INK)
    d.text((x, y + 230), 'Design it. Build it. Fly it.', font=font(50), fill=SIGNAL)
    team_block(d, x, y + 360, 42, 1600)
    im.save(p)

def problem_card(p):
    im, d = base()
    x, y = 160, 150
    d.text((x, y), 'The problem', font=font(30), fill=INK3)
    f = font(96, 500)
    d.text((x, y + 50), 'Real space missions take years', font=f, fill=INK)
    d.text((x, y + 150), 'and huge teams to design.', font=f, fill=INK)
    bx = x
    for wd in ['Fuel', 'Power', 'Money']:
        tw = d.textlength(wd, font=font(64, 500))
        d.rectangle([bx, y + 340, bx + tw + 112, y + 340 + 130], fill=PAPER2, outline=RULE)
        d.text((bx + 56, y + 365), wd, font=font(64, 500), fill=INK)
        bx += tw + 112 + 32
    d.text((x, y + 540), 'Challenge: Space Mission Design Game, NASA Space Apps 2026', font=font(32), fill=INK3)
    im.save(p)

def phones_card(p):
    im, d = base()
    shots = [Image.open(f'{BUILD}/{f}.png').convert('RGB') for f in ['m-02-home-phone', 'm-03-builder-phone', 'm-04-flight-phone']]
    shots = [s.resize((round(s.width * 780 / s.height), 780), Image.LANCZOS) for s in shots]
    total = sum(s.width for s in shots) + 64 * 2
    x = (1920 - total) // 2; y = (1080 - 150 - 780) // 2
    for s in shots:
        im.paste(s, (x, y)); d.rectangle([x - 1, y - 1, x + s.width, y + 780], outline=RULE); x += s.width + 64
    im.save(p)

def end_card(p):
    im, d = base()
    x, y = 160, 100
    d.text((x, y), 'Mission Architect', font=font(110, 500), fill=INK)
    d.text((x, y + 130), 'Design it. Build it. Fly it.', font=font(46), fill=SIGNAL)
    d.text((x, y + 205), 'Play it live — link on our project page.', font=font(40), fill=INK)
    yy = team_block(d, x, y + 300, 36, 1600)
    yy += 30
    d.line([(x, yy), (x + 1600, yy)], fill=RULE, width=1)
    for i, c in enumerate(CREDITS):
        d.text((x, yy + 24 + i * 38), c, font=font(24), fill=INK3)
    im.save(p)

def label_png(text, p):
    f = font(24, 500)
    tw = ImageDraw.Draw(Image.new('RGB', (1, 1))).textlength(text, font=f)
    im = Image.new('RGBA', (int(tw) + 30, 48), PAPER3 + (255,))
    d = ImageDraw.Draw(im); d.rectangle([0, 0, im.width - 1, im.height - 1], outline=RULE)
    d.text((14, 9), text, font=f, fill=INK); im.save(p)

CARDS = {'title': title_card, 'problem': problem_card, 'phones': phones_card, 'end': end_card}

# ---------- plan ----------
if WHICH == 'a':
    after = lambda s: max(0.3, s)
    PLAN = [
        dict(id='title', at=1.2, min=7, card='title'),
        dict(id='problem', at=0.6, card='problem'),
        dict(id='solution', at=0.8, shots=[shot(H, 0, m(H, 'end'))]),
        dict(id='build', at=0.5, shots=[shot(D, m(D, 'destination', -.5), m(D, 'moon', 1.5), label='Pick a destination'),
                                        shot(B, m(B, 'vehicle', -.5), m(B, 'builder', -.3), label='Choose rocket and engine'),
                                        shot(B, m(B, 'builder', -.3), m(B, 'fuel'), label='Build the spacecraft')]),
        dict(id='equation', at=after(m(B, 'equation') - m(B, 'fuel') - 1.2), left=True,
             shots=[shot(B, m(B, 'fuel'), m(B, 'equation', 3.4), label='Delta-v: the rocket equation', zoom=(DV[0], DV[1], m(B, 'equation') - m(B, 'fuel')))]),
        dict(id='blocked', at=after(m(B, 'broken') - m(B, 'equation', 3.4) - .3), shots=[shot(B, m(B, 'equation', 3.4), m(B, 'end'), label='No power: launch blocked')]),
        dict(id='flight', at=after(m(F, 'launch') - m(F, 'window', -.5)), shots=[
            shot(F, m(F, 'window', -.5), m(F, 'launch', 1), label='Choose a launch window'),
            shot(F, m(F, 'launch', 1), m(F, 'event1', .2), rate=2, label='Flight, shown at 2× speed'),
            shot(F, m(F, 'event1', .2), m(F, 'event1Done'), label='Event card', zoom=(960, 540, .3)),
            shot(F, m(F, 'event1Done'), m(F, 'event2Done'), label='Next event'),
            shot(F, m(F, 'event2Done'), m(F, 'complete'), rate=2, label='Shown at 2× speed'),
            shot(F, m(F, 'complete'), m(F, 'end'))]),
        dict(id='results', at=.6, shots=[shot(R, m(R, 'results', -.5), m(R, 'end'), label='Results and debrief')]),
        dict(id='anywhere', at=.5, min=7, card='phones'),
        dict(id='nasa', at=.8, shots=[shot(N, m(N, 'about', -.8), m(N, 'sources', 2.4), label='About the numbers: our NASA sources')]),
        dict(id='close', at=.8, min=10, card='end'),
    ]
    byid = {L['id']: L for L in LINES}
    for s in PLAN:
        L = byid[s['id']]
        s['line'] = L
        lsec = (L['end'] + POST) - (L['start'] - PRE)
        foot = sum(shot_len(x) for x in s.get('shots', []))
        s['dur'] = round(max(s['at'] + lsec + TAIL, foot, s.get('min', 0)) * FPS) / FPS
else:
    # Video B: the brief's cut list, voice laid once over the whole thing
    PLAN = [
        dict(id='t', dur=3, card='title'),
        dict(id='bld', dur=10, left=True, shots=[shot(B, m(B, 'parts'), m(B, 'fuel'), rate=3, label='Build the spacecraft (3× speed)'),
                                                  shot(B, m(B, 'equation', -2), m(B, 'equation', 3.4), label='Delta-v: the rocket equation', zoom=(DV[0], DV[1], 2))]),
        dict(id='ev', dur=8, shots=[shot(F, m(F, 'event1', -.3), m(F, 'event1Done'), label='Event card', zoom=(960, 540, .5))]),
        dict(id='res', dur=5, shots=[shot(R, m(R, 'results', -.2), m(R, 'scroll'), label='Results: grade A')]),
        dict(id='end', dur=3.5, card='end'),
    ]

t = 0
for s in PLAN: s['t0'] = t; t += s['dur']
TOTAL = t
print(f'planned length {TOTAL:.2f} s')
for s in PLAN: print(f"  {s['id']:9} {s['t0']:7.2f} +{s['dur']:6.2f}")

# ---------- audio ----------
SR = 48000
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f'{ROOT}/assets/voice-{WHICH}.m4a', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
v = np.frombuffer(raw, dtype=np.float32)
out = np.zeros(int((TOTAL + 1) * SR), dtype=np.float32)
SUBS = []  # (video_start, video_end, text, left)
def place(L, at_video, left):
    a, b = max(0, L['start'] - PRE), min(len(v) / SR, L['end'] + POST)
    seg = v[int(a * SR):int(b * SR)].copy()
    fl = int(.03 * SR); seg[:fl] *= np.linspace(0, 1, fl); seg[-fl:] *= np.linspace(1, 0, fl)
    i = int(at_video * SR); out[i:i + len(seg)] += seg[:len(out) - i]
    for ca, cb, txt in chunks(L):
        SUBS.append((at_video + ca - a, at_video + cb - a, txt, left))
if WHICH == 'a':
    for s in PLAN: place(s['line'], s['t0'] + s['at'], s.get('left', False))
else:
    L = LINES[0]
    place(L, 0.2, False)
    # subtitles move left while the builder panel is on screen (3 s - 13 s)
    SUBS = [(a, b, x, 3 <= a < 13) for a, b, x, _ in SUBS]
with wave.open(f'{W}/voice.wav', 'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((np.clip(out[:int(TOTAL * SR)], -1, 1) * 32767).astype(np.int16).tobytes())

# timeline SRT (video time) for reference
with open(f'{W}/timeline.srt', 'w') as f:
    for i, (a, b, x, _) in enumerate(SUBS, 1): f.write(f'{i}\n{srt_time(a)} --> {srt_time(b)}\n{x}\n\n')

# ---------- render segments ----------
def ass_time(t):
    cs = int(round(t * 100)); return f'{cs // 360000}:{cs // 6000 % 60:02}:{cs // 100 % 60:02}.{cs % 100:02}'
def bgr(c, a=0): return f'&H{a:02X}{c[2]:02X}{c[1]:02X}{c[0]:02X}'
def write_ass(path, s):
    hdr = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: C,Geist,48,{bgr(INK)},{bgr(INK)},{bgr(PAPER3, 0x0F)},{bgr(PAPER3, 0x0F)},0,0,0,0,100,100,0,0,3,16,0,2,180,180,72,1
Style: L,Geist,48,{bgr(INK)},{bgr(INK)},{bgr(PAPER3, 0x0F)},{bgr(PAPER3, 0x0F)},0,0,0,0,100,100,0,0,3,16,0,1,76,900,72,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    for a, b, txt, left in SUBS:
        a2, b2 = max(a, s['t0']) - s['t0'], min(b, s['t0'] + s['dur']) - s['t0']
        if b2 - a2 < 0.05: continue
        lines.append(f"Dialogue: 0,{ass_time(a2)},{ass_time(b2)},{'L' if left else 'C'},,0,0,0,,{txt}")
    open(path, 'w').write(hdr + '\n'.join(lines) + '\n')

ENC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60', '-an']
def zoom_filter(zx, zy, za):
    p = f"clip((on/30-{za})/1.4,0,1)"
    e = f"if(lt({p},0.5),4*pow({p},3),1-pow(-2*{p}+2,3)/2)"
    z = f"(1+0.15*{e})"
    return f"scale=3840:2160:flags=bicubic,zoompan=z='{z}':x='{2*zx}*(1-1/zoom)':y='{2*zy}*(1-1/zoom)':d=1:s=1920x1080:fps=30"

segfiles = []
for i, s in enumerate(PLAN):
    seg = f'{W}/seg{i:02}.mp4'; segfiles.append(seg)
    ass = f'{W}/seg{i:02}.ass'; write_ass(ass, s)
    sub = f"ass={ass}:fontsdir=/home/claude/fonts"
    if 'card' in s:
        png = f'{W}/card-{s["card"]}.png'; CARDS[s['card']](png)
        fade = f"fade=in:st=0:d=0.4," if i else ''
        cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-framerate', '30', '-t', f"{s['dur']:.3f}", '-i', png,
               '-vf', f"format=yuv420p,{fade}{sub}", *ENC, '-frames:v', str(round(s['dur'] * FPS)), seg]
    else:
        ins, fl, outs = [], [], []
        for j, sh in enumerate(s['shots']):
            ins += ['-ss', f"{sh['a']:.3f}", '-t', f"{sh['b'] - sh['a']:.3f}", '-i', f"{CLIPS}/{sh['clip']}.mp4"]
        nshots = len(s['shots'])
        li = nshots
        for j, sh in enumerate(s['shots']):
            chain = f"[{j}:v]setpts=(PTS-STARTPTS)/{sh['rate']},fps=30,format=yuv420p"
            if sh['zoom']: chain += ',' + zoom_filter(*sh['zoom'])
            chain += f"[v{j}]"; fl.append(chain); cur = f'v{j}'
            if sh['label']:
                lp = f'{W}/label{i:02}{j}.png'; label_png(sh['label'], lp)
                ins += ['-loop', '1', '-framerate', '30', '-t', f"{shot_len(sh):.3f}", '-i', lp]
                fl.append(f"[{li}:v]format=rgba,fade=in:st=0.3:d=0.45:alpha=1[l{j}]")
                fl.append(f"[{cur}][l{j}]overlay=40:76:shortest=1[w{j}]"); cur = f'w{j}'; li += 1
            outs.append(f'[{cur}]')
        foot = sum(shot_len(x) for x in s['shots'])
        pad = max(0, s['dur'] - foot) + 0.2
        fl.append(f"{''.join(outs)}concat=n={nshots}:v=1:a=0,tpad=stop_mode=clone:stop_duration={pad:.3f},trim=duration={s['dur']:.3f},setpts=PTS-STARTPTS,{sub}[out]")
        cmd = ['ffmpeg', '-y', '-loglevel', 'error', *ins, '-filter_complex', ';'.join(fl), '-map', '[out]', *ENC, '-frames:v', str(round(s['dur'] * FPS)), seg]
    run(cmd)
    d = float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', seg]).stdout)
    print(f'  rendered {s["id"]:9} {d:6.2f} s (planned {s["dur"]:.2f})', flush=True)

open(f'{W}/list.txt', 'w').write(''.join(f"file '{x}'\n" for x in segfiles))
OUTD = f'{ROOT}/out'; os.makedirs(OUTD, exist_ok=True)
name = 'mission-architect-local-240s.mp4' if WHICH == 'a' else 'mission-architect-global-30s.mp4'
run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', f'{W}/list.txt', '-i', f'{W}/voice.wav',
     '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000', '-c:a', 'aac', '-b:a', '192k', '-ac', '2',
     '-t', f'{TOTAL:.3f}', '-movflags', '+faststart', f'{OUTD}/{name}'])
print('done', name)
