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
  | 'role' | 'draw' | 'key' | 'enter' | 'print' | 'forward' | 'back'
  | 'open' | 'close' | 'step' | 'peek' | 'on' | 'off'

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
   * the word from its first letter (0) to its last (1), `loud` as big as it's
   * set (1 for a headword, less for smaller type).
   */
  letter: (along: number, loud: number) => Spec
}

/*
 * More than one sound's worth at once (a spec holds at most 8 layers): parts
 * played together, each placed on its own in the stereo field.
 */
export type Score = { spec: Spec, pan: number }[]

type Shape = Partial<Omit<ToneLayer, 'kind' | 'at' | 'f'>>
type Filtered = Partial<Omit<NoiseLayer, 'kind' | 'at'>>

const tone = (at: number, f: number, shape: Shape = {}): Layer =>
  ({ kind: 'tone', at, f, wave: 'sine', f2: null, glide: 0.06, a: 0.002, d: 0.05, peak: 0.08, send: 0, ...shape })
const noise = (at: number, shape: Filtered = {}): Layer =>
  ({ kind: 'noise', at, filter: 'bandpass', f: 2000, f2: null, glide: 0.1, q: 1, a: 0.002, d: 0.03, peak: 0.06, send: 0, ...shape })

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
 * marker is fast then (quiet setting off, fullest mid-way, slowing in), and
 * a longer trip is fuller all through. `rail` voices a grain, `land` the
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
  whole: (seconds: number, far: number) => Layer[] = () => [],
): Score {
  const { seconds, grains } = SLIDE
  const far = 0.4 + 0.6 * Math.min(Math.abs(to - from) / 1.2, 1)
  const length = seconds / grains
  return Array.from({ length: grains }, (_, i) => {
    const t = (i + 0.5) / grains
    const grain = rail(i * length, length, speedAt(t) * far, speedAt((i + 1.5) / grains) * far)
    const held = i === Math.floor(grains / 2) ? whole(seconds, far) : []
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

const modular: SoundSet = {
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
  close: [...ping(0, 330, 0.05, 0.08), tone(0, 220, { wave: 'triangle', f2: 110, glide: 0.1, d: 0.12, peak: 0.1 })],
  step: ping(0, 440, 0.04, 0.08),
  peek: ping(0, 880, 0.015, 0.03),
  key: () => [noise(0, { f: 2000 + Math.random() * 1200, q: 3, d: 0.005, peak: 0.03 })],
  enter: [noise(0, { f: 1600, q: 3, d: 0.01, peak: 0.04 }), ...ping(0.01, 220, 0.04, 0.04)],
  print: () => ping(0, pick([440, 660, 880]), 0.02, 0.02),
  letter: (along, loud) => ping(0, 660 + along * 440, 0.015, 0.015 * loud),
  on: [...ping(0, 330, 0.05), ...ping(0.06, 440, 0.08, 0.1, 0.2)],
  off: [...ping(0, 440, 0.05), ...ping(0.06, 330, 0.08)],
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

const HUM = 150
const LIGHT_HUM = 100

const panel: SoundSet = {
  note: (hz) => [...relay(0, 0.04), beep(0, hz, 0.12, 0.06)],
  // The band's marker gliding to the new page: one hum through the whole
  // slide at one pitch, swelling to the middle as it speeds up (a sine for
  // body, a soft triangle a hair off it for the edge), with no landing note:
  // it fades as the marker settles. Dry.
  slide: (from, to) => slide(from, to,
    () => [],
    () => [],
    (seconds, far) => {
      const swell = { a: seconds / 2, d: seconds * 0.45 }
      return [
        tone(0, HUM, { ...swell, peak: 0.035 * far }),
        tone(0, HUM * 1.004, { ...swell, wave: 'triangle', peak: 0.012 * far }),
      ]
    }),
  tick: (size) => [...relay(0, 0.05), beep(0, 1000, 0.01 + share(size) * 0.06, 0.04)],
  detent: [...relay(0), beep(0, 1500, 0.03)],
  undo: relay(0, 0.07, 800),
  edge: [...relay(0, 0.08, 700), ...relay(0.03, 0.06, 700), tone(0, 120, { d: 0.05, peak: 0.1 })],
  // A setting switched: modular's, two pings stepping down, for now.
  toggle: [...ping(0, 440, 0.04), ...ping(0.045, 330, 0.06)],
  // Only the press, a muffled tap with no note in it: the slide and the
  // rain that follow are the sound of going.
  go: [noise(0, { filter: 'lowpass', f: 900, a: 0.001, d: 0.006, peak: 0.04 })],
  lift: [...relay(0, 0.06, 900), beep(0.01, 800, 0.03, 0.04)],
  // The experience band's light moving to the next role: the marker's hum,
  // but the light's own. Lower and grainier, a quiet saw a hair off the sine
  // for its edge, swelling as the light stretches and cut short as it
  // gathers, on the hum's own note. Fuller the farther it travels (`size`,
  // against the band's height).
  role: (size) => {
    const far = 0.4 + 0.6 * share(size)
    const swell = { a: 0.12, d: 0.33 }
    return [
      tone(0, LIGHT_HUM, { ...swell, peak: 0.05 * far }),
      tone(0, LIGHT_HUM * 1.006, { ...swell, wave: 'sawtooth', peak: 0.009 * far }),
      tone(0.4, LIGHT_HUM, { a: 0.006, d: 0.05, peak: 0.015 }),
    ]
  },
  draw: [...relay(0, 0.05), ...relay(0.09, 0.05), ...relay(0.18, 0.06), beep(0.18, 1200, 0.02, 0.035)],
  forward: () => rain(1, panelDrop),
  back: () => rain(-1, panelDrop),
  open: [...relay(0), beep(0.02, 1200, 0.08)],
  // Softer than it opens: a lower beep, eased in, and a muffled thunk
  // rather than the relay's crack, as a lid set down.
  close: [tone(0, 600, { a: 0.008, d: 0.07, peak: 0.035 }), noise(0.04, { filter: 'lowpass', f: 700, d: 0.012, peak: 0.04 })],
  step: [...relay(0, 0.05), beep(0, 1100, 0.015, 0.04)],
  // A tooltip coming out: one small dry tick, the lightest of the relays.
  peek: [noise(0, { f: 3200, q: 4, d: 0.003, peak: 0.025 }), beep(0, 2000, 0.006, 0.01)],
  // The contributions' command typing itself in: soft keys, none quite like
  // the last (a click up top, a dull bottoming out under it), then a
  // heavier one for enter, and the log printing its rows as quiet ticks off
  // the panel, now and then a beep, cooling as they go.
  key: () => [
    noise(0, { f: 2200 + Math.random() * 1400, q: 3, d: 0.003 + Math.random() * 0.003, peak: 0.018 + Math.random() * 0.012 }),
    noise(0.004, { filter: 'lowpass', f: 600, d: 0.008, peak: 0.02 }),
  ],
  enter: [
    noise(0, { f: 1800, q: 3, d: 0.006, peak: 0.035 }),
    noise(0.006, { filter: 'lowpass', f: 500, d: 0.02, peak: 0.04 }),
  ],
  print: () => [Math.random() < 0.15
    ? beep(0, pick(BEEPS), 0.012, 0.015)
    : noise(0, { f: pick(PANEL_DROPS), q: 4, d: 0.003 + Math.random() * 0.004, peak: 0.02 + Math.random() * 0.012 })],
  // A word writing itself, a letter at a time: a trickle of soft thumps,
  // felt more than heard, low and dry, a touch higher along the word, never
  // twice quite the same.
  letter: (along, loud) => [
    tone(0, 140 + along * 40 + Math.random() * 10, { a: 0.002, d: 0.025, peak: 0.012 * loud }),
    noise(0, { filter: 'lowpass', f: 500, d: 0.006, peak: 0.005 * loud }),
  ],
  on: [beep(0, 1000, 0.05), beep(0.08, 2000, 0.06)],
  off: [beep(0, 2000, 0.05), beep(0.08, 1000, 0.06)],
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
  close: [...glass(0, 330, 0.2, 0.05, 0.4), air(0, 4000, 800, 0.15, 0.04)],
  step: glass(0, 660, 0.06, 0.025),
  peek: glass(0, 1320, 0.03, 0.012, 0.2),
  key: () => [noise(0, { f: 3000 + Math.random() * 1500, q: 2, d: 0.004, peak: 0.025 })],
  enter: [noise(0, { f: 2000, q: 2, d: 0.01, peak: 0.035 }), ...glass(0.01, 440, 0.08, 0.02, 0.3)],
  print: () => glass(0, pick([660, 880, 1320]), 0.03, 0.012, 0.3),
  letter: (along, loud) => glass(0, 880 + along * 440, 0.02, 0.008 * loud, 0.3),
  on: [...glass(0, 440, 0.1, 0.05, 0.4), ...glass(0.08, 660, 0.2, 0.05, 0.4)],
  off: [...glass(0, 660, 0.1, 0.05, 0.4), ...glass(0.08, 330, 0.2, 0.05, 0.4)],
}

export const SOUND_SETS = { modular, panel, film }

export type SoundSetName = keyof typeof SOUND_SETS
