<script setup lang="ts" generic="T">
import { animate, useMotionValue, useMotionValueEvent, type AnimationPlaybackControls, type Transition } from 'motion-v'

/**
 * A sheet that rises from the foot of the screen with something lifted out
 * of the guide: a release tapped on a touch screen, or a row's list on a
 * phone. `item` is what it holds, or null while it's down; the slots draw
 * it, `head` at the top, where a finger takes hold, and the rest below.
 *
 * Dragged down by its top it follows the finger as the dark lifts, and let
 * go far or fast enough it drops away; otherwise it settles back. Below the
 * top a finger pulls it the same way once what's in it is scrolled to the
 * start, as a native sheet does. Escape,
 * the close button or a tap above it close it too. It's a modal <dialog>,
 * so focus stays inside and goes back to whatever opened it. `tall` holds it
 * at nearly the screen's height, so a list that narrows doesn't make it jump.
 *
 * `dock` makes it a panel at the side on a wide screen instead: it slides in
 * from the right over the page's edge, between the header and the footer,
 * with nothing darkened, so the guide stays in use beside it (holding still)
 * and another pick takes its place. It carries its own copy of the mark, so
 * the stage reads on under it.
 * Escape, the close button or a click anywhere else put it away; it isn't
 * dragged.
 */
const props = defineProps<{ label?: string, tall?: boolean, dock?: boolean }>()
const item = defineModel<T | null>('item', { required: true })
defineSlots<{
  head: (props: { item: T }) => unknown
  default: (props: { item: T }) => unknown
}>()

const { t } = useI18n()
const reducedMotion = usePreferredReducedMotion()
// Wide enough for the guide and a panel beside it.
const wide = useMediaQuery('(width >= 64rem)')
// Docked at the side, this time it's up; chosen as it opens.
const docked = ref(false)

// Springs, so a sheet let go mid-flight keeps the finger's speed, and any
// move can be taken over by the next one (a grab, another pick).
const RISE: Transition = { type: 'spring', bounce: 0.12, visualDuration: 0.45 }
const SETTLE: Transition = { type: 'spring', bounce: 0.2, visualDuration: 0.35 }
const DROP: Transition = { type: 'spring', bounce: 0, visualDuration: 0.28 }
const SLIDE_OUT: Transition = { duration: 0.26, ease: 'easeIn' }
// Far enough (px), or fast enough (px/s), to let it go.
const AWAY_PX = 110
const FLICK = 500

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const panel = useTemplateRef<HTMLElement>('panel')
const edge = useTemplateRef<HTMLElement>('edge')

// The one on screen. It lags `item` on the way out, so it can drop away
// with its contents.
const showing = shallowRef<{ item: T } | null>(null)
// How far down the sheet is, in px: dragged, rising or dropping. Written
// straight to the page each frame, outside Vue.
const y = useMotionValue(0)
// Its height as it went up; the dark lifts as `y` covers it.
let span = 320
const holding = ref(false)
let moving: AnimationPlaybackControls | undefined

const motion = (transition: Transition) => reducedMotion.value === 'reduce' ? { duration: 0 } : transition

useMotionValueEvent(y, 'change', (now) => {
  if (panel.value) panel.value.style.translate = now ? `0 ${now}px` : ''
  dialog.value?.style.setProperty('--lift', String(Math.min(1, Math.max(0, now) / span)))
})

function slide(to: number, transition: Transition, velocity = y.getVelocity()) {
  moving?.stop()
  moving = animate(y, to, { ...motion(transition), velocity })
  return moving
}

// Docked, the panel's hairline draws out from its middle once it's in, and
// draws back in before it goes. `sliding` is the panel's last move, so a
// line held for a slide in that was cut short isn't drawn.
const EDGE_IN: Transition = { type: 'spring', bounce: 0, visualDuration: 0.4 }
const EDGE_OUT: Transition = { duration: 0.16, ease: 'easeIn' }
let sliding: AnimationPlaybackControls | undefined
let drawing: AnimationPlaybackControls | undefined
let leaving = false

function rise() {
  if (docked.value) {
    // By its edge, not a transform: a transformed panel would carry the
    // mark's copy along with it (SiteMarkLayer).
    const el = dialog.value!
    // From off screen, or from wherever it was caught on its way out.
    const back = leaving
    const run = sliding = animate(el, { right: back ? 0 : [-el.offsetWidth, 0] }, motion(DROP))
    leaving = false
    run.then(() => {
      if (run === sliding && edge.value) drawing = animate(edge.value, { scaleY: back ? 1 : [0, 1] }, motion(EDGE_IN))
    })
    return
  }
  span = panel.value?.offsetHeight || span
  y.jump(span)
  slide(0, RISE, 0)
}

// It drops from wherever the finger left it, as fast as it was thrown.
async function drop() {
  const el = dialog.value
  if (!el?.open) return
  sound('close')
  if (docked.value) {
    leaving = true
    drawing?.stop()
    sliding?.stop()
    const run = sliding = edge.value ? animate(edge.value, { scaleY: 0 }, motion(EDGE_OUT)) : undefined
    await run
    // Another pick brought it back while the line drew in.
    if (run !== sliding) return
    const out = sliding = animate(el, { right: -el.offsetWidth }, motion(SLIDE_OUT))
    await out
    if (out !== sliding) return
    leaving = false
    el.close()
    el.style.right = ''
    // A swap it cut short leaves nothing half faded for the next time.
    turn++
    if (panel.value) Object.assign(panel.value.style, { opacity: '', transform: '' })
    showing.value = null
    return
  }
  span = panel.value?.offsetHeight || span
  const run = slide(span, DROP)
  await run
  // Something else took it over on the way down (another pick).
  if (run !== moving) return
  el.close()
  y.jump(0)
  showing.value = null
}

watch(item, async (now) => {
  const el = dialog.value
  if (!el || !import.meta.client) return
  if (now === null) {
    drop()
    return
  }
  if (el.open && docked.value) {
    swap(now)
    // Caught on its way out, it comes back with the new pick.
    if (leaving) {
      sound('open')
      rise()
    } else {
      sound('step')
    }
    return
  }
  showing.value = { item: now }
  sound('open')
  if (el.open) {
    // Caught on its way down, the sheet comes back up from there.
    panel.value?.scrollTo(0, 0)
    if (y.get() > 0) slide(0, SETTLE)
    return
  }
  panel.value?.scrollTo(0, 0)
  docked.value = !!props.dock && wide.value
  if (docked.value) el.show()
  else el.showModal()
  await nextTick()
  rise()
})

// Docked, the next pick takes the last one's place where it stands: the
// panel stays, and only what's in it turns over, the old fading off and the
// new drifting in from its top. Picks in quick succession cut in on each
// other, and only the last one comes in.
const SWAP_OUT: Transition = { duration: 0.12, ease: 'easeIn' }
const SWAP_IN: Transition = { type: 'spring', bounce: 0, visualDuration: 0.3 }
let turn = 0
async function swap(next: T) {
  const box = panel.value
  if (!box) return
  const mine = ++turn
  await animate(box, { opacity: 0, x: -8 }, motion(SWAP_OUT))
  if (mine !== turn || !dialog.value?.open) return
  showing.value = { item: next }
  await nextTick()
  box.scrollTo(0, 0)
  animate(box, { opacity: [0, 1], x: [12, 0] }, motion(SWAP_IN))
}

// A panel that isn't modal gets no cancel from Escape; it's listened for.
useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape' && docked.value && item.value !== null) item.value = null
})

// Nor a click outside it; that's listened for too. What was clicked has its
// say first: if it put another release up, that one takes this one's place,
// and only a click that changed nothing puts the panel away. What the panel
// held is noted on the click's way down, and looked at again once it has
// come back up, by when what was clicked has run and Vue has caught up.
let before: T | null = null
useEventListener('click', (event: MouseEvent) => {
  before = docked.value && event.button === 0 && !dialog.value?.contains(event.target as Node) ? item.value : null
}, { capture: true })
useEventListener('click', () => {
  if (before !== null && docked.value && item.value === before) item.value = null
  before = null
})

// Escape goes the same way down as the close button.
function cancel(event: Event) {
  event.preventDefault()
  item.value = null
}

// The dark above the sheet is the dialog itself.
function tapAbove(event: MouseEvent) {
  if (event.target === dialog.value) item.value = null
}

// What's pressed in the head (the close button, a field) is used, not dragged.
function grab(event: PointerEvent) {
  if (docked.value || event.button !== 0 || (event.target as HTMLElement).closest('button, a, input, [role="group"]')) return
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  hold(event.clientY)
}

// A finger catches the sheet wherever it is, mid-rise or mid-drop.
let start = 0
// Whether it's pulled far enough down to go away when let go: the finger
// feels it get there, and come back short.
let past = false
function hold(from: number) {
  moving?.stop()
  holding.value = true
  start = from - y.get()
  past = y.get() > AWAY_PX
}

// Down it follows the finger; up it gives a little and no more.
function pull(event: PointerEvent) {
  if (holding.value) follow(event.clientY)
}

function follow(finger: number) {
  const dy = finger - start
  y.set(dy > 0 ? dy : dy / 6)
  if (dy > AWAY_PX === past) return
  past = !past
  haptic(past ? 'detent' : 'undo')
}

function letGo() {
  if (holding.value) settle()
}

// The motion value knows how fast it was moving when the finger lifted (and
// that it wasn't, if the finger rested first). A flick up sends it home.
function settle() {
  holding.value = false
  const speed = y.getVelocity()
  if (speed > -FLICK && (y.get() > AWAY_PX || speed > FLICK)) {
    item.value = null
    return
  }
  slide(0, SETTLE, speed)
}

// Below the top it's touch events, not pointer ones: the browser claims a
// scroll for itself, and only a touchmove can be turned down before it does.
// Down from a list at its start pulls the sheet; any other way, it scrolls.
let pulling: 'maybe' | 'yes' | 'no' = 'no'
let from = 0
function touchDown(event: TouchEvent) {
  const target = event.target as HTMLElement
  pulling = !docked.value && event.touches.length === 1 && !target.closest('.sheet__grab, input') && (panel.value?.scrollTop ?? 1) <= 0
    ? 'maybe'
    : 'no'
  from = event.touches[0]?.clientY ?? 0
}

function touchMove(event: TouchEvent) {
  const finger = event.touches[0]?.clientY
  if (pulling === 'no' || finger === undefined || !event.cancelable) return
  if (pulling === 'maybe') {
    if (finger < from) pulling = 'no'
    if (finger <= from) return
    pulling = 'yes'
    hold(from)
  }
  event.preventDefault()
  follow(finger)
}

function touchUp() {
  if (pulling === 'yes' && holding.value) settle()
  pulling = 'no'
}

useEventListener(panel, 'touchmove', touchMove, { passive: false })
</script>

<template>
  <!-- Out of the page, so nothing in it (a block arriving) holds it under the
       header or moves the mark's copy. -->
  <Teleport to="#teleports">
    <dialog ref="dialog" class="sheet" :aria-label="label"
      :class="{ 'sheet--docked': docked }"
      @cancel="cancel" @click="tapAbove">
      <SiteMarkLayer v-if="docked" clipped />
      <span v-if="docked" ref="edge" class="sheet__edge" aria-hidden="true" />
      <div ref="panel" class="sheet__panel" :class="{ 'is-holding': holding, 'sheet__panel--tall': tall }" @touchstart.passive="touchDown"
        @touchend="touchUp" @touchcancel="touchUp">
        <template v-if="showing">
          <div class="sheet__grab" @pointerdown="grab" @pointermove="pull" @pointerup="letGo" @pointercancel="letGo">
            <span class="sheet__handle" aria-hidden="true" />
            <slot name="head" :item="showing.item" />
            <button type="button" class="sheet__close" :aria-label="t('projects.media.lightbox.close')"
              @click="item = null">
              <span class="i-iconoir-xmark" aria-hidden="true" />
            </button>
          </div>
          <slot :item="showing.item" />
        </template>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
/* The dialog is the dark over the page; the sheet sits at its foot. */
.sheet {
  position: fixed;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  max-inline-size: none;
  max-block-size: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: color-mix(in oklab, black calc(45% - var(--lift, 0) * 45%), transparent);
  color: inherit;
  overscroll-behavior: contain;
}

.sheet[open] {
  display: grid;
  align-items: end;
  justify-items: center;
}

.sheet::backdrop {
  background: transparent;
}

/* The page behind holds still while the sheet is up (not beside a docked
   one, which is browsed with it). */
:global(html:has(.sheet:modal)) {
  overflow: hidden;
}

.sheet__panel {
  box-sizing: border-box;
  display: grid;
  align-content: start;
  gap: var(--gap-group);
  inline-size: min(100%, 36rem);
  max-block-size: 92svh;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 var(--gap-group) max(var(--gap-block), env(safe-area-inset-bottom));
  background: var(--bg);
  /* The second shadow fills in below, for when a spring or a pull up lifts
     it past where it rests. */
  box-shadow:
    0 -1px 0 color-mix(in oklab, var(--fg) 12%, transparent),
    0 4rem 0 var(--bg);
}

.sheet__panel--tall {
  block-size: 92svh;
}

/* The top of the sheet is what a finger takes hold of. */
.sheet__grab {
  position: relative;
  display: grid;
  gap: 0.35rem;
  padding-block: var(--gap-group) 0;
  padding-inline-end: 2.5rem;
  touch-action: none;
  user-select: none;
  cursor: grab;
}

.is-holding .sheet__grab {
  cursor: grabbing;
}

.sheet__handle {
  justify-self: center;
  inline-size: 2.5rem;
  block-size: 4px;
  margin-block-end: var(--gap-tight);
  margin-inline-end: -2.5rem;
  background: color-mix(in oklab, var(--fg) 25%, transparent);
}

.sheet__close {
  all: unset;
  position: absolute;
  inset-block-start: calc(var(--gap-group) + 4px);
  inset-inline-end: -0.5rem;
  display: grid;
  place-items: center;
  inline-size: 2.75rem;
  block-size: 2.75rem;
  font-size: 1.25rem;
  cursor: pointer;
}

.sheet__close {
  transition: opacity 0.25s var(--ease-out);
}

.sheet__close:active {
  opacity: 0.55;
  transition-duration: 0s;
}

.sheet__close:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Docked: a column at the right, between the header and the footer, over
   nothing darkened. It isn't in the top layer, so it's lifted above the
   page. Like the header and footer it's the stage color with the mark's copy
   showing through, so the page seems to run on behind it; only a hairline
   marks its edge. */
.sheet--docked {
  inset: var(--header-height, 0px) 0 var(--footer-height, 0px) auto;
  z-index: 20;
  inline-size: min(30rem, 36vw);
  block-size: auto;
  background: var(--bg);
}

/* The hairline down its edge, drawn out from the middle (script). */
.sheet__edge {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 1px;
  background: color-mix(in oklab, var(--fg) 12%, transparent);
  transform: scaleY(0);
  pointer-events: none;
}

.sheet--docked[open] {
  display: block;
}

.sheet--docked .sheet__panel {
  inline-size: 100%;
  block-size: 100%;
  max-block-size: none;
  /* What it holds sits in the middle of the column, unless it's taller than
     the column; then it starts at the top and scrolls. */
  align-content: safe center;
  padding: 0 var(--gap-block) var(--gap-block);
  background: none;
  box-shadow: none;
}

.sheet--docked .sheet__grab {
  padding-block-start: var(--gap-block);
  touch-action: auto;
  user-select: text;
  cursor: auto;
}

.sheet--docked .sheet__handle {
  display: none;
}

.sheet--docked .sheet__close {
  inset-block-start: calc(var(--gap-block) - 0.75rem);
}
</style>
