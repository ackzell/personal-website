import { playSpec, set, type Spec } from '@foleyjs/core'
import { SOUND_SETS, type Score, type SoundKind, type SoundSetName } from './soundSets'

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
 * - draw: a uses table drawing in as the page scrolls. Quiet: scrolling
 *   plays them one after another.
 * - key / enter: the contributions' command typing itself in on arrival,
 *   key by key, and run.
 * - print: a row of its log printed then. Many come close together; they
 *   thin out on their own (below).
 * - forward / back: a page change to the next or an earlier section (the
 *   tiled wipe), moving the way the flag does.
 * - open / close: a sheet, panel or picture coming up and going away.
 * - step: the picture in the lightbox turning over to the next one.
 * - peek: a tooltip coming out.
 * - on / off: sound itself switched (the switch is heard, not muted).
 *
 * How each one sounds is a set's (utils/soundSets.ts); SET is the one the
 * site plays. In dev, /dev/sounds can put another in its place for a while,
 * to hear it on the real pages.
 */
export type Sound = SoundKind

const SET: SoundSetName = 'panel'
const AUDITION_KEY = 'sound-set'

// Quiet out of the box: a touch under the surface, not over it.
const VOLUME = 0.35
const STORAGE_KEY = 'sound'

let started = false
let muting: ReturnType<typeof setTimeout> | undefined

function start() {
  if (started) return
  started = true
  set({ theme: 'default', volume: VOLUME, muted: !soundIsOn() })
}

/** Whether the visitor has sound on: on unless they switched it off. */
export function soundIsOn() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    // Storage blocked (private mode, site data off): on, the default.
    return true
  }
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
  spec.forEach((part, i) => playSpec(part.spec, { id: `${id}:${i}`, pan: part.pan }))
}

function playOne(name: SoundSetName, kind: Sound, size: number | undefined, id: string) {
  const kept = SOUND_SETS[name][kind]
  play(typeof kept === 'function' ? kept(size) : kept, id)
}

// Each pitch keeps its own cooldown, so a quick run plays every note.
function playNote(name: SoundSetName, hz: number) {
  start()
  playSpec(SOUND_SETS[name].note(hz), { id: `note:${hz}` })
}

/** A slide from a given set, whatever the switch says (/dev/sounds). */
export function playSlideFrom(name: SoundSetName, from: number, to: number) {
  start()
  set({ muted: false })
  play(SOUND_SETS[name].slide(from, to), `${name}:slide`)
}

/** A letter from a given set, whatever the switch says (/dev/sounds). */
export function playLetterFrom(name: SoundSetName, along: number, loud: number) {
  start()
  set({ muted: false })
  play(SOUND_SETS[name].letter(along, loud), `${name}:letter:${letterTurn++ % 3}`)
}

/** A note from a given set, whatever the switch says (/dev/sounds). */
export function playNoteFrom(name: SoundSetName, hz: number) {
  start()
  set({ muted: false })
  playNote(name, hz)
}

/*
 * Plays one kind from a given set, whatever the switch says (/dev/sounds).
 * It unmutes to do so; the site's next sound() mutes again if it's off.
 */
export function playFrom(name: SoundSetName, kind: Sound, size?: number) {
  start()
  set({ muted: false })
  playOne(name, kind, size, `${name}:${kind}`)
}

/*
 * Foley keeps 60ms between two plays of one id, which swallows a burst of
 * the same sound down to a few. Typing is quicker than that and every key
 * should be heard, so keys (and letters, soundLetter) take turns between ids; rows printing are left
 * to thin.
 */
const TURNS: Partial<Record<Sound, number>> = { key: 3 }
let turn = 0
let letterTurn = 0
const idFor = (kind: Sound) => (TURNS[kind] ? `${kind}:${turn++ % TURNS[kind]}` : kind)

/*
 * Browsers only let audio start after the visitor has pressed or typed
 * something. Until then a sound is left out rather than queued: a role
 * reaching the line on the first scroll isn't worth waking the audio for.
 */
export function sound(kind: Sound, size?: number) {
  if (!import.meta.client || navigator.userActivation?.hasBeenActive === false) return
  if (import.meta.dev) set({ muted: !soundIsOn() })
  playOne(soundSet(), kind, size, idFor(kind))
}

/** A single note at `hz`, in the set's voice: for what plays a tune. */
export function soundNote(hz: number) {
  if (!import.meta.client || navigator.userActivation?.hasBeenActive === false) return
  if (import.meta.dev) set({ muted: !soundIsOn() })
  playNote(soundSet(), hz)
}

/** A letter of a word writing itself (SoundSet's `letter`): where it is in the word, and how big. */
export function soundLetter(along: number, loud: number) {
  if (!import.meta.client || navigator.userActivation?.hasBeenActive === false) return
  if (import.meta.dev) set({ muted: !soundIsOn() })
  play(SOUND_SETS[soundSet()].letter(along, loud), `letter:${letterTurn++ % 3}`)
}

/** The band's marker sliding across the screen, `from` and `to` from -1 (left) to 1 (right). */
export function soundSlide(from: number, to: number) {
  if (!import.meta.client || navigator.userActivation?.hasBeenActive === false) return
  if (import.meta.dev) set({ muted: !soundIsOn() })
  play(SOUND_SETS[soundSet()].slide(from, to), 'slide')
}
