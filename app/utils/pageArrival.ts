import { animate, motionValue, type AnimationPlaybackControls } from 'motion-v'

/*
 * How a page comes in, however it was reached: block by block, from the side
 * it lies on along the flag band (or from below when it lies on neither),
 * the blocks nearest where the visitor acted first. A swipe acts at the
 * finger, a click or tap at the pointer, back/forward at the new section's
 * field in the band.
 *
 * Within a section the blocks follow one another closely, REACH of the
 * screen away waiting up to WAIT more (s). On a section change they ride the
 * tile front instead (public/worklets/tile-wipe.js): a block opens about when the slabs
 * over it do, TILE_FRONT of the run per share of the farthest corner.
 */
const ARRIVE = 0.12
const LIFT = 24
const AFTER = 0.08
const REACH = 0.5
const WAIT = 0.12
const LAND = 0.45
const TILE_RUN = 0.95
const TILE_FRONT = 0.3
/** The tile front's lead in the direction of travel, and lag behind (mirrors the worklet). */
const TILE_AHEAD = 0.7
const TILE_BEHIND = 1.3
/** A block is anything on screen up to TALL of it high; taller ones split into what they're made of. */
const TALL = 0.4

/** Component entrances that the arrival stands in for during a page change. */
const ENTRANCES = new Set(['vt-develop', 'vt-lift', 'vt-rise', 'vt-fade-in'])

/*
 * A block marked `data-arrives-itself` keeps its own entrance instead (the
 * section index's names, one after another): it isn't moved, and its
 * entrances replay from the start on the block's beat, given to it as
 * --arrive-delay for its CSS to start from.
 */
function replay(el: HTMLElement, delay: number) {
  el.style.setProperty('--arrive-delay', `${Math.round(delay * 1000)}ms`)
  for (const animation of el.getAnimations({ subtree: true })) {
    if (!(animation instanceof CSSAnimation) || !ENTRANCES.has(animation.animationName)) continue
    animation.currentTime = 0
    animation.play()
  }
}

export type Point = { x: number; y: number }

/**
 * The page's blocks on screen: split down until each is short enough to move on its own.
 * A bar that holds a copy of the mark (SiteMarkLayer) never moves: a transform
 * would make it the box its fixed copy is placed in, and the mark would ride
 * off with it. Its parts move instead, or, if it can't split, it holds still.
 */
export function blocksOf(main: Element) {
  const found: HTMLElement[] = []
  const visit = (el: Element) => {
    if (el.classList.contains('site-mark-clip')) return
    const box = el.getBoundingClientRect()
    if (box.bottom < 0 || box.top > window.innerHeight || !(el instanceof HTMLElement)) return
    const parts = [...el.children]
    const holdsMark = !!el.querySelector('.site-mark-clip')
    // Only into boxes: an inline part, or text of its own, moves with what holds it.
    const splits = (holdsMark || box.height > window.innerHeight * TALL || !box.height) && parts.length
      && parts.every((part) => getComputedStyle(part).display !== 'inline')
      && ![...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
    if (splits) parts.forEach(visit)
    else if (box.height && !holdsMark) found.push(el)
  }
  ;[...main.children].forEach(visit)
  return found
}

/** How far a block is from a point, in px: 0 when the point is level with it (`y` only) or on it. */
export function distanceTo(el: Element, { x, y }: Point, levelOnly = false) {
  const box = el.getBoundingClientRect()
  const dy = y - Math.min(Math.max(y, box.top), box.bottom)
  if (levelOnly) return Math.abs(dy)
  const dx = x - Math.min(Math.max(x, box.left), box.right)
  return Math.hypot(dx, dy)
}

/** How far the tile front has to go to a block: x stretched on each side of the press, as in the worklet. */
function frontDistance(el: Element, from: Point, way: number) {
  const box = el.getBoundingClientRect()
  const dx = from.x - Math.min(Math.max(from.x, box.left), box.right)
  const dy = from.y - Math.min(Math.max(from.y, box.top), box.bottom)
  // dx points from the block to the press, so a block ahead has dx * way > 0.
  return Math.hypot(dx * (dx * way > 0 ? TILE_AHEAD : TILE_BEHIND), dy)
}

/*
 * Where the last press was, kept briefly so the page change it starts can
 * spread from it. A swipe sets it to where the finger let go.
 */
let press: (Point & { time: number }) | undefined

export function pressAt(point: Point) {
  press = { ...point, time: performance.now() }
}

if (import.meta.client) {
  document.addEventListener(
    'click',
    (event) => {
      // A keyboard press has no pointer: the link it was on.
      const link = (event.target as Element | null)?.closest?.('a')
      if (event.detail > 0) pressAt({ x: event.clientX, y: event.clientY })
      else if (link) pressAt(center(link))
    },
    { capture: true },
  )
}

function center(el: Element): Point {
  const box = el.getBoundingClientRect()
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

let origin: Point = { x: 0, y: 0 }

/**
 * Settles where a change to `section` starts, as it starts: the last press,
 * or that section's field in the band. Read before the old page goes, and
 * used up, so a later back/forward doesn't start from a stale click.
 */
export function startChange(section: string): Point {
  const field = document.querySelector(`.flag-nav__segment[data-section='${section}'] .flag-nav__field`)
  origin = press && performance.now() - press.time < 1000
    ? press
    : field ? center(field) : { x: document.documentElement.clientWidth / 2, y: 0 }
  press = undefined
  return origin
}

/** Where the page change in progress started. */
export const changeOrigin = () => origin

let arriving: { el: HTMLElement; controls: AnimationPlaybackControls }[] = []
const wordDelays = import.meta.client ? document.createElement('style') : undefined

/** Every arriving block where it belongs, at once. */
export function land() {
  for (const { el, controls } of arriving) {
    controls.stop()
    el.style.transform = el.style.opacity = ''
  }
  arriving = []
}

export const isArriving = () => arriving.length > 0

/**
 * Brings the page's blocks in. `way` is the side the page lies on along the
 * band (1 to the right, -1 to the left, 0 neither); `tiles` when it arrives
 * under the tiled section change. Resolves once they've all landed.
 *
 * Moves go on `transform`, so a block's own CSS `translate` still adds up;
 * the components' own entrances are finished at once instead, so a block
 * doesn't arrive twice.
 */
export function arrive({ way, from, tiles }: { way: number; from: Point; tiles: boolean }) {
  land()
  const main = document.querySelector('main')
  if (!main) return Promise.resolve()
  const corner = (x: number, y: number) => {
    const dx = x - from.x
    return Math.hypot(dx * (dx * way < 0 ? TILE_AHEAD : TILE_BEHIND), y - from.y)
  }
  const farthest = tiles
    ? Math.max(corner(0, 0), corner(innerWidth, 0), corner(0, innerHeight), corner(innerWidth, innerHeight))
    : innerHeight * REACH
  const dx = way * ARRIVE * innerWidth
  const dy = way ? 0 : LIFT
  const names: string[] = []

  arriving = blocksOf(main).flatMap((el) => {
    const far = Math.min((tiles ? frontDistance(el, from, way) : distanceTo(el, from, true)) / farthest, 1)
    const delay = tiles ? TILE_RUN * TILE_FRONT * far : AFTER + WAIT * far
    if (el.hasAttribute('data-arrives-itself')) {
      replay(el, delay)
      return []
    }
    for (const animation of el.getAnimations({ subtree: true })) {
      if (animation instanceof CSSAnimation && ENTRANCES.has(animation.animationName)) animation.finish()
    }
    // Its words and plates are layers of their own: they come in on the same beat (main.css).
    for (const named of el.querySelectorAll<HTMLElement>('[style*="view-transition-name"]')) {
      const name = getComputedStyle(named).viewTransitionName
      if (name && name !== 'none') names.push(`::view-transition-new(${name}){--arrive-delay:${Math.round(delay * 1000)}ms}`)
    }
    const p = motionValue(0)
    const place = (now: number) => {
      el.style.transform = now < 1 ? `translate(${(1 - now) * dx}px, ${(1 - now) * dy}px)` : ''
      el.style.opacity = now < 1 ? String(Math.min(now * 1.6, 1)) : ''
    }
    p.on('change', place)
    // Out of sight from the start, not only once its delay is up: a value
    // already at 0 doesn't change, so the listener alone wouldn't place it.
    place(0)
    return [{ el, controls: animate(p, 1, { type: 'spring', bounce: 0, visualDuration: LAND + 0.15 * far, delay }) }]
  })

  if (wordDelays) {
    wordDelays.textContent = names.join('')
    if (!wordDelays.isConnected) document.head.append(wordDelays)
  }

  const landing = arriving
  return Promise.all(landing.map(({ controls }) => controls)).then(() => {
    if (arriving !== landing) return
    arriving = []
    if (wordDelays) wordDelays.textContent = ''
  })
}
