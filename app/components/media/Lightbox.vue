<script setup lang="ts">
/**
 * Stills or clips seen one at a time over the page (MediaStills and
 * MediaPalette open it). `index` is the one showing, or null while it's
 * closed.
 *
 * Arrows, the side buttons or a swipe step through them; the picture follows
 * the swipe and is thrown on, or settles back if it wasn't far or fast
 * enough. Dragged up or down, it shrinks as the dark lifts, and let go far
 * or fast enough it goes back to the page from there. The wheel, a pinch,
 * the zoom buttons or + and − zoom in and out; a double click or double tap
 * zooms to the spot and back. Zoomed in, a drag pans. 0 fits it to the
 * screen again, and Escape, the close button or a tap beside it closes the
 * lightbox. The side buttons fade once the pointer rests, and come back with
 * it. It's a modal <dialog>, so focus stays inside and goes back to whatever
 * opened it.
 *
 * A clip plays on its own, muted and looping, with a pause control in the
 * bar; under reduced motion it waits on its poster until asked.
 *
 * Given `from`, where each one sits on the page, it opens out of that spot
 * and goes back into it on the way out, and the spot stands empty meanwhile.
 * A step wipes the next one in from the side it came from, behind a line of
 * light, over the last one sinking back, the way MediaPalette swaps clips.
 *
 * On wider screens the bar holds a strip of them all, small, to jump to any
 * one; a line of light under the strip travels to the one showing. Zoomed
 * in, the bar reads out how far.
 */
export interface LightboxItem {
  /** The still, or the clip's mp4. */
  src: string
  alt: string
  width: number | string
  height: number | string
  /** A clip: its poster, and a webm beside the mp4. */
  poster?: string
  webm?: string
  /** A small one for the strip; the poster or the still otherwise. */
  thumb?: string
}

const props = defineProps<{
  items: LightboxItem[]
  /** Where the one at `i` sits on the page. */
  from?: (i: number) => HTMLElement | null | undefined
}>()
const index = defineModel<number | null>('index', { required: true })

const { t } = useI18n()
const reducedMotion = usePreferredReducedMotion()

const MIN = 1
const MAX = 4
const STEP = 1.5
const DOUBLE_TAP_MS = 300
const SWIPE_PX = 60
// Far enough, or fast enough (px/ms), to let it go.
const AWAY_PX = 120
const FLICK = 0.5
const IDLE_MS = 2000
const FLIGHT_MS = 420
const FADE_MS = 300
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const view = useTemplateRef<HTMLElement>('view')
const media = useTemplateRef<HTMLImageElement | HTMLVideoElement>('media')

const scale = ref(1)
const x = ref(0)
const y = ref(0)
// While a finger or the mouse holds it, it follows without easing.
const holding = ref(false)
const playing = ref(false)
// How far it's been dragged away, 0 to 1: the dark lifts with it.
const dragged = ref(0)

// The one on screen. It lags `index` on the way out, so it can fly back.
const showing = ref<number | null>(null)
const closing = ref(false)
// A step, not the opening: only a step wipes. `forward` is the way it went,
// and `switches` counts steps, so each one draws its own line.
const stepping = ref(false)
const forward = ref(true)
const switches = ref(0)

const current = computed(() => (showing.value === null ? undefined : props.items[showing.value]))
const isClip = computed(() => current.value?.poster !== undefined)
const zoomed = computed(() => scale.value > MIN)
const ratio = computed(() => (current.value ? Number(current.value.width) / Number(current.value.height) : 1))

// The side buttons rest out of sight until the pointer or a key moves again.
const idle = ref(false)
let idleTimer: ReturnType<typeof setTimeout> | undefined

function wake() {
  idle.value = false
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => (idle.value = true), IDLE_MS)
}

function fit() {
  scale.value = MIN
  x.value = 0
  y.value = 0
}

// Zoomed in, it may move until its edge meets the screen's, no further.
function clampPan() {
  const shown = media.value
  const area = view.value
  if (!shown || !area) return
  const reachX = Math.max(0, (shown.offsetWidth * scale.value - area.clientWidth) / 2)
  const reachY = Math.max(0, (shown.offsetHeight * scale.value - area.clientHeight) / 2)
  x.value = Math.min(reachX, Math.max(-reachX, x.value))
  y.value = Math.min(reachY, Math.max(-reachY, y.value))
}

/** Zooms to `next`, keeping the point at client (cx, cy) where it is. */
function zoomTo(next: number, cx?: number, cy?: number) {
  const area = view.value?.getBoundingClientRect()
  if (!area) return
  const target = Math.min(MAX, Math.max(MIN, next))
  const midX = area.left + area.width / 2
  const midY = area.top + area.height / 2
  // The point, from the middle of the view.
  const px = (cx ?? midX) - midX
  const py = (cy ?? midY) - midY
  const by = target / scale.value
  x.value = px - (px - x.value) * by
  y.value = py - (py - y.value) * by
  scale.value = target
  if (target === MIN) fit()
  else clampPan()
}

function go(step: number) {
  if (index.value === null || closing.value) return
  forward.value = step > 0
  stepping.value = true
  switches.value++
  const total = props.items.length
  index.value = (index.value + step + total) % total
}

/** Jumps to the one at `i`, from the strip. */
function jump(i: number) {
  if (index.value === null || closing.value || i === index.value) return
  forward.value = i > index.value
  stepping.value = true
  switches.value++
  index.value = i
}

// The strip's line is placed under the one showing, and travels from there.
// It's placed before it can travel: the first placement lands without moving.
const strip = useTemplateRef<HTMLElement>('strip')
const thumbs = useTemplateRef<HTMLButtonElement[]>('thumbs')
const line = ref<Record<string, string>>()
const lined = ref(false)

function placeLine() {
  const thumb = showing.value === null ? undefined : thumbs.value?.[showing.value]
  const row = strip.value
  if (!thumb || !row) return
  line.value = { '--line-x': `${thumb.offsetLeft}px`, '--line-w': `${thumb.offsetWidth}px` }
  row.scrollTo({ left: thumb.offsetLeft - (row.clientWidth - thumb.offsetWidth) / 2, behavior: lined.value ? 'smooth' : 'instant' })
  if (!lined.value) requestAnimationFrame(() => (lined.value = true))
}

watch(showing, (now) => {
  if (now === null) lined.value = false
  else placeLine()
}, { flush: 'post' })

function togglePlay() {
  const clip = media.value
  if (!(clip instanceof HTMLVideoElement)) return
  if (clip.paused) clip.play().catch(() => {})
  else clip.pause()
}

// Its spot on the page stands empty while it's up here.
let emptied: HTMLElement | undefined

function empty(i: number | null) {
  if (emptied) emptied.style.visibility = ''
  emptied = i === null ? undefined : props.from?.(i) ?? undefined
  if (emptied) emptied.style.visibility = 'hidden'
}

/** The transform that puts a box at `fitted` where `to` is. */
function pose(to: DOMRect, fitted: DOMRect) {
  const dx = to.left + to.width / 2 - fitted.left - fitted.width / 2
  const dy = to.top + to.height / 2 - fitted.top - fitted.height / 2
  return { transform: `translate(${dx}px, ${dy}px) scale(${to.width / fitted.width})` }
}

/**
 * Flies the one showing between its spot on the page and its place here, if
 * the spot is on screen; on the way out, from `held`, wherever it was let go.
 * With no spot to go to, it fades from there instead. Resolves when it
 * lands; undefined if there's nothing to animate.
 */
function fly(i: number, way: 'in' | 'out', held?: DOMRect) {
  const shown = media.value
  if (!shown || reducedMotion.value === 'reduce') return
  const fitted = shown.getBoundingClientRect()
  const here = held ? pose(held, fitted) : { transform: 'none' }
  const a = props.from?.(i)?.getBoundingClientRect()
  const onScreen = a && a.width && a.bottom > 0 && a.top < window.innerHeight
  if (!onScreen) {
    if (way === 'in' || !held) return
    return shown.animate([here, { ...here, opacity: 0 }], { duration: FADE_MS, easing: EASE_OUT, fill: 'forwards' }).finished
  }
  const away = pose(a, fitted)
  const frames = way === 'in' ? [away, here] : [here, away]
  return shown.animate(frames, { duration: FLIGHT_MS, easing: EASE_OUT, fill: way === 'out' ? 'forwards' : 'none' }).finished
}

async function closeOut(i: number) {
  const el = dialog.value
  if (!el) return
  closing.value = true
  // It leaves from where it is, zoomed or dragged: noted, set back to fit at
  // once, and flown from there.
  const held = media.value?.getBoundingClientRect()
  holding.value = true
  fit()
  await nextTick()
  holding.value = false
  dragged.value = 0
  // Whoever opened it may have moved on to this one meanwhile (MediaPalette).
  empty(i)
  await (fly(i, 'out', held) ?? new Promise((done) => setTimeout(done, reducedMotion.value === 'reduce' ? 0 : FADE_MS)))
  el.close()
  empty(null)
  showing.value = null
  closing.value = false
}

watch(index, async (now, before) => {
  fit()
  playing.value = false
  const el = dialog.value
  if (!el || !import.meta.client) return
  if (now === null) {
    if (showing.value !== null) closeOut(showing.value)
    return
  }
  showing.value = now
  empty(now)
  if (before === null) {
    stepping.value = false
    el.showModal()
    await nextTick()
    fly(now, 'in')
  }
  wake()
  // The neighbours' stills load while this one is looked at.
  for (const step of [1, -1]) {
    const next = props.items[(now + step + props.items.length) % props.items.length]
    if (next) new Image().src = next.poster ?? next.src
  }
})

onBeforeUnmount(() => {
  clearTimeout(idleTimer)
  empty(null)
})

const KEYS: Record<string, () => void> = {
  'ArrowRight': () => go(1),
  'ArrowLeft': () => go(-1),
  '+': () => zoomTo(scale.value * STEP),
  '=': () => zoomTo(scale.value * STEP),
  '-': () => zoomTo(scale.value / STEP),
  '0': fit,
}

function onKeydown(event: KeyboardEvent) {
  wake()
  const action = KEYS[event.key]
  if (!action || event.metaKey || event.ctrlKey) return
  event.preventDefault()
  action()
}

function onWheel(event: WheelEvent) {
  zoomTo(scale.value * Math.exp(-event.deltaY * 0.002), event.clientX, event.clientY)
}

// Pointers on the view: one pans (zoomed) or swipes (not), two pinch.
const pointers = new Map<number, { x: number, y: number }>()
let pinch: { distance: number, scale: number } | undefined
let press: { x: number, y: number, panX: number, panY: number, moved: boolean, beside: boolean } | undefined
// Not zoomed, a drag takes the picture with it: sideways to step, up or down
// to put it away. The way is settled by its first few pixels.
let drag: 'side' | 'away' | undefined
// The pointer's speed in px/ms, from its last move.
let speed = { x: 0, y: 0 }
let lastMove: { x: number, y: number, at: number } | undefined
let lastTap: { at: number, x: number, y: number } | undefined

const spread = () => {
  const [a, b] = [...pointers.values()]
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
}

function onPointerdown(event: PointerEvent) {
  view.value?.setPointerCapture(event.pointerId)
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  holding.value = true
  if (pointers.size === 2) {
    // A second finger turns a drag into a pinch, from where it rests.
    if (drag) fit()
    drag = undefined
    dragged.value = 0
    pinch = { distance: spread(), scale: scale.value }
    press = undefined
  }
  else {
    // Captured, every later event targets the view: note now what was pressed.
    press = { x: event.clientX, y: event.clientY, panX: x.value, panY: y.value, moved: false, beside: event.target === view.value }
    drag = undefined
    speed = { x: 0, y: 0 }
    lastMove = { x: event.clientX, y: event.clientY, at: event.timeStamp }
  }
}

function onPointermove(event: PointerEvent) {
  if (!pointers.has(event.pointerId)) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    zoomTo(pinch.scale * (spread() / pinch.distance), (a!.x + b!.x) / 2, (a!.y + b!.y) / 2)
    return
  }
  if (!press) return
  const dx = event.clientX - press.x
  const dy = event.clientY - press.y
  if (Math.hypot(dx, dy) > 6) press.moved = true
  if (lastMove && event.timeStamp > lastMove.at) {
    const dt = event.timeStamp - lastMove.at
    speed = { x: (event.clientX - lastMove.x) / dt, y: (event.clientY - lastMove.y) / dt }
  }
  lastMove = { x: event.clientX, y: event.clientY, at: event.timeStamp }
  if (zoomed.value) {
    x.value = press.panX + dx
    y.value = press.panY + dy
    clampPan()
    return
  }
  if (!press.moved || press.beside) return
  drag ??= Math.abs(dy) > Math.abs(dx) ? 'away' : 'side'
  if (drag === 'side') {
    x.value = dx
    return
  }
  // Away: it trails the pointer, and shrinks as the dark lifts.
  const far = Math.min(1, Math.abs(dy) / (window.innerHeight * 0.4))
  x.value = dx * 0.5
  y.value = dy
  scale.value = 1 - far * 0.25
  dragged.value = far
}

function onPointerup(event: PointerEvent) {
  pointers.delete(event.pointerId)
  if (pointers.size) return
  holding.value = false
  const wasPinch = pinch !== undefined
  pinch = undefined
  const start = press
  press = undefined
  if (wasPinch || !start || event.type === 'pointercancel') return

  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  if (start.moved) {
    const way = drag
    drag = undefined
    // A flick that stopped before it was let go isn't a flick.
    if (lastMove && event.timeStamp - lastMove.at > 100) speed = { x: 0, y: 0 }
    if (way === 'away' && (Math.abs(dy) > AWAY_PX || Math.abs(speed.y) > FLICK)) {
      index.value = null
      return
    }
    if (way === 'side' && (Math.abs(dx) > SWIPE_PX || Math.abs(speed.x) > FLICK)) {
      go(dx < 0 ? 1 : -1)
      return
    }
    // Not far or fast enough: it settles back.
    if (way) {
      fit()
      dragged.value = 0
    }
    return
  }

  // A tap: twice in a row zooms to the spot and back. Once beside it closes;
  // once on it waits for a second.
  const now = performance.now()
  if (lastTap && now - lastTap.at < DOUBLE_TAP_MS && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 30) {
    lastTap = undefined
    if (zoomed.value) fit()
    else zoomTo(2.5, event.clientX, event.clientY)
    return
  }
  lastTap = { at: now, x: event.clientX, y: event.clientY }
  if (start.beside && !zoomed.value) index.value = null
}

function onClose() {
  index.value = null
}
</script>

<template>
  <dialog ref="dialog" class="lightbox" :class="{ 'is-idle': idle, 'is-closing': closing, 'is-dragging': holding && dragged > 0 }"
    :style="{ '--dragged': dragged }" :aria-label="current?.alt"
    @close="onClose" @cancel.prevent="index = null" @keydown="onKeydown" @pointermove="wake" @pointerdown="wake">
    <div ref="view" class="lightbox__view" :class="{ 'is-zoomed': zoomed, 'is-holding': holding }"
      :data-dir="forward ? 'forward' : 'back'" @wheel.prevent="onWheel" @pointerdown="onPointerdown"
      @pointermove="onPointermove" @pointerup="onPointerup" @pointercancel="onPointerup">
      <Transition name="lightbox-step" :css="stepping">
        <div v-if="current" :key="current.src" class="lightbox__frame">
          <video v-if="isClip" ref="media" class="lightbox__media" :poster="current.poster" :width="current.width"
            :height="current.height" :aria-label="current.alt" :autoplay="reducedMotion !== 'reduce'" muted loop
            playsinline draggable="false" :style="{ '--ratio': ratio, 'translate': `${x}px ${y}px`, scale }"
            @play="playing = true" @pause="playing = false">
            <source v-if="current.webm" :src="current.webm" type="video/webm">
            <source :src="current.src" type="video/mp4">
          </video>
          <img v-else ref="media" class="lightbox__media" :src="current.src" :alt="current.alt" :width="current.width"
            :height="current.height" draggable="false" :style="{ '--ratio': ratio, 'translate': `${x}px ${y}px`, scale }">
        </div>
      </Transition>
      <span v-if="stepping && current" :key="switches" class="lightbox__scan" :style="{ '--ratio': ratio }"
        aria-hidden="true" />
    </div>

    <div class="lightbox__bar">
      <span class="lightbox__count" aria-live="polite">
        {{ t('projects.media.lightbox.counter', { index: (index ?? 0) + 1, total: items.length }) }}
      </span>
      <div v-if="items.length > 1" ref="strip" class="lightbox__strip">
        <button v-for="(item, i) in items" ref="thumbs" :key="item.src" type="button" class="lightbox__thumb"
          :aria-label="item.alt" :aria-current="i === showing || undefined" @click="jump(i)">
          <img :src="item.thumb ?? item.poster ?? item.src" alt="" :width="item.width" :height="item.height"
            loading="lazy" decoding="async" draggable="false">
        </button>
        <span v-if="line" class="lightbox__line" :class="{ 'is-placed': lined }" :style="line" aria-hidden="true" />
      </div>
      <div class="lightbox__controls">
        <span class="lightbox__zoom" :class="{ 'is-shown': zoomed }" aria-hidden="true">{{ scale.toFixed(1) }}×</span>
        <button v-if="isClip" type="button" class="lightbox__button"
          :aria-label="playing ? t('projects.media.pause') : t('projects.media.play')" @click="togglePlay">
          <span :class="playing ? 'i-iconoir-pause-solid' : 'i-iconoir-play-solid'" aria-hidden="true" />
        </button>
        <button type="button" class="lightbox__button" :aria-label="t('projects.media.lightbox.zoomOut')"
          :disabled="!zoomed" @click="zoomTo(scale / STEP)">
          <span class="i-iconoir-zoom-out" aria-hidden="true" />
        </button>
        <button type="button" class="lightbox__button" :aria-label="t('projects.media.lightbox.fit')"
          :disabled="!zoomed" @click="fit">
          <span class="i-iconoir-collapse" aria-hidden="true" />
        </button>
        <button type="button" class="lightbox__button" :aria-label="t('projects.media.lightbox.zoomIn')"
          :disabled="scale >= MAX" @click="zoomTo(scale * STEP)">
          <span class="i-iconoir-zoom-in" aria-hidden="true" />
        </button>
        <button type="button" class="lightbox__button" :aria-label="t('projects.media.lightbox.close')" autofocus
          @click="index = null">
          <span class="i-iconoir-xmark" aria-hidden="true" />
        </button>
      </div>
    </div>

    <button type="button" class="lightbox__button lightbox__step lightbox__step--back"
      :aria-label="t('projects.media.lightbox.previous')" @click="go(-1)">
      <span class="i-iconoir-nav-arrow-left" aria-hidden="true" />
    </button>
    <button type="button" class="lightbox__button lightbox__step lightbox__step--next"
      :aria-label="t('projects.media.lightbox.next')" @click="go(1)">
      <span class="i-iconoir-nav-arrow-right" aria-hidden="true" />
    </button>
  </dialog>
</template>

<style scoped>
/* The page sinks into the dark, whatever its scheme: a capture reads best
   on black, the way the app's own window sits on a desktop. The dark comes
   in under the one flying out of the page, and lifts as it flies back. */
.lightbox {
  --lightbox-bar: 3.5rem;
  --lightbox-gutter: var(--space-12);
  position: fixed;
  inset: 0;
  inline-size: 100vw;
  block-size: 100dvh;
  max-inline-size: none;
  max-block-size: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: rgb(0 0 0 / calc(0.92 * (1 - var(--dragged, 0))));
  color: rgb(255 255 255 / 0.9);
  overflow: hidden;
  transition: background-color 300ms var(--ease-out);
}

.lightbox__bar {
  transition: opacity 300ms var(--ease-out);
}

.lightbox.is-closing {
  background-color: transparent;
}

.is-closing :is(.lightbox__bar, .lightbox__step) {
  opacity: 0;
}

/* Dragged away, the bar and buttons lift with the dark, and follow the
   pointer without easing. */
.lightbox:not(.is-closing) :is(.lightbox__bar, .lightbox__step) {
  opacity: calc(1 - var(--dragged, 0));
}

.lightbox.is-dragging,
.is-dragging :is(.lightbox__bar, .lightbox__step) {
  transition: none;
}

@starting-style {
  .lightbox[open] {
    background-color: transparent;
  }

  .lightbox[open] :is(.lightbox__bar, .lightbox__step) {
    opacity: 0;
  }
}

.lightbox::backdrop {
  background: transparent;
}

/* The page behind holds still while the lightbox is up. */
:global(html:has(.lightbox[open])) {
  overflow: hidden;
}

.lightbox__view {
  position: absolute;
  inset: 0 0 var(--lightbox-bar);
  display: grid;
  place-items: center;
  overflow: hidden;
  touch-action: none;
  cursor: zoom-in;
}

.lightbox__view.is-zoomed {
  cursor: grab;
}

.lightbox__view.is-zoomed.is-holding {
  cursor: grabbing;
}

/* The one showing and the one stepped from share a cell, so they can hand
   over in place. */
.lightbox__frame,
.lightbox__scan {
  grid-area: 1 / 1;
}

.lightbox__frame {
  position: relative;
  z-index: 1;
}

.lightbox-step-leave-active {
  z-index: 0;
}

/* As large as fits between the side buttons and above the bar, at its own
   proportions (--ratio), so a clip holds its size before it loads. The shadow
   follows the capture's own rounded, transparent corners. */
.lightbox__media,
.lightbox__scan {
  inline-size: min(
    calc(100vw - 2 * var(--lightbox-gutter)),
    calc((100dvh - var(--lightbox-bar) - var(--space-6)) * var(--ratio))
  );
}

.lightbox__media {
  display: block;
  block-size: auto;
  filter: drop-shadow(0 1rem 2rem rgb(0 0 0 / 0.6));
  user-select: none;
  transition:
    translate 220ms var(--ease-out),
    scale 220ms var(--ease-out);
  will-change: translate, scale;
}

.is-holding .lightbox__media {
  transition: none;
}

.lightbox__bar {
  position: absolute;
  inset: auto 0 0;
  block-size: var(--lightbox-bar);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: var(--space-4);
  font-size: 0.875rem;
}

.lightbox__count {
  font-variant-numeric: tabular-nums;
}

/* The strip: each one small, at its own proportions, dimmed until it's the
   one showing or pointed at. It scrolls sideways if they don't all fit. */
.lightbox__strip {
  position: relative;
  display: none;
  gap: var(--space-2);
  align-items: center;
  max-inline-size: 60vw;
  block-size: 100%;
  padding-inline: var(--space-1);
  overflow-x: auto;
  scrollbar-width: none;
}

.lightbox__thumb {
  flex: none;
  padding: 0;
  border: 0;
  background: transparent;
  opacity: 0.45;
  cursor: pointer;
  transition: opacity 200ms var(--ease-out);
}

.lightbox__thumb img {
  display: block;
  inline-size: auto;
  block-size: 2rem;
}

.lightbox__thumb:hover,
.lightbox__thumb[aria-current] {
  opacity: 1;
}

.lightbox__thumb:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* The line under the one showing: the light the step's line is made of. */
.lightbox__line {
  --line-light: var(--deeper-paper);
  position: absolute;
  inset: auto auto var(--space-1) 0;
  inline-size: var(--line-w);
  block-size: 2px;
  translate: var(--line-x) 0;
  background: var(--line-light);
  box-shadow:
    0 0 4px color-mix(in oklab, var(--line-light) 70%, transparent),
    0 0 12px color-mix(in oklab, var(--line-light) 40%, transparent);
  pointer-events: none;
}

.lightbox__line.is-placed {
  transition:
    translate 300ms var(--ease-in-out),
    inline-size 300ms var(--ease-in-out);
}

/* How far it's zoomed, beside the buttons that change it. */
.lightbox__zoom {
  align-self: center;
  min-inline-size: 3.5ch;
  padding-inline-end: var(--space-2);
  font-variant-numeric: tabular-nums;
  text-align: end;
  opacity: 0;
  transition: opacity 200ms var(--ease-out);
}

.lightbox__zoom.is-shown {
  opacity: 0.7;
}

/* Wide enough, the strip stands in for the count, which stays for screen
   readers. */
@media (width >= 40rem) {
  .lightbox__strip {
    display: flex;
  }

  .lightbox__bar:has(.lightbox__strip) .lightbox__count {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}

.lightbox__controls {
  display: flex;
  gap: var(--space-1);
}

.lightbox__button {
  display: grid;
  place-items: center;
  inline-size: 2.75rem;
  block-size: 2.75rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background-color 150ms var(--ease-out), opacity 150ms var(--ease-out);
}

.lightbox__button:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.12);
}

.lightbox__button:disabled {
  opacity: 0.35;
  cursor: default;
}

.lightbox__button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.lightbox__step {
  position: absolute;
  inset-block-start: calc(50% - var(--lightbox-bar) / 2);
  translate: 0 -50%;
  font-size: 1.75rem;
  transition: background-color 150ms var(--ease-out), opacity 300ms var(--ease-out);
}

.lightbox__step--back {
  inset-inline-start: var(--space-1);
}

.lightbox__step--next {
  inset-inline-end: var(--space-1);
}

/* At rest, the side buttons leave the picture alone; one with keyboard
   focus stays. */
.is-idle .lightbox__step:not(:focus-visible) {
  opacity: 0;
}

@media (prefers-reduced-motion: no-preference) {
  /* A step: the next one wipes in from the side it came from, past its
     edges so its shadow comes with it, and the last one sinks back under
     it (MediaPalette's swap, sideways). */
  .lightbox-step-enter-active {
    animation: 450ms var(--ease-out) backwards lightbox-wipe;
  }

  [data-dir='forward'] .lightbox-step-enter-active {
    --wipe-from: inset(-3rem -3rem -3rem 100%);
  }

  [data-dir='back'] .lightbox-step-enter-active {
    --wipe-from: inset(-3rem 100% -3rem -3rem);
  }

  .lightbox-step-leave-active {
    animation: 450ms var(--ease-out) both lightbox-recede;
  }

  /* The line on the wipe's edge: a box the picture's size, pushed off by its
     own width and drawn back with the wipe, the line on its leading edge. */
  .lightbox__scan {
    position: relative;
    z-index: 2;
    aspect-ratio: var(--ratio);
    pointer-events: none;
    animation: 450ms var(--ease-out) both lightbox-scan;
  }

  .lightbox__scan::before {
    --scan-light: var(--deeper-paper);
    content: '';
    position: absolute;
    inset-block: 0;
    inline-size: 2px;
    background: var(--scan-light);
    box-shadow:
      0 0 4px color-mix(in oklab, var(--scan-light) 70%, transparent),
      0 0 12px color-mix(in oklab, var(--scan-light) 45%, transparent),
      0 0 32px color-mix(in oklab, var(--scan-light) 20%, transparent);
    mix-blend-mode: plus-lighter;
  }

  [data-dir='forward'] .lightbox__scan {
    --scan-from: 100% 0;
  }

  [data-dir='forward'] .lightbox__scan::before {
    inset-inline-start: 0;
  }

  [data-dir='back'] .lightbox__scan {
    --scan-from: -100% 0;
  }

  [data-dir='back'] .lightbox__scan::before {
    inset-inline-end: 0;
  }
}

@keyframes lightbox-wipe {
  from {
    clip-path: var(--wipe-from);
  }
  to {
    clip-path: inset(-3rem);
  }
}

@keyframes lightbox-recede {
  to {
    scale: 0.97;
    filter: brightness(0.5);
  }
}

@keyframes lightbox-scan {
  from {
    translate: var(--scan-from);
  }
  80% {
    opacity: 1;
  }
  to {
    translate: 0 0;
    opacity: 0;
  }
}

@keyframes lightbox-fade {
  from {
    opacity: 0;
  }
}

/* Phones: it takes the full width, and the side buttons sit over its
   edges, smaller, for anyone not swiping. */
@media (width < 40rem) {
  .lightbox {
    --lightbox-gutter: var(--space-2);
  }

  .lightbox__step {
    font-size: 1.25rem;
    background: rgb(0 0 0 / 0.45);
  }
}

/* Reduced motion: no flight and no line; a step still hands over, in
   place. */
@media (prefers-reduced-motion: reduce) {
  .lightbox,
  .lightbox__bar,
  .lightbox__media,
  .lightbox__step,
  .lightbox__line.is-placed {
    transition: none;
  }

  .lightbox-step-enter-active {
    animation: 200ms ease-out backwards lightbox-fade;
  }

  .lightbox-step-leave-active {
    animation: 200ms ease-out both reverse lightbox-fade;
  }

  .lightbox__scan {
    display: none;
  }
}
</style>
