import { WebHaptics, type HapticInput } from 'web-haptics'
import { sound } from './sounds'

/*
 * What a touch feels like, in a few kinds, so the same moment feels the same
 * wherever it happens:
 * - tick: a scrub passing from one stop to the next (a role, a column, a cell).
 *   Given the stop's size (0 to 1, against the biggest), a bigger one is felt
 *   longer, as it's heard lower (utils/sounds.ts).
 * - detent: a drag reaching the point where letting go will act (a swipe to
 *   the next page, a sheet or picture pulled far enough to put away).
 * - undo: the same drag coming back short of it.
 * - edge: a drag that has nowhere to go (a swipe past the last page).
 * - toggle: a setting switched.
 * - language / scheme: the language or color scheme switched, felt as a toggle.
 * - fold: a fold opened or closed (Amoxtli's chapters), felt as a toggle.
 * - sweep: the color scheme scanned up the page (SiteSchemeSwitch): the press,
 *   then the line passing under the thumb, a grain at each sixth of the page
 *   it crosses, so they crowd where it runs fastest.
 * - go: a tap that takes you to another page (the flag band).
 * - key: a finger reaching one of the socials, a key on a little keyboard.
 * - stick: a bar catching at the top of the screen as the page scrolls.
 * - lift: a sticker picked up under the finger.
 * - tilt: the same sticker tilted about under it, a grain every so often as
 *   the finger travels, firmer the further it leans from flat (size, 0 to 1).
 * - ripple: a press sending a ring of tiles through the backdrop mark, one
 *   tick at its smallest. Given how far across the screen (0 to 1), for its
 *   sound's pan.
 * - pick / lay / turn / nudge: a solitaire card picked up, put down, flicked
 *   over or taken back, and refused. Felt as lift, detent, tick and edge are,
 *   but heard as card stock (utils/soundSets.ts, CARDS).
 *
 * Scrolling through a list, each list has a beat of its own, so a thumb can
 * tell where it is without looking:
 * - role: a role in the experience reaching the reading line, one firm thump.
 * - commit: a project in the contributions log reaching it, a quick double
 *   tap, like a log's commits.
 * - draw: a uses table drawing itself in, a short run of three.
 * iOS fakes a vibration with clicks, one at most every 16ms (at full
 * intensity) to 200ms (at none), so these differ by count and spacing, which
 * it keeps, rather than by length, which it doesn't.
 */
/*
 * Full strength, and kept under 16ms: the library's own `selection` is 2ms
 * of vibration on Android, too short for most phones to give, and past 16ms
 * iOS would click twice. Within that, 6ms for the smallest stop, 15 for the
 * biggest; iOS clicks once either way.
 */
function tick(size = 0.5): HapticInput {
  const share = Math.min(Math.max(size, 0), 1)
  return [{ duration: Math.round(6 + share * 9), intensity: 1 }]
}

// Lighter than a tick: from barely there at flat to half of one at the edge.
function tilt(size = 0): HapticInput {
  const share = Math.min(Math.max(size, 0), 1)
  return [{ duration: Math.round(2 + share * 4), intensity: 1 }]
}

const KINDS = {
  tick,
  tilt,
  detent: 'light',
  // Not `selection` either, for the same reason as the tick.
  undo: [{ duration: 8, intensity: 1 }],
  edge: 'rigid',
  toggle: 'light',
  language: 'light',
  scheme: 'light',
  fold: 'light',
  /*
   * The press, then five grains at 1/6 … 5/6 of the page, timed on the line's
   * 700ms ease in and out (main.css, "Scheme scan"): at 243, 307, 350, 393 and
   * 457ms. Each delay counts from the end of the one before. Under 16ms so iOS
   * clicks once each; firmest mid-page, where the line is fastest.
   */
  sweep: [
    { duration: 12, intensity: 0.8 },
    { delay: 231, duration: 8, intensity: 0.5 },
    { delay: 56, duration: 8, intensity: 0.7 },
    { delay: 35, duration: 8, intensity: 0.9 },
    { delay: 35, duration: 8, intensity: 0.7 },
    { delay: 56, duration: 8, intensity: 0.5 },
  ],
  go: 'soft',
  // A tick's crisp single click, at its fullest: a key going down.
  key: [{ duration: 12, intensity: 1 }],
  stick: 'light',
  ripple: [{ duration: 6, intensity: 1 }],
  lift: 'medium',
  pick: 'medium',
  lay: 'light',
  turn: tick,
  nudge: 'rigid',
  role: [{ duration: 30, intensity: 0.8 }],
  commit: [{ duration: 12, intensity: 0.7 }, { delay: 70, duration: 12, intensity: 0.7 }],
  draw: [{ duration: 12, intensity: 0.6 }, { delay: 90, duration: 12, intensity: 0.6 }, { delay: 90, duration: 12, intensity: 0.6 }],
} satisfies Record<string, HapticInput | ((size?: number) => HapticInput)>

export type Haptic = keyof typeof KINDS

/*
 * One for the whole site, made on first use and only on touch screens.
 * Android vibrates; iOS has no vibration API, so web-haptics clicks a hidden
 * switch, which iOS answers with its own tick (that click is kept from the
 * rest of the site: plugins/haptics.client.ts).
 */
let haptics: WebHaptics | null | undefined

function instance() {
  if (haptics === undefined) haptics = matchMedia('(pointer: coarse)').matches ? new WebHaptics() : null
  return haptics
}

/** Whether a click is web-haptics' own, on its hidden switch or the label for it. */
export function isHapticClick(event: Event) {
  return !!(event.target as Element | null)?.closest?.('[for^="web-haptics-"], [id^="web-haptics-"]')
}

// Every moment that's felt is heard too, on any screen (utils/sounds.ts),
// but these: the sticker's tilt, which has no sound yet, a bar sticking and
// a project in the log reaching the line, too much to hear on every scroll;
// a uses table drawing in, heard as it types and prints instead
// (UsesTables.vue); a social key, heard as its note (SiteFooter.vue); and the language and color scheme, heard as their text
// turning over or their line sweeping up instead (plugins/locale-scramble.client.ts,
// SiteSchemeSwitch.vue); and a chapter folding, too slight to hear (MediaChapters.vue).
const SILENT = ['tilt', 'stick', 'commit', 'draw', 'key', 'language', 'scheme', 'sweep', 'fold'] as const satisfies readonly Haptic[]
// The rest must each be a Sound too, or sound(kind) below won't type-check.
const isHeard = (kind: Haptic): kind is Exclude<Haptic, (typeof SILENT)[number]> => !(SILENT as readonly Haptic[]).includes(kind)

// `size` is what a scrub's tick passed over (0 to 1).
export function haptic(kind: Haptic, size?: number) {
  if (!import.meta.client) return
  const input = KINDS[kind]
  instance()?.trigger(typeof input === 'function' ? input(size) : input)
  if (isHeard(kind)) sound(kind, size)
}
