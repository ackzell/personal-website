<script setup lang="ts">
/**
 * A name with more to say. Hovering it shows a tooltip that trails the
 * pointer, covering part of the way each frame; focusing it from the keyboard,
 * or tapping it, shows the tooltip under the name instead. Escape puts it
 * away, and the pointer can cross from the name into the tooltip.
 *
 * The tooltip lives in <body>, fixed, so nothing on the page clips it or
 * stacks over it. It stays in the DOM while hidden, as the name's description.
 *
 * `pointerOnly` is for a mark whose details are already said beside it: it
 * takes no keyboard stop or tap, stays out of the accessibility tree, and
 * covers its parent, padded out to a target worth aiming at.
 */
import type { VirtualElement } from '@floating-ui/dom'
import { computePosition, flip, offset, shift } from '@floating-ui/dom'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ pointerOnly?: boolean }>()

// Share of the remaining distance covered each frame.
const EASING = 0.28
// Time to cross from the name into the tooltip before it hides.
const GRACE = 150

const id = useId()
const trigger = useTemplateRef<HTMLElement>('trigger')
const tip = useTemplateRef<HTMLElement>('tip')

const shown = ref(false)
// Trailing the pointer, or anchored under the name (keyboard, touch).
const following = ref(false)
const position = reactive({ x: 0, y: 0 })
const pointer = { x: 0, y: 0 }
const target = { x: 0, y: 0 }

const reducedMotion = usePreferredReducedMotion()

let frame: number | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

async function place() {
  if (!tip.value || !trigger.value) return
  const reference: VirtualElement | HTMLElement = following.value
    ? { getBoundingClientRect: () => DOMRect.fromRect({ x: pointer.x, y: pointer.y, width: 0, height: 0 }) }
    : trigger.value
  const { x, y } = await computePosition(reference, tip.value, {
    strategy: 'fixed',
    placement: 'bottom-start',
    middleware: [offset(following.value ? 14 : 6), flip({ fallbackPlacements: ['top-start'] }), shift({ padding: 12 })],
  })
  target.x = x
  target.y = y
}

function step() {
  const ease = reducedMotion.value === 'reduce' ? 1 : EASING
  const dx = target.x - position.x
  const dy = target.y - position.y
  if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
    position.x = target.x
    position.y = target.y
    frame = undefined
    return
  }
  position.x += dx * ease
  position.y += dy * ease
  frame = requestAnimationFrame(step)
}

function glide() {
  frame ??= requestAnimationFrame(step)
}

function jump() {
  position.x = target.x
  position.y = target.y
}

async function show(follow: boolean) {
  clearTimeout(hideTimer)
  const moving = shown.value && following.value === follow
  following.value = follow
  shown.value = true
  await place()
  // It appears where it belongs, and only trails once it's out.
  if (moving) glide()
  else jump()
}

function hide() {
  clearTimeout(hideTimer)
  shown.value = false
}

function keep() {
  clearTimeout(hideTimer)
}

function hideSoon() {
  clearTimeout(hideTimer)
  hideTimer = setTimeout(hide, GRACE)
}

function track(event: PointerEvent) {
  pointer.x = event.clientX
  pointer.y = event.clientY
}

function enter(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  track(event)
  show(true)
}

function move(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || !following.value) return
  track(event)
  place().then(glide)
}

function leave(event: PointerEvent) {
  if (event.pointerType === 'mouse' && following.value) hideSoon()
}

// A mouse click also focuses the name: only keyboard focus anchors it.
function focus(event: FocusEvent) {
  if ((event.target as HTMLElement).matches(':focus-visible')) show(false)
}

function tap(event: MouseEvent) {
  const type = (event as PointerEvent).pointerType
  if (props.pointerOnly || (type !== 'touch' && type !== 'pen')) return
  if (shown.value) hide()
  else show(false)
}

// Scrolling carries the name away from a resting pointer; an anchored
// tooltip goes with its name.
useEventListener('scroll', () => {
  if (!shown.value) return
  if (following.value) hide()
  else place().then(jump)
}, { passive: true, capture: true })

onClickOutside(trigger, () => {
  if (shown.value && !following.value) hide()
}, { ignore: [tip] })

onBeforeUnmount(() => {
  clearTimeout(hideTimer)
  if (frame !== undefined) cancelAnimationFrame(frame)
})
</script>

<template>
  <component :is="pointerOnly ? 'span' : 'button'" ref="trigger" v-bind="$attrs"
    :type="pointerOnly ? undefined : 'button'" class="site-tooltip__name"
    :data-pointer-only="pointerOnly || undefined" :aria-describedby="pointerOnly ? undefined : id"
    @pointerenter="enter" @pointermove="move" @pointerleave="leave" @focus="focus" @blur="hide" @click="tap"
    @keydown.esc="hide">
    <slot />
  </component>

  <Teleport to="body">
    <span :id="id" ref="tip" role="tooltip" class="site-tooltip"
      :aria-hidden="pointerOnly || undefined" :data-shown="shown || undefined"
      :style="{ translate: `${position.x}px ${position.y}px` }" @pointerenter="keep"
      @pointerleave="hideSoon">
      <slot name="tip" />
    </span>
  </Teleport>
</template>

<style scoped>
/* Above anything stretched over its line (a row's covering link), so it
   can always be pointed at. */
.site-tooltip__name {
  all: unset;
  position: relative;
  z-index: 1;
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 0.2em;
}

.site-tooltip__name[data-pointer-only] {
  position: absolute;
  inset: -6px;
  cursor: inherit;
  text-decoration: none;
}

.site-tooltip__name:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* The inverse of the stage, so it reads as lifted off the page without a
   border. Fades in a beat after the pointer arrives, out at once. */
.site-tooltip {
  position: fixed;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: 100;
  display: block;
  inline-size: max-content;
  max-inline-size: min(22rem, calc(100vw - 24px));
  padding: var(--space-2) var(--space-3);
  color: var(--bg);
  background-color: var(--fg);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 150ms var(--ease-out),
    visibility 0ms 150ms;
}

.site-tooltip[data-shown] {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition:
    opacity 250ms var(--ease-out) 80ms,
    visibility 0ms 80ms;
}
</style>
