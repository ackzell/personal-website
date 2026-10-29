<script setup lang="ts" generic="T">
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
 * from the right over the page's edge, with nothing darkened, so the guide
 * stays in use beside it (holding still) and another pick takes its place. Only
 * Escape or the close button put it away; it isn't dragged.
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

const RISE_MS = 420
const DROP_MS = 260
// Far enough (px), or fast enough (px/ms), to let it go.
const AWAY_PX = 110
const FLICK = 0.5
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const panel = useTemplateRef<HTMLElement>('panel')

// The one on screen. It lags `item` on the way out, so it can drop away
// with its contents.
const showing = shallowRef<{ item: T } | null>(null)
// How far it's been dragged down, in px, while a finger holds it.
const dragged = ref(0)
const holding = ref(false)

const ms = (duration: number) => reducedMotion.value === 'reduce' ? 0 : duration

function rise() {
  const options = { duration: ms(RISE_MS), easing: EASE_OUT }
  if (docked.value) {
    dialog.value?.animate([{ translate: '100% 0' }, { translate: '0 0' }], options)
    return
  }
  panel.value?.animate([{ translate: '0 100%' }, { translate: '0 0' }], options)
  dialog.value?.animate([{ backgroundColor: 'transparent' }, {}], options)
}

// It drops from wherever the finger left it.
async function drop() {
  const el = dialog.value
  if (!el?.open) return
  const options: KeyframeAnimationOptions = { duration: ms(DROP_MS), easing: 'ease-in', fill: 'forwards' }
  if (docked.value) {
    await el.animate([{ translate: '0 0' }, { translate: '100% 0' }], options).finished
    el.close()
    el.getAnimations().forEach((animation) => animation.cancel())
    showing.value = null
    return
  }
  const from = `0 ${dragged.value}px`
  const fade = el.animate([{}, { backgroundColor: 'transparent' }], options)
  await panel.value?.animate([{ translate: from }, { translate: '0 100%' }], options).finished
  el.close()
  fade.cancel()
  panel.value?.getAnimations().forEach((animation) => animation.cancel())
  dragged.value = 0
  showing.value = null
}

watch(item, async (now) => {
  const el = dialog.value
  if (!el || !import.meta.client) return
  if (now === null) {
    drop()
    return
  }
  showing.value = { item: now }
  if (el.open) {
    // Docked, the next pick takes the last one's place, from its top.
    panel.value?.scrollTo(0, 0)
    return
  }
  panel.value?.scrollTo(0, 0)
  docked.value = !!props.dock && wide.value
  if (docked.value) el.show()
  else el.showModal()
  await nextTick()
  rise()
})

// A panel that isn't modal gets no cancel from Escape; it's listened for.
useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape' && docked.value && item.value !== null) item.value = null
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
let start = { y: 0, time: 0 }
function grab(event: PointerEvent) {
  if (docked.value || event.button !== 0 || (event.target as HTMLElement).closest('button, a, input, [role="group"]')) return
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  holding.value = true
  start = { y: event.clientY - dragged.value, time: event.timeStamp }
}

// Down it follows the finger; up it gives a little and no more.
function pull(event: PointerEvent) {
  if (!holding.value) return
  const dy = event.clientY - start.y
  dragged.value = dy > 0 ? dy : dy / 6
}

function letGo(event: PointerEvent) {
  if (holding.value) settle(event.timeStamp)
}

function settle(time: number) {
  holding.value = false
  const speed = dragged.value / Math.max(1, time - start.time)
  if (dragged.value > AWAY_PX || speed > FLICK) {
    item.value = null
    return
  }
  panel.value?.animate([{ translate: `0 ${dragged.value}px` }, { translate: '0 0' }], { duration: ms(RISE_MS), easing: EASE_OUT })
  dragged.value = 0
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
  const y = event.touches[0]?.clientY
  if (pulling === 'no' || y === undefined || !event.cancelable) return
  if (pulling === 'maybe') {
    if (y < from) pulling = 'no'
    if (y <= from) return
    pulling = 'yes'
    holding.value = true
    start = { y: from, time: event.timeStamp }
  }
  event.preventDefault()
  const dy = y - start.y
  dragged.value = dy > 0 ? dy : dy / 6
}

function touchUp(event: TouchEvent) {
  if (pulling === 'yes' && holding.value) settle(event.timeStamp)
  pulling = 'no'
}

useEventListener(panel, 'touchmove', touchMove, { passive: false })
</script>

<template>
  <dialog ref="dialog" class="sheet" :aria-label="label"
    :class="{ 'sheet--docked': docked }" :style="{ '--lift': Math.min(1, Math.max(0, dragged) / 320) }"
    @cancel="cancel" @click="tapAbove">
    <div ref="panel" class="sheet__panel" :class="{ 'is-holding': holding, 'sheet__panel--tall': tall }"
      :style="{ translate: dragged ? `0 ${dragged}px` : undefined }" @touchstart.passive="touchDown"
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
  box-shadow: 0 -1px 0 color-mix(in oklab, var(--fg) 12%, transparent);
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
   nothing darkened. It isn't in the top layer, so it's lifted above the page,
   and a shadow sets it off from what it covers. */
.sheet--docked {
  inset: var(--header-height, 0px) 0 var(--footer-height, 0px) auto;
  z-index: 20;
  inline-size: min(30rem, 36vw);
  block-size: auto;
  background: var(--bg);
  box-shadow:
    -1px 0 0 color-mix(in oklab, var(--fg) 12%, transparent),
    -1.5rem 0 3rem -1rem color-mix(in oklab, black 25%, transparent);
}

.sheet--docked[open] {
  display: block;
}

.sheet--docked .sheet__panel {
  inline-size: 100%;
  block-size: 100%;
  max-block-size: none;
  padding: 0 var(--gap-block) var(--gap-block);
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
