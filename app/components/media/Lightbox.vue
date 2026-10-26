<script setup lang="ts">
/**
 * Stills or clips seen one at a time over the page (MediaStills and
 * MediaPalette open it). `index` is the one showing, or null while it's
 * closed.
 *
 * Arrows, the side buttons or a swipe step through them. The wheel, a pinch,
 * the zoom buttons or + and − zoom in and out; a double click or double tap
 * zooms to the spot and back. Zoomed in, a drag pans. 0 fits it to the
 * screen again, and Escape, the close button or a tap beside it closes the
 * lightbox. The side buttons fade once the pointer rests, and come back with
 * it. It's a modal <dialog>, so focus stays inside and goes back to whatever
 * opened it.
 *
 * A clip plays on its own, muted and looping, with a pause control in the
 * bar; under reduced motion it waits on its poster until asked.
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
}

const props = defineProps<{ items: LightboxItem[] }>()
const index = defineModel<number | null>('index', { required: true })

const { t } = useI18n()
const reducedMotion = usePreferredReducedMotion()

const MIN = 1
const MAX = 4
const STEP = 1.5
const DOUBLE_TAP_MS = 300
const SWIPE_PX = 60
const IDLE_MS = 2000

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const view = useTemplateRef<HTMLElement>('view')
const media = useTemplateRef<HTMLImageElement | HTMLVideoElement>('media')

const scale = ref(1)
const x = ref(0)
const y = ref(0)
// While a finger or the mouse holds it, it follows without easing.
const holding = ref(false)
const playing = ref(false)

const current = computed(() => (index.value === null ? undefined : props.items[index.value]))
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
  if (index.value === null) return
  const total = props.items.length
  index.value = (index.value + step + total) % total
}

function togglePlay() {
  const clip = media.value
  if (!(clip instanceof HTMLVideoElement)) return
  if (clip.paused) clip.play().catch(() => {})
  else clip.pause()
}

watch(index, (now, before) => {
  fit()
  playing.value = false
  const el = dialog.value
  if (!el) return
  if (now !== null && before === null) el.showModal()
  if (now === null && el.open) el.close()
  if (now === null || !import.meta.client) return
  wake()
  // The neighbours' stills load while this one is looked at.
  for (const step of [1, -1]) {
    const next = props.items[(now + step + props.items.length) % props.items.length]
    if (next) new Image().src = next.poster ?? next.src
  }
})

onBeforeUnmount(() => clearTimeout(idleTimer))

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
    pinch = { distance: spread(), scale: scale.value }
    press = undefined
  }
  else {
    // Captured, every later event targets the view: note now what was pressed.
    press = { x: event.clientX, y: event.clientY, panX: x.value, panY: y.value, moved: false, beside: event.target === view.value }
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
  if (zoomed.value) {
    x.value = press.panX + dx
    y.value = press.panY + dy
    clampPan()
  }
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
  if (start.moved) {
    // Not zoomed, a sideways drag is a swipe to the next or previous one.
    if (!zoomed.value && Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1)
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
  <dialog ref="dialog" class="lightbox" :class="{ 'is-idle': idle }" :aria-label="current?.alt" @close="onClose"
    @keydown="onKeydown" @pointermove="wake" @pointerdown="wake">
    <div ref="view" class="lightbox__view" :class="{ 'is-zoomed': zoomed, 'is-holding': holding }"
      @wheel.prevent="onWheel" @pointerdown="onPointerdown" @pointermove="onPointermove" @pointerup="onPointerup"
      @pointercancel="onPointerup">
      <Transition name="lightbox-swap" mode="out-in">
        <video v-if="current && isClip" ref="media" :key="current.src" class="lightbox__media" :poster="current.poster"
          :width="current.width" :height="current.height" :aria-label="current.alt"
          :autoplay="reducedMotion !== 'reduce'" muted loop playsinline draggable="false"
          :style="{ '--ratio': ratio, 'translate': `${x}px ${y}px`, scale }" @play="playing = true"
          @pause="playing = false">
          <source v-if="current.webm" :src="current.webm" type="video/webm">
          <source :src="current.src" type="video/mp4">
        </video>
        <img v-else-if="current" ref="media" :key="current.src" class="lightbox__media" :src="current.src"
          :alt="current.alt" :width="current.width" :height="current.height" draggable="false"
          :style="{ '--ratio': ratio, 'translate': `${x}px ${y}px`, scale }">
      </Transition>
    </div>

    <div class="lightbox__bar">
      <span class="lightbox__count" aria-live="polite">
        {{ t('projects.media.lightbox.counter', { index: (index ?? 0) + 1, total: items.length }) }}
      </span>
      <div class="lightbox__controls">
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
   on black, the way the app's own window sits on a desktop. */
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
  background: rgb(0 0 0 / 0.92);
  color: rgb(255 255 255 / 0.9);
  overflow: hidden;
  opacity: 0;
  transition:
    opacity 200ms var(--ease-out),
    overlay 200ms allow-discrete,
    display 200ms allow-discrete;
}

.lightbox[open] {
  opacity: 1;
}

@starting-style {
  .lightbox[open] {
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

/* As large as fits between the side buttons and above the bar, at its own
   proportions (--ratio), so a clip holds its size before it loads. The shadow
   follows the capture's own rounded, transparent corners. */
.lightbox__media {
  inline-size: min(
    calc(100vw - 2 * var(--lightbox-gutter)),
    calc((100dvh - var(--lightbox-bar) - var(--space-6)) * var(--ratio))
  );
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
  transition: background-color 150ms var(--ease-out), opacity 400ms var(--ease-out);
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

/* One hands over to the next: out quickly, in a touch slower. */
.lightbox-swap-enter-active {
  transition: opacity 180ms var(--ease-out);
}

.lightbox-swap-leave-active {
  transition: opacity 100ms var(--ease-out);
}

.lightbox-swap-enter-from,
.lightbox-swap-leave-to {
  opacity: 0;
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

@media (prefers-reduced-motion: reduce) {
  .lightbox,
  .lightbox__media,
  .lightbox__step,
  .lightbox-swap-enter-active,
  .lightbox-swap-leave-active {
    transition: none;
  }
}
</style>
