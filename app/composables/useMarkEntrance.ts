import { animate, cubicBezier, frame, mapValue, motionValue, svgEffect, type AnimationPlaybackControls, type MotionValue } from 'motion-v'
import { createMarkTiles, type Stroke, type StrokeName } from '~/utils/markTiles'
import type { Landing } from '~/utils/soundSets'

// Each ring half inking in, and how long the bottom one waits after the top.
const INK = 1.5
const STAGGER = 0.45
// The A's angle, up one leg and down the other, in one stroke.
const ANGLE = 0.9

const INKING = [0.45, 0, 0.15, 1] as const
const ANGLING = [0.65, 0, 0.35, 1] as const
const FLICKING = [0.22, 1, 0.36, 1] as const

const A_AT = 1 + STAGGER
// The flick is so quick off the mark that it would overrun its own tiles, so
// they run up it first, foot to tip, and it waits for them; and they wait for
// the angle's, to read as a stroke of their own.
const CROSS_WAIT = 0.13
const CROSS_SWEEP = 0.45
const CROSS_AT = A_AT + 1.07 + CROSS_WAIT
const CROSS = 0.4
// How far along the stroke across it passes over the A's right leg.
const CROSSING = 0.53
// How many of the tiles are heard settling: enough for a patter, not a rain.
const TILES_HEARD = 32

export const MARK_STROKES: Record<StrokeName, Stroke> = {
  top: { start: 0, duration: INK, ease: cubicBezier(...INKING) },
  // A beat after the top, so the two are seen as two strokes rather than one.
  bottom: { start: STAGGER, duration: INK, ease: cubicBezier(...INKING) },
  // One stroke over both legs: the left one draws through the first half.
  angle: { start: A_AT, duration: ANGLE, ease: cubicBezier(...ANGLING) },
  cross: { start: CROSS_AT, duration: CROSS, ease: cubicBezier(...FLICKING), wait: CROSS_WAIT, sweep: CROSS_SWEEP },
}

/** Landings by the second they fall in: when each second starts, and its landings timed from then. */
function heardTiles(landings: Landing[]) {
  const seconds = new Map<number, Landing[]>()
  for (const { at, pan } of landings) {
    const second = Math.floor(at)
    seconds.set(second, [...seconds.get(second) ?? [], { at: at - second, pan }])
  }
  return [...seconds]
}

/* A tight halo and a wide one, sized to the mark so a small one on a phone
   glows as much as a large one; `strength` 0 is none. */
function halo(glyph: SVGSVGElement, strength: number) {
  const size = glyph.clientWidth
  const [r, g, b] = getComputedStyle(glyph).color.match(/[\d.]+/g)!.map(Number)
  const ring = (blur: number, alpha: number) => `drop-shadow(0 0 ${(size * blur).toFixed(1)}px rgba(${r}, ${g}, ${b}, ${alpha * strength}))`
  return `${ring(0.012, 0.7)} ${ring(0.045, 0.45)}`
}

function glow(glyph: SVGSVGElement) {
  const strength = motionValue(0)
  strength.on('change', now => glyph.style.filter = halo(glyph, now))
  return animate(strength, [0, 1, 0], {
    duration: 1.5,
    times: [0, 0.25, 1],
    ease: [[0.22, 1, 0.36, 1], [0.45, 0, 0.55, 1]],
  })
}

/** Runs `then` the first time `value` reaches `at`. Returns how to call it off. */
function once(value: MotionValue<number>, then: VoidFunction, at = 0) {
  const off = value.on('change', (now) => {
    if (now < at) return
    off()
    then()
  })
  return off
}

/**
 * The landing mark's entrance: small tiles come up on it just ahead of the pens
 * that follow them: the top arc is inked left to right and the bottom right to
 * left; as they glide into the gaps the A is drawn, its angle in one stroke up
 * and over, then the stroke across flicked out to its tip, and the flick
 * carries the A with it: it rocks toward the tip on its feet and springs back
 * upright; once it's still, it glows a moment.
 *
 * `live` is false until it starts: CSS keeps the mark hidden till then, so the
 * whole mark never flashes first. Under reduced motion it never runs.
 */
export function useMarkEntrance(mark: Readonly<Ref<HTMLElement | null>>) {
  const live = ref(false)
  // Drawn once per page load: coming back to home within the site finds it
  // already there, so seeing it again takes a reload. App state, so it lasts
  // across client navigations and starts over with the document.
  const drawnThisLoad = useState('home-mark-drawn', () => false)
  let cleanups: VoidFunction[] = []
  let running: AnimationPlaybackControls[] = []
  // Which drawing is current, so a stopped one's follow-ups never run into the next.
  let run = 0

  const glyphOf = () => mark.value?.querySelector('svg')
  const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function drawIn() {
    const glyph = glyphOf()
    if (!glyph) return
    const current = ++run
    const tiles = createMarkTiles(mark.value!, glyph, MARK_STROKES)
    // One clock for the tiles and everything the pens do, so they can't come apart.
    const clock = motionValue(0)
    const onClock = ({ start, duration, ease }: Stroke) =>
      mapValue(clock, [tiles.lead + start, tiles.lead + start + duration], [0, 1], { ease })
    const top = onClock(MARK_STROKES.top)
    const bottom = onClock(MARK_STROKES.bottom)
    const angle = onClock(MARK_STROKES.angle)
    const cross = onClock(MARK_STROKES.cross)
    const rock = motionValue(0)
    // Tipped quickly as the flick reaches the tip, and let go from there.
    const tipping = onClock({ start: CROSS_AT + CROSS / 2, duration: 0.14, ease: cubicBezier(...FLICKING) })

    /* A spring that rocks it past upright once and settles; it picks up whatever
       speed the tip still has. (A spring from 0 to 0 with a kick alone doesn't
       run.) Once it's still, a halo in its own color blooms and fades, and the
       mark is left flat, with no filter on it. */
    function letGo() {
      const settle = animate(rock, 0, { type: 'spring', bounce: 0.2, visualDuration: 0.5, velocity: rock.getVelocity() })
      running.push(settle)
      settle.then(() => {
        if (current !== run) return
        sound('glow')
        const glowing = glow(glyph!)
        running.push(glowing)
        glowing.then(() => glyph!.style.removeProperty('filter'))
      })
    }

    cleanups = [
      svgEffect(glyph.querySelectorAll('.glyph-pen-ring')[0]!, { pathLength: top }),
      svgEffect(glyph.querySelectorAll('.glyph-pen-ring')[1]!, { pathLength: bottom }),
      svgEffect(glyph.querySelector('.glyph-pen-left')!, { pathLength: mapValue(angle, [0, 0.5], [0, 1]) }),
      svgEffect(glyph.querySelector('.glyph-pen-right')!, { pathLength: mapValue(angle, [0.5, 1], [0, 1]) }),
      svgEffect(glyph.querySelector('.glyph-pen-cross')!, { pathLength: cross }),
      svgEffect(glyph.querySelector('.glyph-a')!, { rotate: rock }),
      clock.on('change', tiles.paint),
      tipping.on('change', now => rock.set(now)),
      once(tipping, letGo, 1),
      // A tick as the stroke across passes over the A's right leg.
      once(cross, () => sound('cross'), CROSSING),
      // The tiles settling, heard a second's worth at a time on the same clock
      // (a sound can't start much more than that after it's played).
      ...heardTiles(tiles.landings(TILES_HEARD)).map(([at, landings]) => once(clock, () => soundTiles(landings), at)),
      tiles.destroy,
    ]
    frame.render(() => live.value = true)

    const total = Math.max(tiles.end, tiles.lead + CROSS_AT + CROSS)
    const building = animate(clock, total, { duration: total, ease: 'linear' })
    building.then(() => {
      if (current === run) tiles.destroy()
    })
    running = [building]
  }

  function stop() {
    for (const cleanup of cleanups) cleanup()
    for (const animation of running) animation.stop()
    cleanups = []
    running = []
    run++
  }

  /* Sound switched on: if the mark is on screen, it draws itself in again from
     nothing, so the press is answered by the mark's own sound. */
  function replay() {
    const glyph = glyphOf()
    if (!glyph || calm()) return
    const { top, bottom } = glyph.getBoundingClientRect()
    if (bottom <= 0 || top >= window.innerHeight) return
    stop()
    glyph.style.removeProperty('filter')
    drawIn()
  }

  onMounted(() => {
    onBeforeUnmount(onSoundOn(replay))
    if (calm()) return
    // Left alone, the pens show the mark whole.
    if (drawnThisLoad.value) live.value = true
    else {
      drawnThisLoad.value = true
      drawIn()
    }
  })
  onBeforeUnmount(stop)

  return { live }
}
