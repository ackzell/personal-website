import { get, getAnalyser, playSpec, set, toBufferSpec, unlock, type Spec } from '@foleyjs/core'
import { SOUND_SETS, type FlapRow, type ScanWay, type Score, type SoundKind, type SoundSet, type SoundSetName, type Travel } from './soundSets'

/*
 * What a moment sounds like, in a few kinds. The touch kinds are the same
 * moments utils/haptics.ts gives a feel to (haptic() plays these too, so a
 * desk hears what a finger feels); the rest are the site moving on its own.
 * - tick: a scrub passing from one item to the next. Given the item's size
 *   (0 to 1, against the biggest), it sounds that size: a long role, a long
 *   episode, a busy month rings longer than a short one.
 * - detent / undo: a drag reaching the point where letting go will act, and
 *   coming back short of it.
 * - edge: a drag that has nowhere to go.
 * - toggle: a setting switched (the color scheme, the language).
 * - go: a tap that takes you to another page.
 * - lift: a sticker picked up under the finger.
 * - role: the experience band's light moving to another role, fuller the
 *   farther it goes (`size`).
 * - draw: a uses table drawing in, felt only now: it's heard as type, then
 *   as soundTable while its rules draw (UsesTables.vue).
 * - type: the uses queries typing in together, one quick run of keys.
 * - key / enter: the contributions' command typing itself in on arrival,
 *   key by key, and run.
 * - print: a row of a log or table printed then. Many come close together; they
 *   thin out on their own (below).
 * - forward / back: a page change to the next or an earlier section (the
 *   tiled wipe), moving the way the flag does.
 * - open / close: the media guide's sheet or panel coming up and going away.
 * - reveal / conceal: the lightbox opening, its picture flying out of the
 *   page, and closing, flying back (a brighter breath, then a darker one).
 * - swap: another pick taking the open side panel's place.
 * - peek: a tooltip coming out.
 * - point: the pointer (or keyboard focus) lighting another item in a graph.
 * - on / off: sound itself switched (the switch is heard, not muted).
 * - ink / angle / cross / glow: the mark drawing itself in on the landing
 *   page: its ring's two halves inked, the A's angle drawn, the stroke
 *   across passing over the A, and the glow once it's still.
 * - part: the landing intro's text parting around the mark as it scrolls
 *   up into it (closing again is quiet).
 * And the language switch, heard as the page's text turning over like a
 * departures board as it scrambles (soundBoard), and the color scheme's
 * word as a flip clock on a desk (soundClock); and a picture or clip
 * sweeping in behind a line of light, the way the line goes (soundScan).
 *
 * How each one sounds is a set's (utils/soundSets.ts); SET is the one the
 * site plays. In dev, /dev/sounds can put another in its place for a while,
 * to hear it on the real pages.
 */
export type Sound = SoundKind

const SET: SoundSetName = 'panel'
const AUDITION_KEY = 'sound-set'

// Full: sound is off until the visitor asks for it, so once they do, it's
// heard at the levels each sound is set to.
const VOLUME = 1
const STORAGE_KEY = 'sound'

let started = false
let muting: ReturnType<typeof setTimeout> | undefined

function start() {
  if (started) return
  started = true
  set({ theme: 'default', volume: VOLUME, muted: !soundIsOn() })
}

/** Whether the visitor has sound on: off unless they switched it on. */
export function soundIsOn() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    // Storage blocked (private mode, site data off): off, the default.
    return false
  }
}

/*
 * What waits to hear sound being switched on (the landing mark drawing
 * itself in again, so the press is answered with its sound). Returns the
 * way to stop waiting.
 */
const turnedOn = new Set<VoidFunction>()
export function onSoundOn(run: VoidFunction) {
  turnedOn.add(run)
  return () => void turnedOn.delete(run)
}

/*
 * Switches sound on or off, remembered for the next visit. Switched off, it
 * can wait `after` ms to go quiet, so the sound saying so plays out whole.
 */
export function setSoundOn(on: boolean, after = 0) {
  start()
  clearTimeout(muting)
  if (on || !after) set({ muted: !on })
  else muting = setTimeout(() => set({ muted: true }), after)
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // Remembered for this visit only.
  }
  if (on) for (const run of turnedOn) run()
}

/** The set the site plays: SET, or in dev the one /dev/sounds put in its place. */
export function soundSet(): SoundSetName {
  if (import.meta.dev) {
    try {
      const picked = localStorage.getItem(AUDITION_KEY)
      if (picked && picked in SOUND_SETS) return picked as SoundSetName
    } catch {
      // Storage blocked: SET it is.
    }
  }
  return SET
}

/** Dev only: plays `name` across the site in SET's place, or SET again with null. */
export function auditionSet(name: SoundSetName | null) {
  try {
    if (name) localStorage.setItem(AUDITION_KEY, name)
    else localStorage.removeItem(AUDITION_KEY)
  } catch {
    // Storage blocked: nothing to put in its place.
  }
}

const isScore = (spec: object[]): spec is Score => 'spec' in (spec[0] ?? {})

function play(spec: Spec | Score, id: string) {
  start()
  if (!isScore(spec)) return playSpec(spec, { id })
  spec.forEach((part, i) => part.travel
    ? playTravelling(part.spec, part.pan, part.travel)
    : playSpec(part.spec, { id: `${id}:${i}`, pan: part.pan }))
}

/*
 * Foley places a sound once, for the whole of it, and nudges each play's
 * pitch and level a little (up to 30 cents, 8%) so repeats don't sound
 * canned. So a sound that travels can't be several plays panned along the
 * way: they'd land out of tune with each other and beat, heard as two. It's
 * rendered once instead (foley's renders are never nudged, so each is kept)
 * and played through a panner of its own, moving eased out, at the site's
 * volume, into the engine's output.
 */
const rendered = new Map<string, Promise<AudioBuffer | null>>()

async function playTravelling(spec: Spec, from: number, { to, seconds }: Travel) {
  const key = JSON.stringify(spec)
  if (!rendered.has(key)) rendered.set(key, toBufferSpec(spec))
  const buffer = await rendered.get(key)!
  unlock()
  const out = getAnalyser()
  const { muted, volume } = get()
  if (!buffer || !out || muted) return
  const context = out.context
  const source = context.createBufferSource()
  source.buffer = buffer
  const gain = context.createGain()
  gain.gain.value = volume
  const pan = context.createStereoPanner()
  pan.pan.value = from
  const when = context.currentTime + 0.01
  const way = Float32Array.from({ length: 32 }, (_, i) => from + (to - from) * (1 - (1 - i / 31) ** 3))
  pan.pan.setValueCurveAtTime(way, when, seconds)
  source.connect(gain).connect(pan).connect(out)
  source.onended = () => source.disconnect()
  // A render starts its sound 0.03s in.
  source.start(when, 0.03)
}

/** What a set plays for a moment, picked out of it: `(set) => set.slide(from, to)`. */
type Make = (set: SoundSet) => Spec | Score

const ofKind = (kind: Sound, size?: number): Make => (sounds) => {
  const kept = sounds[kind]
  return typeof kept === 'function' ? kept(size) : kept
}

/*
 * Plays what `make` picks from a given set, whatever the switch says
 * (/dev/sounds). It unmutes to do so; the site's next sound() mutes again
 * if it's off.
 */
export function playFromSet(name: SoundSetName, make: Make, id: string) {
  start()
  set({ muted: false })
  play(make(SOUND_SETS[name]), `${name}:${id}`)
}

/** One kind from a given set, whatever the switch says (/dev/sounds). */
export const playFrom = (name: SoundSetName, kind: Sound, size?: number) => playFromSet(name, ofKind(kind, size), kind)

/*
 * Foley keeps 60ms between two plays of one id, which swallows a burst of
 * the same sound down to a few. Typing is quicker than that and every key
 * should be heard, so keys (and letters, soundLetter) take turns between
 * ids; rows printing are left to thin. Each pitch of a note keeps its own.
 */
const TURNS: Partial<Record<Sound, number>> = { key: 3 }
let turn = 0
let letterTurn = 0
const idFor = (kind: Sound) => (TURNS[kind] ? `${kind}:${turn++ % TURNS[kind]}` : kind)

/*
 * Whether a sound would be heard now. Muted, nothing is played at all: the
 * first play wakes the audio (an AudioContext, a few dozen ms on a phone),
 * and a swipe's detent shouldn't stall the page under the finger for a
 * sound nobody hears.
 */
function heard() {
  if (!import.meta.client || navigator.userActivation?.hasBeenActive === false) return false
  if (import.meta.dev) set({ muted: !soundIsOn() })
  start()
  return !get().muted
}

/*
 * Plays what `make` picks from the site's set, if it would be heard.
 * Browsers only let audio start after the visitor has pressed or typed
 * something. Until then a sound is left out rather than queued: a role
 * reaching the line on the first scroll isn't worth waking the audio for.
 */
function soundWith(make: Make, id: string) {
  if (heard()) play(make(SOUND_SETS[soundSet()]), id)
}

export const sound = (kind: Sound, size?: number) => soundWith(ofKind(kind, size), idFor(kind))

/** A single note at `hz`, in the set's voice: for what plays a tune. */
export const soundNote = (hz: number) => soundWith((s) => s.note(hz), `note:${hz}`)

/** A letter of a word writing itself (SoundSet's `letter`): where it is in the word. */
export const soundLetter = (along: number) => soundWith((s) => s.letter(along), `letter:${letterTurn++ % 3}`)

/** The band's marker sliding across the screen, `from` and `to` from -1 (left) to 1 (right). */
export const soundSlide = (from: number, to: number) => soundWith((s) => s.slide(from, to), 'slide')

/** The page's text scrambling into another language, as a departures board turning over. */
export const soundBoard = (rows: FlapRow[]) => soundWith((s) => s.board(rows), 'board')

/** The color scheme's word scrambling into the next, as a flip clock: landing `light` (1), dark (0), system (0.5). */
export const soundClock = (row: FlapRow, light: number) => soundWith((s) => s.clock(row, light), 'clock')

/** A uses table drawing in: `rules` rules, one every `step` seconds. */
export const soundTable = (rules: number, step: number) => soundWith((s) => s.table(rules, step), 'table')

/** The color scheme scanned up the page behind its line (SiteSchemeSwitch). */
export const soundSweep = () => soundWith((s) => s.sweep(), 'sweep')

/**
 * A picture or clip sweeping in behind its line of light (the media palette,
 * the lightbox), the line going `way`, at `loud` of its set's level.
 */
export const soundScan = (way: ScanWay, loud = 1) => soundWith((s) => {
  const score = s.scan(way)
  return loud === 1 ? score : score.map((part) => ({
    ...part,
    spec: part.spec.map((layer) => ({ ...layer, peak: layer.peak * loud })),
  }))
}, 'scan')
