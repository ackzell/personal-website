import { animate, attachSpring, motionValue, type AnimationPlaybackControls, type MotionValue } from 'motion-v'
import { blocksOf, distanceTo, land, pressAt } from '~/utils/pageArrival'

/** Fast enough (px/s) toward a stop as it lets go, once it's past SLIP px, to go. */
const FLICK = 400
const SLIP = 20
/** How far it moves before it's clearly a swipe or a scroll, in px. */
const LOCK = 10
/** Presses this close to a screen edge belong to the browser's own back/forward. */
const EDGE = 24
/** The page moves this much of the finger's way while there's a stop to go to. */
const FOLLOW = 0.5
/** At either end it gives at most this far, in px. */
const GIVE = 32
/*
 * The page moves as its blocks, not as one slab: the ones by the finger keep
 * up with it (TIGHT, in s), the ones REACH of the screen away or more fall
 * behind it by LAG more and go SAG less far, so the page bends after the finger and comes straight
 * again once it holds still. Blocks are the page arrival's (utils/pageArrival).
 */
const TIGHT = 0.06
const REACH = 0.5
const LAG = 0.24
const SAG = 0.3
// Back into place, carrying their own speed, the nearest first; no overshoot.
const HOME = 0.28
/**
 * Swipe sideways on a touch screen to step through the flag band in order
 * (useNavStops): each section, then the pages under it, a project's parts
 * right after it. Finger to the left goes forward, to the right goes back, the
 * way a page turns. Stops at either end.
 *
 * The page follows the finger, at half its pace, so a swipe shows it's being
 * taken and can be taken back before letting go; at either end it strains
 * and gives. It goes block by block, the ones nearest the finger first. Let
 * go short, it springs back. Let go past a quarter of the screen, or flicked,
 * the page transition carries it on from where the finger left it
 * (--swipe-out, main.css), at about the finger's speed, and the next page
 * comes in after it from the other side, as every page change does
 * (usePageArrival), starting by the finger.
 * Under reduced motion the page stays put and the swipe just goes.
 *
 * A swipe that starts in something that scrolls sideways (the band's own
 * stops, a carousel) scrolls that instead, and one that starts in something
 * that takes sideways moves for itself (touch-action without pan-x: a media
 * strip scrubbed by finger, a sheet's grip) is left to it. Mostly-vertical
 * moves are scrolls; once a move is a swipe, the page doesn't scroll under it.
 * While a modal is up (a lightbox), its swipes are its own.
 */
export function useSwipeNav() {
  const route = useRoute()
  const router = useRouter()
  const localePath = useLocalePath()
  const nuxtApp = useNuxtApp()
  const { from } = useNavStops()
  const reducedMotion = usePreferredReducedMotion()
  const root = import.meta.client ? document.documentElement : undefined

  const at = (by: 1 | -1) => from(route.path, by)?.to

  /** How far the finger goes before letting go commits, in px. */
  const distance = () => Math.min(window.innerWidth / 4, 120)

  /** Whether something under the finger has the sideways moves to itself (its touch-action leaves out pan-x). */
  function claimsSideways(el: Element | null) {
    for (; el && el !== document.body; el = el.parentElement) {
      const { touchAction } = getComputedStyle(el)
      if (touchAction !== 'auto' && touchAction !== 'manipulation' && !/pan-(x|left|right)/.test(touchAction)) return true
    }
    return false
  }

  /*
   * Where the page is, sideways, in px (`place`), and its blocks on their way
   * there: following, settling back, or left for the page transition to take.
   * Written straight to each block, outside Vue.
   */
  let place = 0
  type Block = { v: MotionValue<number>; target: MotionValue<number>; share: number; lag: number; detach?: () => void; stop: () => void; settling?: AnimationPlaybackControls }
  let blocks = new Map<HTMLElement, Block>()

  /** Takes the blocks on screen to follow a finger at `y`, picking up any still on their way back. */
  function take(y: number) {
    land()
    const main = document.querySelector('main')
    if (!main) return
    const kept = new Map<HTMLElement, Block>()
    for (const el of blocksOf(main)) {
      const far = farFrom(el, y)
      let block = blocks.get(el)
      if (block) {
        block.settling?.stop()
        block.detach?.()
        blocks.delete(el)
      }
      else {
        const v = motionValue(0)
        block = { v, target: motionValue(0), share: 1, lag: 0, stop: v.on('change', (now) => { el.style.translate = now ? `${now}px 0` : '' }) }
      }
      block.share = 1 - SAG * far
      block.lag = TIGHT + LAG * far
      block.target.jump(place * block.share)
      block.detach = attachSpring(block.v, block.target, { bounce: 0, visualDuration: block.lag })
      kept.set(el, block)
    }
    release()
    blocks = kept
    // Nothing to scroll to off the side while the page is out of place.
    root!.dataset.swiping = ''
  }

  function moveTo(now: number) {
    place = now
    for (const block of blocks.values()) block.target.set(now * block.share)
  }

  /** Puts every block straight back in place at once. */
  function release() {
    for (const block of blocks.values()) {
      block.settling?.stop()
      block.detach?.()
      block.v.jump(0)
      block.stop()
    }
    blocks.clear()
    place = 0
    delete root!.dataset.swiping
  }

  /** How far, from 0 to 1, a block is from a finger at `y`: REACH of the screen or more is 1. */
  function farFrom(el: Element, y: number) {
    return Math.min(distanceTo(el, { x: 0, y }, true) / (window.innerHeight * REACH), 1)
  }

  /** Where the page sits for a finger `dx` along: half its pace, or giving at an end. */
  function placeFor(dx: number) {
    if (at(dx < 0 ? 1 : -1)) return dx * FOLLOW
    return Math.sign(dx) * GIVE * (1 - 1 / (Math.abs(dx) / (GIVE * 4) + 1))
  }

  let start: { x: number; y: number } | undefined
  /** The finger's last move, and its speed sideways then (px/s). */
  let last = { x: 0, time: 0, speed: 0 }
  /**
   * Once the move is clearly sideways; `follows` when the page moves with it,
   * `past` while it's far enough along that letting go would go.
   */
  let swipe: { follows: boolean; past: boolean } | undefined

  function settle() {
    const settling = blocks
    place = 0
    const back = [...settling.values()].map((block) => {
      block.detach?.()
      block.detach = undefined
      block.settling = animate(block.v, 0, { type: 'spring', bounce: 0, visualDuration: HOME + block.lag, velocity: block.v.getVelocity() })
      return block.settling
    })
    // Once they're all home, unless a new swipe took them up on the way.
    Promise.all(back).then(() => {
      if (blocks === settling) release()
    })
  }

  function reset() {
    if (swipe?.follows) settle()
    start = swipe = undefined
  }

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    reset()
    if (event.touches.length !== 1 || !touch) return
    if (touch.clientX < EDGE || touch.clientX > window.innerWidth - EDGE) return
    if (scrollsSideways(event.target as Element) || claimsSideways(event.target as Element)) return
    if (document.querySelector(':modal')) return
    start = { x: touch.clientX, y: touch.clientY }
    last = { x: touch.clientX, time: event.timeStamp, speed: 0 }
  }

  function onTouchMove(event: TouchEvent) {
    const touch = event.touches[0]
    if (!start || !touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    const elapsed = event.timeStamp - last.time
    if (elapsed > 0) last = { x: touch.clientX, time: event.timeStamp, speed: ((touch.clientX - last.x) / elapsed) * 1000 }
    if (!swipe) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < LOCK) return
      // Mostly vertical, or a selection being dragged out: not ours.
      if (Math.abs(dx) < Math.abs(dy) * 2 || !document.getSelection()?.isCollapsed) {
        start = undefined
        return
      }
      swipe = { follows: reducedMotion.value !== 'reduce', past: false }
      if (swipe.follows) take(touch.clientY)
    }
    // A swipe, not a scroll: the page holds still the other way.
    if (event.cancelable) event.preventDefault()
    if (swipe.follows) moveTo(placeFor(dx))
    feel(dx)
  }

  /*
   * The finger feels the point where letting go goes, as it gets there and
   * as it comes back short. At an end there's nowhere to go: getting as far
   * is a knock against it instead.
   */
  function feel(dx: number) {
    const past = Math.abs(dx) >= distance()
    if (!swipe || past === swipe.past) return
    swipe.past = past
    const goes = !!at(dx < 0 ? 1 : -1)
    if (past) haptic(goes ? 'detent' : 'edge')
    else if (goes) haptic('undo')
  }

  /*
   * A swipe that goes hands the page over to the view transition: the old
   * page's snapshot is taken with its blocks held where the finger left them,
   * then they go back into place before the new one's is taken, and the new
   * page comes in after it (usePageArrival).
   * Without a view transition it just goes back once the new page is in.
   */
  let handing: (() => void) | undefined

  nuxtApp.hook('page:view-transition:start', (transition) => {
    const cleanUp = handing
    if (!cleanUp) return
    handing = undefined
    transition.updateCallbackDone.finally(release)
    transition.finished.finally(cleanUp)
  })

  function go(to: string, way: 1 | -1, speed: number, { x, y }: { x: number; y: number }) {
    const cleanUp = () => {
      release()
      root!.style.removeProperty('--swipe-out')
      delete root!.dataset.swipe
    }
    // Only when the page followed: under reduced motion it never left its place.
    if (place) {
      // Held where they are for the snapshot.
      for (const block of blocks.values()) block.detach?.()
      // Off the way it was headed, at about the finger's pace: the rest of a
      // third of the screen, in no less than 160ms or more than 320.
      const rest = window.innerWidth / 3 - Math.abs(place)
      const time = Math.min(Math.max((rest / Math.max(speed, 1)) * 1000, 160), 320)
      root!.style.setProperty('--swipe-out', `${Math.round(time)}ms`)
      root!.dataset.swipe = way > 0 ? 'forward' : 'back'
      handing = cleanUp
    }
    // The next page comes in from the finger.
    pressAt({ x, y })
    router.push(localePath(to)).finally(() => {
      // No view transition took it (none in this browser, or the navigation
      // didn't happen): the page goes back into place.
      if (handing !== cleanUp) return
      handing = undefined
      cleanUp()
    })
  }

  function onTouchEnd(event: TouchEvent) {
    const touch = event.changedTouches[0]
    const held = swipe
    if (!start || !held || !touch) return reset()
    const dx = touch.clientX - start.x
    start = undefined
    const way = dx < 0 ? 1 : -1
    // Toward the stop it's headed for; a finger that paused before lifting isn't moving.
    const speed = event.timeStamp - last.time < 50 ? -last.speed * way : 0
    const next = at(way)
    const goes = next && (
      (Math.abs(dx) >= distance() && speed > -FLICK)
      || (Math.abs(dx) >= SLIP && speed > FLICK)
    )
    if (goes) go(next, way, speed, { x: touch.clientX, y: touch.clientY })
    else if (held.follows) settle()
    swipe = undefined
  }

  useEventListener(document, 'touchstart', onTouchStart, { passive: true })
  // Not passive: once a move is a swipe, it keeps the page from scrolling.
  useEventListener(document, 'touchmove', onTouchMove, { passive: false })
  useEventListener(document, 'touchend', onTouchEnd, { passive: true })
  useEventListener(document, 'touchcancel', reset, { passive: true })
}
