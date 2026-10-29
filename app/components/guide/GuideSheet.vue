<script setup lang="ts">
/**
 * A release lifted out of the guide on a touch screen: a tap on a cell
 * raises this sheet from the bottom instead of leaving for YouTube. A video
 * plays right here (MediaVideo, with its way out to YouTube under it); an
 * episode has its way out to mytypeof.dev.
 *
 * Dragged down by its top it follows the finger as the dark lifts, and let
 * go far or fast enough it drops away; otherwise it settles back. Escape,
 * the close button or a tap above it close it too. It's a modal <dialog>,
 * so focus stays inside and goes back to the cell that opened it.
 */
export interface SheetRelease {
  /** The YouTube video's id, for a playlist's release. */
  video?: string
  title: string
  /** The playlist or season it's from. */
  from: string
  figures: { value: string, unit?: string, soft?: boolean }[]
  url: string
}

const release = defineModel<SheetRelease | null>('release', { required: true })

const { t } = useI18n()
const reducedMotion = usePreferredReducedMotion()

const RISE_MS = 420
const DROP_MS = 260
// Far enough (px), or fast enough (px/ms), to let it go.
const AWAY_PX = 110
const FLICK = 0.5
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const panel = useTemplateRef<HTMLElement>('panel')

// The one on screen. It lags `release` on the way out, so it can drop away
// with its contents.
const showing = ref<SheetRelease | null>(null)
// How far it's been dragged down, in px, while a finger holds it.
const dragged = ref(0)
const holding = ref(false)

const watchUrl = (video: string) => `https://www.youtube.com/watch?v=${video}`
const poster = (video: string) => `https://i.ytimg.com/vi/${video}/hqdefault.jpg`

const ms = (duration: number) => reducedMotion.value === 'reduce' ? 0 : duration

function rise() {
  panel.value?.animate([{ translate: '0 100%' }, { translate: '0 0' }], { duration: ms(RISE_MS), easing: EASE_OUT })
  dialog.value?.animate([{ backgroundColor: 'transparent' }, {}], { duration: ms(RISE_MS), easing: EASE_OUT })
}

// It drops from wherever the finger left it.
async function drop() {
  const el = dialog.value
  if (!el?.open) return
  const from = `0 ${dragged.value}px`
  const fade = el.animate([{}, { backgroundColor: 'transparent' }], { duration: ms(DROP_MS), easing: 'ease-in', fill: 'forwards' })
  await panel.value?.animate([{ translate: from }, { translate: '0 100%' }], { duration: ms(DROP_MS), easing: 'ease-in', fill: 'forwards' }).finished
  el.close()
  fade.cancel()
  panel.value?.getAnimations().forEach((animation) => animation.cancel())
  dragged.value = 0
  showing.value = null
}

watch(release, async (now) => {
  const el = dialog.value
  if (!el || !import.meta.client) return
  if (!now) {
    drop()
    return
  }
  showing.value = now
  if (el.open) return
  el.showModal()
  await nextTick()
  rise()
})

// Escape goes the same way down as the close button.
function cancel(event: Event) {
  event.preventDefault()
  release.value = null
}

// The dark above the sheet is the dialog itself.
function tapAbove(event: MouseEvent) {
  if (event.target === dialog.value) release.value = null
}

let start = { y: 0, time: 0 }
function grab(event: PointerEvent) {
  if (event.button !== 0) return
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
  if (!holding.value) return
  holding.value = false
  const speed = dragged.value / Math.max(1, event.timeStamp - start.time)
  if (dragged.value > AWAY_PX || speed > FLICK) {
    release.value = null
    return
  }
  panel.value?.animate([{ translate: `0 ${dragged.value}px` }, { translate: '0 0' }], { duration: ms(RISE_MS), easing: EASE_OUT })
  dragged.value = 0
}
</script>

<template>
  <dialog ref="dialog" class="sheet" :aria-label="showing?.title"
    :style="{ '--lift': Math.min(1, Math.max(0, dragged) / 320) }" @cancel="cancel" @click="tapAbove">
    <div ref="panel" class="sheet__panel" :class="{ 'is-holding': holding }"
      :style="{ translate: dragged ? `0 ${dragged}px` : undefined }">
      <div v-for="item in showing ? [showing] : []" :key="item.url" class="sheet__in">
        <div class="sheet__grab" @pointerdown="grab" @pointermove="pull" @pointerup="letGo" @pointercancel="letGo">
          <span class="sheet__handle" aria-hidden="true" />
          <p class="sheet__from" m="0" text="sm muted">{{ item.from }}</p>
          <h2 class="sheet__title" m="0">{{ item.title }}</h2>
          <p m="0" text="sm">
            <GuideFigures :figures="item.figures" />
          </p>
          <button type="button" class="sheet__close" :aria-label="t('projects.media.lightbox.close')"
            @click="release = null">
            <span class="i-iconoir-xmark" aria-hidden="true" />
          </button>
        </div>
        <MediaVideo v-if="item.video" :src="watchUrl(item.video)" :title="item.title" :poster="poster(item.video)" />
        <p v-if="!item.video" m="0">
          <a :href="item.url" class="sheet__out">{{ t('media.guide.openPodcast') }}<span class="i-iconoir-arrow-up-right"
              aria-hidden="true" /></a>
        </p>
      </div>
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

/* The page behind holds still while the sheet is up. */
:global(html:has(.sheet[open])) {
  overflow: hidden;
}

.sheet__panel {
  box-sizing: border-box;
  inline-size: min(100%, 36rem);
  max-block-size: 92svh;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 var(--gap-group) max(var(--gap-block), env(safe-area-inset-bottom));
  background: var(--bg);
  box-shadow: 0 -1px 0 color-mix(in oklab, var(--fg) 12%, transparent);
}

.sheet__in {
  display: grid;
  gap: var(--gap-group);
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

.sheet__title {
  font-family: var(--font-heading);
  font-variation-settings: 'CASL' var(--heading-casual);
  font-size: 1.25rem;
  line-height: 1.2;
  text-wrap: balance;
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

.sheet__close:focus-visible,
.sheet__out:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.sheet__out {
  display: inline-flex;
  gap: 0.4ch;
  align-items: center;
}

/* MediaVideo sits in the sheet edge to edge of its text, with no room above. */
.sheet__in :deep(.media) {
  margin: 0;
}
</style>
