import type { Layer, NoiseLayer, Spec, ToneLayer } from '@foleyjs/core'

/*
 * The site's sounds, in three sets to choose between by ear (utils/sounds.ts
 * says which one plays, and the dev page /dev/sounds plays them side by side).
 * The kinds are described in utils/sounds.ts; every set gives each one.
 *
 * All three keep away from what makes a sound a game's: no square waves (a
 * chip's voice) and no big falling pitches (a laser). Pitches are notes of A
 * minor pentatonic, so sounds that land together stay in tune. A scrub's
 * tick takes the size of what it passed (0 to 1): bigger rings longer, and
 * in the two pitched sets, lower.
 */
export type SoundKind =
  | 'tick' | 'detent' | 'undo' | 'edge' | 'toggle' | 'go' | 'lift'
  | 'role' | 'draw' | 'type' | 'key' | 'enter' | 'print' | 'forward' | 'back'
  | 'open' | 'reveal' | 'conceal' | 'close' | 'swap' | 'peek' | 'point' | 'on' | 'off'
  | 'ink' | 'angle' | 'cross' | 'glow' | 'part'
  | 'pick' | 'lay' | 'turn' | 'nudge'

/*
 * Each kind, plus the set's voice for a single note at any pitch, for what
 * plays a tune (the socials in the footer).
 */
export type SoundSet = Record<SoundKind, Spec | ((size?: number) => Spec | Score)> & {
  note: (hz: number) => Spec
  /** The band's marker sliding from `from` to `to`, places across the screen from -1 (left) to 1 (right). */
  slide: (from: number, to: number) => Score
  /**
   * A letter of a word turning cursive as the word writes itself: `along`
   * the word from its first letter (0) to its last (1).
   */
  letter: (along: number) => Spec
  /** The page's text flipping over to another language, row by row (FlapRow). */
  board: (rows: FlapRow[]) => Score
  /**
   * The color scheme's one word turning over, as a flip clock on a desk:
   * landing `light` (1), `dark` (0) or the system's (0.5).
   */
  clock: (row: FlapRow, light: number) => Score
  /** A picture or clip sweeping in behind its line of light, the line travelling `way`. */
  scan: (way: ScanWay) => Score
  /**
   * The color scheme scanned up the whole page behind its line (main.css,
   * "Scheme scan"): the scan's voice held at one pitch for SWEEP's crossing.
   */
  sweep: () => Score
  /**
   * A uses table drawing in (UsesTables.vue): `rules` rules, one every
   * `step` seconds, each taking RULE seconds to draw across.
   */
  table: (rules: number, step: number) => Score
}

export type ScanWay = 'up' | 'down' | 'left' | 'right'

/*
 * A run of text scrambling into another language (plugins/locale-scramble),
 * as a row of a departures board: `chars` flaps side by side, the first
 * setting off `at` seconds in, each one `step` after the last, each
 * flipping for `settle` before it lands. `pan` is where the row sits across
 * the screen, -1 (left) to 1 (right).
 */
export type FlapRow = { at: number, chars: number, step: number, settle: number, pan: number }

/*
 * More than one sound's worth at once (a spec holds at most 8 layers): parts
 * played together, each placed on its own in the stereo field. A part with
 * `travel` moves while it plays, from `pan` to `to` over `seconds`, eased out.
 */
export type Score = { spec: Spec, pan: number, travel?: Travel }[]
export type Travel = { to: number, seconds: number }

type Shape = Partial<Omit<ToneLayer, 'kind' | 'at' | 'f'>>
type Filtered = Partial<Omit<NoiseLayer, 'kind' | 'at'>>

const tone = (at: number, f: number, shape: Shape = {}): Layer =>
  ({ kind: 'tone', at, f, wave: 'sine', f2: null, glide: 0.06, a: 0.002, d: 0.05, peak: 0.08, send: 0, ...shape })
const noise = (at: number, shape: Filtered = {}): Layer =>
  ({ kind: 'noise', at, filter: 'bandpass', f: 2000, f2: null, glide: 0.1, q: 1, a: 0.002, d: 0.03, peak: 0.06, send: 0, ...shape })

/*
 * The 404's solitaire (ErrorSolitaire.vue), the same in every set: card stock
 * on a table, so all noise and no pitch, and kept at a hover's level or under.
 * pick: a card coming up. lay: coming down. turn: flicked over, or taken back.
 * nudge: a dull tap where it won't go.
 */
const CARDS = {
  pick: [noise(0, { f: 2600, q: 1.2, a: 0.001, d: 0.012, peak: 0.05 })],
  lay: [
    noise(0, { filter: 'lowpass', f: 1400, a: 0.001, d: 0.018, peak: 0.09 }),
    noise(0, { f: 3200, q: 2, a: 0.001, d: 0.004, peak: 0.03 }),
  ],
  turn: [
    noise(0, { f: 3000, q: 1.5, a: 0.001, d: 0.006, peak: 0.05 }),
    noise(0.035, { f: 1800, q: 1.5, a: 0.001, d: 0.01, peak: 0.05 }),
  ],
  nudge: [noise(0, { filter: 'lowpass', f: 500, a: 0.001, d: 0.02, peak: 0.1 })],
} satisfies Partial<Record<SoundKind, Spec>>

/*
 * A dragged card over velvet (soundRub in utils/sounds.ts): a held hush the nap
 * keeps dark, in Hz from `low` up to a top that opens from `dull` to `bright`
 * the faster it goes, and `peak` the level at its fastest.
 */
export const RUB = { low: 250, dull: 800, bright: 1500, peak: 0.02 }

// The lightbox opening and closing (MediaLightbox.vue), the same in every set:
// the user's cue, a soft lowpass breath whose filter settles as the picture
// lands. Opening breathes bright (2.6 kHz settling to 1.5); closing, the
// same breath darker (1.2 kHz down to 600 Hz), a touch quicker to go. Kept
// low: body under the flight (420ms), not a sound of its own.
const breath = (f: number, f2: number, a: number, d: number, peak: number): Spec =>
  [noise(0, { filter: 'lowpass', f, f2, glide: 0.12, q: 1.4, a, d, peak })]
const REVEAL = breath(2600, 1500, 0.1, 0.32, 0.03)
const CONCEAL = breath(1200, 600, 0.08, 0.28, 0.06)

const share = (size = 0.5) => Math.min(Math.max(size, 0), 1)
const pick = <T>(from: T[]) => from[Math.floor(Math.random() * from.length)]!

/*
 * Rain for the tiled wipe on a section change: a drop for each of a few
 * dozen tiles as it lands, drawn fresh every time. The timing is the
 * wipe's own (public/worklets/tile-wipe.js, with plugins/section-transition
 * and main.css's --tile-transition): tiles at share u of the way out start
 * once the front gets there, scattered more the farther out it is, and land
 * part way through their flip. There are more tiles farther out, as a
 * ring's are. The drops travel across the stereo field the way the page
 * goes, `way` 1 forward (left to right), -1 back.
 */
const TILE = { seconds: 0.95, spread: 0.45, flip: 0.32, land: 0.7 }
/*
 * The band's marker sliding to the new page, with the page transition
 * (--page-transition, eased in and out: the flag-marker group in main.css).
 * Heard as a run of short grains, each placed where the marker is by then,
 * so the sound travels with it; each grain is as loud and as bright as the
 * marker is fast then (quiet setting off, fullest mid-way, slowing in). A
 * long trip is heard as loud as a short one: every sound on the site keeps
 * one level, whatever it's the sound of. `rail` voices a grain, `land` the
 * stop, and `whole` anything held through the slide in one piece (a
 * sound in grains comes and goes with each one), placed mid-way.
 */
const SLIDE = { seconds: 0.55, grains: 7 }
// The ease's shape, near enough: where it is at t, and how fast it's going.
const eased = (t: number) => (1 - Math.cos(Math.PI * t)) / 2
const speedAt = (t: number) => Math.sin(Math.PI * t)

function slide(
  from: number,
  to: number,
  rail: (at: number, length: number, speed: number, next: number) => Layer[],
  land: (at: number) => Layer[],
  whole: (seconds: number) => Layer[] = () => [],
): Score {
  const { seconds, grains } = SLIDE
  const length = seconds / grains
  return Array.from({ length: grains }, (_, i) => {
    const t = (i + 0.5) / grains
    const grain = rail(i * length, length, speedAt(t), speedAt((i + 1.5) / grains))
    const held = i === Math.floor(grains / 2) ? whole(seconds) : []
    return {
      spec: [...grain, ...held, ...(i === grains - 1 ? land(seconds * 0.92) : [])],
      pan: (from + (to - from) * eased(t)) * 0.8,
    }
  }).filter((part) => part.spec.length)
}

const DROPS = 32
const PARTS = 4

function rain(way: 1 | -1, drop: (at: number, i: number) => Layer): Score {
  const { seconds, spread, flip, land } = TILE
  const times = Array.from({ length: DROPS }, () => {
    const u = Math.sqrt(Math.random())
    const start = (u * (1 - spread) + Math.random() * spread * Math.min(u * 4, 1)) * (1 - flip * 1.3)
    return (start + flip * (0.7 + 0.6 * Math.random()) * land) * seconds
  }).sort((a, b) => a - b)
  const per = DROPS / PARTS
  return Array.from({ length: PARTS }, (_, part) => ({
    spec: times.slice(part * per, (part + 1) * per).map((at, i) => drop(at, part * per + i)),
    pan: way * (part / (PARTS - 1) - 0.5) * 0.9,
  }))
}
/*
 * A departures board turning over: a clatter of flaps, as dense at each
 * moment as the flaps still turning then (so it swells as rows set off and
 * thins out as they land, left to right), and a firmer clack as each row's
 * last flap lands. A bigger switch clatters a little fuller, up to a point.
 * Each row is heard where it sits; the flaps are drawn fresh every time.
 */
const BOARD = { least: 12, most: 48, landings: 12, zones: 4 }

function board(
  rows: FlapRow[],
  flap: (at: number, landing: boolean, loud: number) => Layer,
  { least, most }: { least: number, most: number } = BOARD,
): Score {
  const all = rows.reduce((sum, row) => sum + row.chars, 0)
  if (!all) return []
  const flips = Math.round(Math.min(Math.max(all * 0.4, least), most))
  const heard: { layer: Layer, pan: number }[] = []
  for (let n = 0; n < flips; n++) {
    // A flap anywhere on the board, so a longer row turns over more of them.
    let left = Math.random() * all
    const row = rows.find((one) => (left -= one.chars) < 0) ?? rows.at(-1)!
    const from = row.at + Math.floor(Math.random() * row.chars) * row.step
    heard.push({ layer: flap(from + Math.random() * row.settle, false, 0.6 + Math.random() * 0.4), pan: row.pan })
  }
  // Landings soften the more rows land together, so a full page isn't louder.
  const landing = [...rows].sort(() => Math.random() - 0.5).slice(0, BOARD.landings)
  const loud = Math.min(1, 2 / Math.sqrt(landing.length))
  for (const row of landing) {
    heard.push({ layer: flap(row.at + (row.chars - 1) * row.step + row.settle, true, loud), pan: row.pan })
  }
  // A part per stretch of the screen, as many as its layers need, heard
  // where its rows sit on average (a lone row right where it is), and never
  // all the way to one side: headphones make a hard side sound one-eared.
  const parts: Score = []
  for (let zone = 0; zone < BOARD.zones; zone++) {
    const here = heard.filter(({ pan }) => Math.min(Math.floor(((pan + 1) / 2) * BOARD.zones), BOARD.zones - 1) === zone)
    if (!here.length) continue
    const pan = (here.reduce((sum, one) => sum + one.pan, 0) / here.length) * 0.7
    const layers = here.map(({ layer }) => layer)
    for (let i = 0; i < layers.length; i += 8) parts.push({ spec: layers.slice(i, i + 8), pan })
  }
  return parts
}

/*
 * The line of light sweeping a picture or clip in (MediaPalette.vue, MediaLightbox.vue:
 * 450ms, eased out), heard for as long as it takes to cross. Going up or
 * down it's heard in the middle; crossing sideways it travels with the
 * line, from the side it sets off to the side it lands (a part's `travel`,
 * utils/sounds.ts). `voice` gives the sound with its envelope; `shape` is
 * that envelope, as shares of the crossing.
 */
const SCAN = { seconds: 0.45 }
// The scheme's scan, the page's height (700ms, eased in and out).
const SWEEP = { seconds: 0.7 }
type Envelope = { a: number, d: number }

function scan(way: ScanWay, shape: Envelope, voice: (swell: Envelope) => Layer | Layer[], seconds = SCAN.seconds): Score {
  const spec = [voice({ a: shape.a * seconds, d: shape.d * seconds })].flat()
  if (way === 'up' || way === 'down') return [{ spec, pan: 0 }]
  const [from, to] = way === 'left' ? [1, -1] : [-1, 1]
  return [{ spec, pan: from, travel: { to, seconds } }]
}

/*
 * Typing in a hurry, in one sound: a spec's eight layers as eight keys over
 * the uses queries' 0.45s (UsesTables.vue), each a little early or late.
 */
const TYPED = { seconds: 0.45, keys: 8 }

function typing(key: (at: number) => Layer): Spec {
  const { seconds, keys } = TYPED
  const gap = seconds / keys
  return Array.from({ length: keys }, (_, i) => key(Math.max(0, i * gap + (Math.random() - 0.5) * gap * 0.6)))
}

/*
 * A box-drawn table drawing in: a bed held for as long as its rules take to
 * draw (the last one finishing RULE after it starts), and a tick on each
 * rule as it sets off, the last one landing. `bed` is given the length,
 * `tick` the time and whether it's the last. Parts of 8 layers at most.
 */
const RULE = 0.38

function table(rules: number, step: number, bed: (seconds: number) => Layer[], tick: (at: number, last: boolean) => Layer[]): Score {
  const n = Math.max(rules, 1)
  const ticks = Array.from({ length: n }, (_, i) => tick(i * step, i === n - 1)).flat()
  const parts: Score = [{ spec: bed((n - 1) * step + RULE), pan: 0 }]
  for (let i = 0; i < ticks.length; i += 8) parts.push({ spec: ticks.slice(i, i + 8), pan: 0 })
  return parts
}

// A single unit has fewer flaps to turn than a board.
const CLOCK = { least: 6, most: 10 }

// A note of `scale` for a size: the biggest gets the first (lowest).
const noteFor = (scale: number[], size?: number) => scale[Math.round((1 - share(size)) * (scale.length - 1))]!

/*
 * Modular: a patch of resonant filters struck like strings. Each note is
 * noise through a filter tuned to it, ringing for a moment, with a sine
 * under it for body. Warm, plucked, barely any pitch movement.
 */
const ping = (at: number, f: number, d: number, peak = 0.1, send = 0): Layer[] => [
  noise(at, { f, q: 12, d, peak, send }),
  tone(at, f, { d: d * 1.4, peak: peak * 0.45, send }),
]
const pluck = (at: number, f: number, d: number, peak = 0.12) =>
  tone(at, f * 1.02, { wave: 'triangle', f2: f, glide: 0.02, d, peak })

const MODULAR_SCALE = [220, 262, 294, 330, 392, 440, 523, 587, 660]

// Modular's, which the panel plays too. A picture or clip sweeping in
// behind its line of light: a low triangle hum, with two quiet sine octaves
// over it, which are what a phone's speaker plays of it. Foley's decay is
// exponential and would leave it gone by the middle of the crossing, heard
// in the center, so it barely decays (d is many crossings long) and holds
// until the travel's own fade (utils/sounds.ts) takes it on the far side.
const scanHum = (way: ScanWay) => {
  // Stereo has no up or down: a line going up or down is heard in the middle,
  // at one pitch (a glide read as cartoonish), its level moving instead:
  // swelling as it rises, falling away as it drops.
  const shape = way === 'up' ? { a: 0.6, d: 6 } : way === 'down' ? { a: 0.05, d: 3 } : { a: 0.1, d: 6 }
  return scan(way, shape, (swell) => [
    tone(0, 110, { ...swell, wave: 'triangle', peak: 0.045 }),
    tone(0, 220, { ...swell, peak: 0.008 }),
    tone(0, 440, { ...swell, peak: 0.005 }),
  ]).map((part) => ({ ...part, travel: part.travel ?? { to: 0, seconds: SCAN.seconds } }))
}
// The landing mark's strokes as resonant brushes rising as they're drawn:
// each half of the ring (the bottom one INK_STAGGER after the top) over the
// half's 1.2s, and the A's angle over its 0.7s; at the site-motion level
// (about 18 dB), three times modular's first peaks.
const INK: Spec = [noise(0, { f: 300, f2: 900, glide: 1.1, q: 6, a: 0.5, d: 0.6, peak: 0.09 })]
const ANGLE_BRUSH: Spec = [noise(0, { f: 400, f2: 1000, glide: 0.35, q: 6, a: 0.35, d: 0.35, peak: 0.06 })]

const modular: SoundSet = {
  ...CARDS,
  note: (hz) => [...ping(0, hz, 0.18, 0.1, 0.15), pluck(0, hz, 0.2, 0.08)],
  slide: (from, to) => slide(from, to,
    (at, length, speed) => [noise(at, { f: 300 + 500 * speed, q: 6, a: length * 0.7, d: length * 1.3, peak: 0.06 * speed })],
    (at) => ping(at, 330, 0.04, 0.05)),
  tick: (size) => ping(0, noteFor(MODULAR_SCALE, size), 0.03 + share(size) * 0.09, 0.09),
  detent: ping(0, 330, 0.06, 0.12),
  undo: ping(0, 220, 0.05, 0.08),
  edge: [noise(0, { filter: 'lowpass', f: 220, d: 0.06, peak: 0.16 }), tone(0, 82, { d: 0.09, peak: 0.12 })],
  toggle: [...ping(0, 440, 0.04), ...ping(0.045, 330, 0.06)],
  go: [pluck(0, 220, 0.12), ...ping(0, 660, 0.04, 0.06)],
  lift: [pluck(0, 220, 0.08, 0.1), ...ping(0.02, 330, 0.04, 0.05)],
  role: [tone(0, 110, { d: 0.12, peak: 0.18 }), ...ping(0, 220, 0.05, 0.06)],
  draw: [...ping(0, 330, 0.025, 0.06), ...ping(0.09, 392, 0.025, 0.06), ...ping(0.18, 440, 0.035, 0.07)],
  forward: [noise(0, { f: 200, f2: 1600, glide: 0.24, q: 8, a: 0.05, d: 0.22, peak: 0.08, send: 0.15 })],
  back: [noise(0, { f: 1600, f2: 200, glide: 0.24, q: 8, a: 0.05, d: 0.22, peak: 0.08, send: 0.15 })],
  open: [tone(0, 110, { wave: 'triangle', f2: 220, glide: 0.1, a: 0.02, d: 0.12, peak: 0.1 }), ...ping(0.08, 660, 0.08, 0.08, 0.2)],
  reveal: REVEAL,
  conceal: CONCEAL,
  close: [...ping(0, 330, 0.05, 0.08), tone(0, 220, { wave: 'triangle', f2: 110, glide: 0.1, d: 0.12, peak: 0.1 })],
  scan: scanHum,
  sweep: () => scan('up', { a: 0.4, d: 0.6 }, (swell) => tone(0, 110, { ...swell, wave: 'triangle', peak: 0.04 }), SWEEP.seconds),
  table: (rules, step) => table(rules, step,
    (seconds) => [tone(0, 220, { wave: 'triangle', a: 0.03, d: seconds, peak: 0.02 })],
    (at, last) => ping(at, last ? 330 : 440, last ? 0.08 : 0.05, 0.05)),
  swap: ping(0, 440, 0.04, 0.08),
  peek: ping(0, 880, 0.015, 0.03),
  point: ping(0, 660, 0.01, 0.015),
  key: () => [noise(0, { f: 2000 + Math.random() * 1200, q: 3, d: 0.005, peak: 0.03 })],
  type: () => typing((at) => noise(at, { f: 2000 + Math.random() * 1200, q: 3, d: 0.005, peak: 0.025 })),
  enter: [noise(0, { f: 1600, q: 3, d: 0.01, peak: 0.04 }), ...ping(0.01, 220, 0.04, 0.04)],
  print: () => ping(0, pick([440, 660, 880]), 0.02, 0.02),
  letter: (along) => ping(0, 660 + along * 440, 0.015, 0.0075),
  board: (rows) => board(rows, (at, landing, loud) => landing
    ? noise(at, { f: 440, q: 12, d: 0.03, peak: 0.03 * loud })
    : noise(at, { f: pick([1320, 1760, 2640]), q: 8, d: 0.006, peak: 0.012 * loud })),
  clock: (row, light) => board([row], (at, landing, loud) => landing
    ? noise(at, { f: 262 + light * 168, q: 12, d: 0.04, peak: 0.035 })
    : noise(at, { f: pick([880, 1100, 1320]), q: 8, d: 0.008, peak: 0.014 * loud }), CLOCK),
  on: [...ping(0, 330, 0.05), ...ping(0.06, 440, 0.08, 0.1, 0.2)],
  off: [...ping(0, 440, 0.05), ...ping(0.06, 330, 0.08)],
  ink: INK,
  angle: ANGLE_BRUSH,
  cross: ping(0, 880, 0.02, 0.04),
  glow: [tone(0, 110, { a: 0.375, d: 1.125, wave: 'triangle', peak: 0.04 })],
  part: ping(0, 660, 0.3, 0.015),
}

/*
 * Instrument panel: lab gear, a cockpit, a studio device. Clean sine beeps
 * at a few fixed pitches and the small clack of relays; precise, with
 * nearly no melody. A scrub's tick keeps its pitch and only lengthens.
 */
const relay = (at: number, peak = 0.08, f = 1200): Layer[] => [
  noise(at, { filter: 'highpass', f: 4000, d: 0.004, peak: peak * 0.6 }),
  noise(at, { f, d: 0.008, peak }),
]
const beep = (at: number, f: number, d: number, peak = 0.05) => tone(at, f, { a: 0.001, d, peak })

// A drop on the panel: a relay's clack at one of a few pitches, now and
// then a short beep, and softer as the rain moves out from the press.
const PANEL_DROPS = [1800, 2400, 3200, 4200]
const BEEPS = [1000, 1500, 2000]
function panelDrop(at: number, i: number): Layer {
  const fade = 1 - (i / DROPS) * 0.5
  if (Math.random() < 0.15) return beep(at, pick(BEEPS), 0.015, 0.025 * fade)
  return noise(at, { f: pick(PANEL_DROPS), q: 4, d: 0.004 + Math.random() * 0.008, peak: (0.04 + Math.random() * 0.03) * fade })
}

const HUM = 120
const LIGHT_HUM = 100
const GLOW_HUM = 110

/** The landing mark's ring: each half inking in, and how long the bottom one waits after the top (HomeIntro.vue). */
export const INK_SECONDS = 1.2
export const INK_STAGGER = 0.35
/** The A's angle, up one leg and down the other, in one stroke (HomeIntro.vue). */
export const ANGLE = 0.7

/** The intro's lines easing over as the text parts (HomeIntro.vue's --centered). */
const PART = 0.6

/*
 * Levels, by ear's weighting rather than by peak (a 3ms click needs a far
 * higher peak than a held beep to be heard as loud, and a hum under 150 Hz
 * barely reaches a laptop's speakers, so quiet sine octaves over it carry it;
 * a sawtooth edge did too, but a phone plays only its buzz). Three
 * steps, 5 dB apart, measured A-weighted through a laptop speaker's rolloff:
 * - what the visitor did (on/off, toggle, a swipe's detent/undo/edge, lift,
 *   the lightbox): about 23 dB; the scheme's sweep about 21, and the
 *   palette and lightbox scans, which come quickly, about 19;
 * - the site moving in answer (slide, role, glow, the mark's strokes, rain,
 *   table, clock, the side panel, swap, a scrub's tick at its biggest, the
 *   socials' notes, enter): about 18;
 * - hovers and quick trickles (peek, point, keys, type, print, board, cross,
 *   part, go under the slide): about 13. Letters stay under that, felt.
 */
const panel: SoundSet = {
  ...CARDS,
  // A note of the socials' tune (the footer) as a small kalimba tine,
  // barely touched: a soft thumb, a round sine that rings only a moment
  // (so a slide across the icons is a run of tuned taps, not a song played
  // at you; the tune is there to be found), and the tine's faint metal
  // glint well above (its second mode, about 6.27 times the note). Dry and
  // quiet, at a hover's level.
  note: (hz) => [
    noise(0, { filter: 'lowpass', f: 1200, d: 0.005, peak: 0.004 }),
    tone(0, hz, { a: 0.002, d: 0.45, peak: 0.009 }),
    tone(0, hz * 6.27, { a: 0.001, d: 0.06, peak: 0.0018 }),
  ],
  // The band's marker gliding to the new page: one hum through the whole
  // slide at one pitch, swelling to the middle as it speeds up (a sine for
  // body, a soft triangle a hair off it for the edge, and two quiet sine
  // octaves over it, which are what a phone's speaker plays of it: a saw
  // there was all buzz), with no landing note: it fades as the marker
  // settles. Dry, and as loud however far it goes.
  slide: (from, to) => slide(from, to,
    () => [],
    () => [],
    (seconds) => {
      const swell = { a: seconds / 2, d: seconds * 0.45 }
      return [
        tone(0, HUM, { ...swell, peak: 0.024 }),
        tone(0, HUM * 1.004, { ...swell, wave: 'triangle', peak: 0.007 }),
        tone(0, HUM * 2, { ...swell, peak: 0.009 }),
        tone(0, HUM * 4, { ...swell, peak: 0.009 }),
      ]
    }),
  tick: (size) => [...relay(0, 0.02), beep(0, 1000, 0.01 + share(size) * 0.06, 0.016)],
  detent: [...relay(0, 0.06), beep(0, 1500, 0.03, 0.04)],
  undo: relay(0, 0.18, 800),
  edge: [...relay(0, 0.15, 700), ...relay(0.03, 0.11, 700), tone(0, 120, { d: 0.05, peak: 0.15 })],
  // A setting switched: modular's, two pings stepping down, for now.
  toggle: [...ping(0, 440, 0.04), ...ping(0.045, 330, 0.06)],
  // Only the press, a muffled tap with no note in it: the slide and the
  // rain that follow are the sound of going.
  go: [noise(0, { filter: 'lowpass', f: 900, a: 0.001, d: 0.006, peak: 0.14 })],
  lift: [...relay(0, 0.06, 900), beep(0.01, 800, 0.03, 0.04)],
  // The experience band's light moving to the next role: the marker's hum,
  // but the light's own. Lower and grainier, a quiet saw a hair off the sine
  // for its edge, swelling as the light stretches and cut short as it
  // gathers, on the hum's own note. As loud however far it travels.
  role: [
    tone(0, LIGHT_HUM, { a: 0.12, d: 0.33, peak: 0.034 }),
    tone(0, LIGHT_HUM * 1.006, { a: 0.12, d: 0.33, wave: 'sawtooth', peak: 0.0055 }),
    tone(0, LIGHT_HUM * 2, { a: 0.12, d: 0.33, peak: 0.01 }),
    tone(0, LIGHT_HUM * 4, { a: 0.12, d: 0.33, peak: 0.009 }),
    tone(0.4, LIGHT_HUM, { a: 0.006, d: 0.05, peak: 0.017 }),
  ],
  draw: [...relay(0, 0.02), ...relay(0.09, 0.02), ...relay(0.18, 0.025), beep(0.18, 1200, 0.02, 0.014)],
  forward: () => rain(1, panelDrop),
  back: () => rain(-1, panelDrop),
  // The media guide's panel (GuideSheet.vue) sliding in and away: the
  // lightbox's breath, the same both ways: a dark one (1 kHz settling to
  // 500 Hz), gathering and cut short. Brighter or longer, it read as a whoosh.
  open: breath(1000, 500, 0.18, 0.08, 0.064),
  reveal: REVEAL,
  conceal: CONCEAL,
  close: breath(1000, 500, 0.18, 0.08, 0.064),
  // A picture or clip sweeping in behind its line of light: modular's
  // low triangle hum (scanHum).
  scan: scanHum,
  // The scheme scanned up the whole page: a low square, held at 52 Hz with
  // no glide, swelling as the line
  // gathers off the switch and fading as it settles at the top.
  sweep: () => scan('up', { a: 0.45, d: 0.55 }, (swell) =>
    tone(0.005, 52, { wave: 'square', ...swell, peak: 0.028 }), SWEEP.seconds),
  // A uses table drawing in: its rules are lines drawing, so two soft
  // sines (200 and 500 Hz) held under it for as long as they take, a touch
  // fuller, and on each rule as it sets off a relay's tick with a short beep
  // ringing after it, all at one pitch; the bottom rule lands with a duller
  // clack and a lower, longer beep. Mid pitches, so phone speakers carry it.
  table: (rules, step) => table(rules, step,
    (seconds) => [
      tone(0, 200, { a: 0.04, d: seconds, peak: 0.0055 }),
      tone(0, 500, { a: 0.04, d: seconds, peak: 0.004 }),
    ],
    (at, last) => last
      ? [noise(at, { f: 1300, q: 3, d: 0.012, peak: 0.024 }), beep(at, 750, 0.12, 0.011)]
      : [noise(at, { f: 1800 + Math.random() * 600, q: 4, d: 0.006, peak: 0.02 }), beep(at, 1000, 0.07, 0.008)]),
  // Another pick in the open side panel, as a slide projector advancing
  // (GuideSheet.vue's swap): a lighter ka as the old one fades out, and the
  // chunk of the next dropping into the gate as it comes in (0.13s), a dull
  // body with a glint of metal and a hint of rattle. No air, no notes.
  swap: [
    noise(0, { f: 1400, q: 3, d: 0.006, peak: 0.085 }),
    noise(0, { filter: 'lowpass', f: 500, d: 0.01, peak: 0.06 }),
    noise(0.13, { filter: 'lowpass', f: 300, d: 0.03, peak: 0.12 }),
    tone(0.13, 110, { a: 0.002, d: 0.04, peak: 0.06 }),
    noise(0.13, { f: 2200, q: 5, d: 0.003, peak: 0.045 }),
    noise(0.146, { f: 1600, q: 4, d: 0.002, peak: 0.027 }),
  ],
  // A tooltip coming out: one small dry tick, the lightest of the relays.
  peek: [noise(0, { f: 3200, q: 4, d: 0.003, peak: 0.062 }), beep(0, 2000, 0.006, 0.025)],
  // The mouse coming to another item in a graph (a project in the log, a
  // release or month in the media strips): slighter than a tooltip's, lower
  // and with no beep in it, just the tick.
  point: [noise(0, { f: 1800, q: 5, d: 0.002, peak: 0.11 })],
  // The contributions' command typing itself in: soft keys, none quite like
  // the last (a click up top, a dull bottoming out under it), then a
  // heavier one for enter, and the log printing its rows as quiet ticks off
  // the panel, now and then a beep, cooling as they go.
  key: () => [
    noise(0, { f: 2200 + Math.random() * 1400, q: 3, d: 0.003 + Math.random() * 0.003, peak: 0.057 + Math.random() * 0.038 }),
    noise(0.004, { filter: 'lowpass', f: 600, d: 0.008, peak: 0.064 }),
  ],
  // Uses' queries typing in together, quick (0.45s): one run of the same
  // soft keys, a few rather than one per character, none alike.
  type: () => typing((at) => noise(at, {
    f: 2200 + Math.random() * 1400, q: 3, d: 0.003 + Math.random() * 0.003, peak: 0.034 + Math.random() * 0.021,
  })),
  enter: [
    noise(0, { f: 1800, q: 3, d: 0.006, peak: 0.13 }),
    noise(0.006, { filter: 'lowpass', f: 500, d: 0.02, peak: 0.14 }),
  ],
  print: () => [Math.random() < 0.15
    ? beep(0, pick(BEEPS), 0.012, 0.05)
    : noise(0, { f: pick(PANEL_DROPS), q: 4, d: 0.003 + Math.random() * 0.004, peak: 0.07 + Math.random() * 0.04 })],
  // A word writing itself, a letter at a time: a trickle of soft thumps,
  // felt more than heard, low and dry, a touch higher along the word, never
  // twice quite the same, and as loud whatever size the word is set.
  letter: (along) => [
    tone(0, 140 + along * 40 + Math.random() * 10, { a: 0.002, d: 0.025, peak: 0.012 }),
    noise(0, { filter: 'lowpass', f: 500, d: 0.006, peak: 0.012 }),
  ],
  // The departures board in a station hall: each flap a small dry tick of
  // card on card, never twice the same, and each row landing with a duller
  // clack, a little lower. No beeps; it's the board, not the panel.
  board: (rows) => board(rows, (at, landing, loud) => landing
    ? noise(at, { f: 1300 + Math.random() * 300, q: 3, d: 0.007, peak: 0.087 * loud })
    : noise(at, { f: 2400 + Math.random() * 1600, q: 5, d: 0.002 + Math.random() * 0.002, peak: 0.05 * loud })),
  // A flip clock on the desk rather than the board across the hall: one
  // unit, closer, thicker cards (lower, a touch longer, a dull body under
  // each), fewer of them, and a soft wooden tock as it lands, a little
  // brighter landing on light and duller on dark.
  clock: (row, light) => board([row], (at, landing, loud) => landing
    ? tone(at, 520 + light * 360, { a: 0.001, d: 0.025, peak: 0.018 })
    : noise(at, { f: 1100 + Math.random() * 700, q: 4, d: 0.004 + Math.random() * 0.002, peak: 0.017 * loud }), CLOCK),
  on: [beep(0, 1000, 0.05, 0.016), beep(0.08, 2000, 0.06, 0.016)],
  off: [beep(0, 2000, 0.05, 0.018), beep(0.08, 1000, 0.06, 0.018)],
  // The mark drawing itself in on the landing page (HomeIntro.vue): its
  // ring's two halves and the A's angle as modular's rising brushes (INK,
  // ANGLE_BRUSH).
  ink: INK,
  angle: ANGLE_BRUSH,
  // The stroke across passing over the A's right leg: a nib's small dry
  // tick, with a touch of body under it.
  cross: [
    noise(0, { f: 2600, q: 4, d: 0.003, peak: 0.095 }),
    noise(0.002, { filter: 'lowpass', f: 700, d: 0.008, peak: 0.057 }),
  ],
  // The mark glowing once it's still (1.5s: a quarter blooming, the rest
  // fading): a hum of the marker's, the light's and the slider's family,
  // the lowest of them, on A, swelling and fading with the halo.
  glow: [
    tone(0, GLOW_HUM, { a: 0.375, d: 1.125, peak: 0.032 }),
    tone(0, GLOW_HUM * 1.004, { a: 0.375, d: 1.125, wave: 'triangle', peak: 0.009 }),
    tone(0, GLOW_HUM * 2, { a: 0.375, d: 1.125, peak: 0.009 }),
    tone(0, GLOW_HUM * 4, { a: 0.375, d: 1.125, peak: 0.009 }),
  ],
  // The intro's text parting around the ring as the page scrolls it up
  // into the mark (the lines easing over, 600ms): two soft sines (200 and
  // 500 Hz, as the uses tables), one centered sound that comes apart, the
  // low one going left and the high one right, as the text opens round the
  // mark. Its
  // closing again above it is left quiet.
  part: () => [
    { spec: [tone(0, 200, { a: 0.2, d: 0.4, peak: 0.006 })], pan: 0, travel: { to: -0.3, seconds: PART } },
    { spec: [tone(0, 500, { a: 0.2, d: 0.4, peak: 0.004 })], pan: 0, travel: { to: 0.3, seconds: PART } },
  ],
}

/*
 * Film interface: the screens in a science-fiction film. Glassy tones (a
 * sine with two quiet inharmonic partials over it, as FM gives a bell),
 * breaths of filtered air, data chirping in at random pitches, and more
 * room around everything than the other two.
 */
const glass = (at: number, f: number, d: number, peak = 0.06, send = 0.3): Layer[] => [
  tone(at, f, { a: 0.003, d, peak, send }),
  tone(at, f * 2.76, { a: 0.002, d: d * 0.6, peak: peak * 0.3, send }),
  tone(at, f * 5.4, { a: 0.002, d: d * 0.4, peak: peak * 0.12, send }),
]
const air = (at: number, from: number, to: number, d: number, peak = 0.05) =>
  noise(at, { f: from, f2: to, glide: d, q: 2, a: d * 0.35, d, peak, send: 0.5 })

const FILM_SCALE = [330, 392, 440, 523, 587, 660]

const film: SoundSet = {
  ...CARDS,
  note: (hz) => glass(0, hz, 0.35, 0.05, 0.4),
  slide: (from, to) => slide(from, to,
    (at, length, speed) => [air(at, 1200 + 2400 * speed, 1400 + 2400 * speed, length * 1.3, 0.04 * speed)],
    (at) => glass(at, 440, 0.12, 0.025)),
  tick: (size) => glass(0, noteFor(FILM_SCALE, size), 0.06 + share(size) * 0.15, 0.04, 0.25),
  detent: [...glass(0, 660, 0.12), air(0, 3000, 5000, 0.08, 0.02)],
  undo: glass(0, 440, 0.08, 0.04),
  edge: [tone(0, 98, { d: 0.1, peak: 0.12 }), noise(0, { filter: 'lowpass', f: 400, d: 0.05, peak: 0.06 })],
  toggle: [...glass(0, 660, 0.06, 0.04), ...glass(0.05, 880, 0.1, 0.04)],
  go: [air(0, 3000, 8000, 0.1, 0.03), ...glass(0, 440, 0.15, 0.05, 0.4)],
  lift: [air(0, 600, 2000, 0.08, 0.03), ...glass(0.02, 330, 0.08, 0.035, 0.2)],
  role: [tone(0, 110, { d: 0.2, peak: 0.12 }), ...glass(0, 440, 0.12, 0.015, 0.4)],
  draw: [{ kind: 'cluster', at: 0, n: 3, step: 0.09, fMin: 900, fMax: 2200, d: 0.03, peak: 0.02, send: 0.3, seed: 3 }],
  forward: [air(0, 600, 5000, 0.3, 0.07), tone(0, 220, { f2: 330, glide: 0.3, a: 0.1, d: 0.25, peak: 0.03, send: 0.4 })],
  back: [air(0, 5000, 600, 0.3, 0.07), tone(0, 330, { f2: 220, glide: 0.3, a: 0.1, d: 0.25, peak: 0.03, send: 0.4 })],
  open: [air(0, 800, 4000, 0.15, 0.05), ...glass(0.1, 440, 0.25, 0.05, 0.5), ...glass(0.1, 660, 0.2, 0.02, 0.5)],
  reveal: REVEAL,
  conceal: CONCEAL,
  close: [...glass(0, 330, 0.2, 0.05, 0.4), air(0, 4000, 800, 0.15, 0.04)],
  scan: (way) => scan(way, { a: 0.1, d: 0.8 }, (swell) => tone(0, 220, { ...swell, peak: 0.03, send: 0.3 })),
  sweep: () => scan('up', { a: 0.4, d: 0.6 }, (swell) => tone(0, 220, { ...swell, peak: 0.03, send: 0.3 }), SWEEP.seconds),
  table: (rules, step) => table(rules, step,
    (seconds) => [air(0, 1200, 2400, seconds, 0.02)],
    (at, last) => glass(at, last ? 440 : 660, last ? 0.12 : 0.06, 0.03, 0.3).slice(0, 2)),
  swap: [...glass(0, 440, 0.1, 0.05, 0.4), ...glass(0.08, 660, 0.2, 0.05, 0.4)],
  peek: glass(0, 1320, 0.03, 0.012, 0.2),
  point: glass(0, 990, 0.02, 0.008, 0.2),
  key: () => [noise(0, { f: 3000 + Math.random() * 1500, q: 2, d: 0.004, peak: 0.025 })],
  type: () => typing((at) => noise(at, { f: 3000 + Math.random() * 1500, q: 2, d: 0.004, peak: 0.02 })),
  enter: [noise(0, { f: 2000, q: 2, d: 0.01, peak: 0.035 }), ...glass(0.01, 440, 0.08, 0.02, 0.3)],
  print: () => glass(0, pick([660, 880, 1320]), 0.03, 0.012, 0.3),
  letter: (along) => glass(0, 880 + along * 440, 0.02, 0.004, 0.3),
  board: (rows) => board(rows, (at, landing, loud) => landing
    ? tone(at, 660, { a: 0.002, d: 0.05, peak: 0.02 * loud, send: 0.3 })
    : noise(at, { f: 3000 + Math.random() * 2000, q: 2, d: 0.003, peak: 0.012 * loud, send: 0.2 })),
  clock: (row, light) => board([row], (at, landing, loud) => landing
    ? glass(at, 440 + light * 220, 0.08, 0.025, 0.3)[0]!
    : noise(at, { f: 1800 + Math.random() * 1200, q: 2, d: 0.004, peak: 0.014 * loud, send: 0.2 }), CLOCK),
  on: [...glass(0, 440, 0.1, 0.05, 0.4), ...glass(0.08, 660, 0.2, 0.05, 0.4)],
  off: [...glass(0, 660, 0.1, 0.05, 0.4), ...glass(0.08, 330, 0.2, 0.05, 0.4)],
  ink: [air(0, 1200, 3000, 1.1, 0.03)],
  angle: [air(0, 1500, 3500, 0.7, 0.02)],
  cross: glass(0, 1320, 0.03, 0.015, 0.2),
  glow: [tone(0, 220, { a: 0.375, d: 1.125, peak: 0.03, send: 0.4 })],
  part: glass(0, 1320, 0.3, 0.01, 0.4),
}

export const SOUND_SETS = { modular, panel, film }

export type SoundSetName = keyof typeof SOUND_SETS
