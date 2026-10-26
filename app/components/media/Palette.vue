<script setup lang="ts">
/**
 * An app's features as one window and the list that drives it, the way a
 * command palette drives the app itself, placed from markdown:
 *
 *   ::media-palette{dir="/media/tlachialoni" width="1440" height="900" label="…"}
 *   ---
 *   items:
 *     - id: tour
 *       name: tour
 *       label: What the clip shows, for anyone who can't see it.
 *       caption: Optional line under the window.
 *       youtube: https://youtu.be/…
 *     - id: video
 *       name: video
 *       label: The video's own title.
 *       video: https://youtu.be/…
 *   ---
 *   ::
 *
 * Each item is a clip at `<dir>/<id>.mp4`, with `<id>.webm` and an `<id>.webp`
 * poster beside it. An item with `video` is a narrated YouTube video
 * instead (MediaVideo), played in the same window, paused when it's left;
 * it stays out of the lightbox, which can't zoom a player. Picking a name swaps the clip inside the same window: the
 * clips share one cell, so the window keeps the size of the tallest and never
 * jumps. Only the picked clip plays. The new one wipes in from the side the
 * list moved toward, over the old one sinking back, behind a line of light,
 * so even two near-identical frames read as a change. The list is a tablist:
 * arrows move through it, Home and End jump to its ends. The window switches
 * on the first time it's seen, and the rows fill in after it. A clip opens
 * larger in a lightbox (MediaLightbox), from its expand control or a tap on
 * it. Without JS there's no list, just every clip in order.
 */
interface PaletteItem {
  id: string
  name: string
  label: string
  caption?: string
  youtube?: string
  /** A YouTube link: this item is that video, not a clip. */
  video?: string
}

const props = defineProps<{
  dir: string
  width: number | string
  height: number | string
  /** The list's accessible name. */
  label: string
  items: PaletteItem[]
}>()

const mounted = useMounted()
const uid = useId()
const active = ref(0)
// The clip on its way out, and which way the list moved to get here.
const leaving = ref<number | null>(null)
const forward = ref(true)
// Counts switches, so each one draws its own accent line.
const switches = ref(0)

const SWITCH_MS = 450
let settle: ReturnType<typeof setTimeout> | undefined

function pick(index: number) {
  if (index === active.value) return
  forward.value = index > active.value
  leaving.value = active.value
  active.value = index
  switches.value++
  clearTimeout(settle)
  settle = setTimeout(() => (leaving.value = null), SWITCH_MS)
}

onBeforeUnmount(() => clearTimeout(settle))

const tabs = useTemplateRef<HTMLButtonElement[]>('tabs')

// On phones the list is a row that scrolls: like the flag band's stops
// (SiteFlagNav), it fades out at whichever end has more to scroll to, and
// keeps the picked name in view however it was picked (a tap, the keys, the
// lightbox). scrollLeft, not scrollIntoView, which would scroll the page too.
// As a column it doesn't scroll, so none of this shows.
const list = useTemplateRef<HTMLElement>('list')
const { arrivedState, measure } = useScroll(list, { offset: { left: 1, right: 1 } })
// The list mounts after hydration and changes shape with the screen.
useResizeObserver(list, () => measure())

watch(active, (i) => {
  const row = list.value
  const tab = tabs.value?.[i]
  if (!row || !tab || row.scrollWidth <= row.clientWidth) return
  row.scrollTo({ left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' })
}, { flush: 'post' })

const KEYS: Record<string, (i: number, n: number) => number> = {
  ArrowDown: (i, n) => (i + 1) % n,
  ArrowRight: (i, n) => (i + 1) % n,
  ArrowUp: (i, n) => (i - 1 + n) % n,
  ArrowLeft: (i, n) => (i - 1 + n) % n,
  Home: () => 0,
  End: (_, n) => n - 1,
}

function onKeydown(event: KeyboardEvent) {
  const move = KEYS[event.key]
  if (!move) return
  event.preventDefault()
  pick(move(active.value, props.items.length))
  tabs.value?.[active.value]?.focus()
}

const stage = useTemplateRef<HTMLElement>('stage')
const power = usePowerOn(stage)

const src = (item: PaletteItem, ext: string) => `${props.dir}/${item.id}.${ext}`

// The clips, larger, in a lightbox: the window rests meanwhile, and on the
// way back it shows whichever clip the lightbox ended on. `expanded` counts
// clips only (videos aren't in the lightbox); `clips` maps it to the list.
const clips = computed(() => props.items.flatMap((item, i) => (item.video ? [] : [i])))
const expanded = ref<number | null>(null)
const showing = computed(() => (expanded.value === null ? null : clips.value[expanded.value] ?? null))
const larger = computed(() => clips.value.map((i) => props.items[i]!).map((item) => ({
  src: src(item, 'mp4'),
  webm: src(item, 'webm'),
  poster: src(item, 'webp'),
  alt: item.label,
  width: props.width,
  height: props.height,
})))

watch(showing, (now, before) => {
  if (now === null && before !== null && before !== active.value) {
    leaving.value = null
    active.value = before
  }
})
</script>

<template>
  <div class="palette track-wide" :class="{ 'palette--live': mounted }" :data-power="power">
    <div v-if="mounted" ref="list" class="palette__list" role="tablist"
      :data-fade-start="!arrivedState.left || undefined" :data-fade-end="!arrivedState.right || undefined"
      aria-orientation="vertical" :aria-label="label"
      @keydown="onKeydown">
      <button v-for="(item, i) in items" :id="`${uid}-tab-${i}`" ref="tabs" :key="item.id" type="button" role="tab"
        class="palette__item" :style="{ '--i': i }" :aria-selected="i === active" :aria-controls="`${uid}-panel-${i}`"
        :tabindex="i === active ? 0 : -1" @click="pick(i)">
        {{ item.name }}
      </button>
    </div>

    <div ref="stage" class="palette__stage power-screen" :data-dir="forward ? 'forward' : 'back'">
      <div v-for="(item, i) in items" :id="`${uid}-panel-${i}`" :key="item.id" class="palette__panel" :class="{
        'is-active': i === active,
        'is-entering': i === active && leaving !== null,
        'is-leaving': i === leaving,
      }" :role="mounted ? 'tabpanel' : undefined" :aria-labelledby="mounted ? `${uid}-tab-${i}` : undefined"
        :inert="mounted && i !== active">
        <MediaVideo v-if="item.video" :src="item.video" :title="item.label" :inactive="mounted && i !== active">
          <template v-if="item.caption" #default>{{ item.caption }}</template>
        </MediaVideo>
        <MediaClip v-else :src="src(item, 'mp4')" :webm="src(item, 'webm')" :poster="src(item, 'webp')" :label="item.label"
          :width="width" :height="height" :youtube="item.youtube"
          :inactive="mounted && (i !== active || expanded !== null)" expandable class="media--window"
          @expand="expanded = clips.indexOf(i)">
          <template v-if="item.caption" #default>{{ item.caption }}</template>
        </MediaClip>
      </div>
      <span v-if="leaving !== null" :key="switches" class="palette__scan" aria-hidden="true" />
    </div>
    <MediaLightbox v-if="mounted" v-model:index="expanded" :items="larger" />
  </div>
</template>

<style scoped>
/* Without JS, the clips simply follow one another. */
.palette__stage {
  display: grid;
  gap: var(--gap-block);
}

/* With JS: the list beside the window, like the palette beside the page. */
.palette--live {
  display: grid;
  grid-template-columns: minmax(8rem, max-content) 1fr;
  gap: var(--gap-block);
  align-items: start;
}

/* Every clip in the same cell: the window is as tall as the tallest of them
   (a caption, a YouTube link), whichever is showing. */
.palette--live .palette__panel {
  grid-area: 1 / 1;
  visibility: hidden;
}

.palette--live :is(.is-active, .is-leaving) {
  visibility: visible;
}

.palette--live .is-active {
  z-index: 1;
}

.palette__list {
  display: grid;
  gap: 1px;
  /* The window's shadow hangs below it; the list sits level with its top. */
  position: sticky;
  top: var(--gap-block);
}

.palette__item {
  padding: var(--space-2) var(--space-3);
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 0.875rem;
  text-align: start;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 200ms var(--ease-out), color 200ms var(--ease-out);
}

.palette__item:hover {
  color: var(--fg);
}

/* The chosen row, filled the way the app fills its palette's current row. */
.palette__item[aria-selected='true'] {
  background: color-mix(in srgb, var(--fg) 10%, transparent);
  color: var(--fg);
}

.palette__item:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

@media (prefers-reduced-motion: no-preference) {
  /* The new clip wipes in from the side the list moved toward: down the list,
     it comes up from below; back up, down from above. Past the edges, so the
     window's shadow comes with it. */
  .is-entering {
    animation: 450ms var(--ease-out) both palette-wipe;
  }

  [data-dir='forward'] .is-entering {
    --wipe-from: inset(100% -3rem -3rem);
  }

  [data-dir='back'] .is-entering {
    --wipe-from: inset(-3rem -3rem 100%);
  }

  /* The line on the wipe's edge: the scan box is the stage's size, pushed
     off by its own height and drawn back with the wipe, carrying the line on
     its leading edge. It fades as the wipe lands. */
  .palette--live .palette__stage {
    position: relative;
  }

  .palette__scan {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    animation: 450ms var(--ease-out) both palette-scan;
  }

  /* Light on the screen, whatever the page's scheme: the clips are dark
     windows, and the work section's accent is plain ink. Built like the
     site's glow (main.css): a paper core, halos falling off, added on. */
  .palette__scan::before {
    --scan-light: var(--deeper-paper);
    content: '';
    position: absolute;
    inset-inline: 0;
    block-size: 2px;
    background: var(--scan-light);
    box-shadow:
      0 0 4px color-mix(in oklab, var(--scan-light) 70%, transparent),
      0 0 12px color-mix(in oklab, var(--scan-light) 45%, transparent),
      0 0 32px color-mix(in oklab, var(--scan-light) 20%, transparent);
    mix-blend-mode: plus-lighter;
  }

  [data-dir='forward'] .palette__scan {
    --scan-from: 0 100%;
  }

  [data-dir='forward'] .palette__scan::before {
    inset-block-start: 0;
  }

  [data-dir='back'] .palette__scan {
    --scan-from: 0 -100%;
  }

  [data-dir='back'] .palette__scan::before {
    inset-block-end: 0;
  }

  /* The old one sinks back and dims under it. */
  .is-leaving {
    animation: 450ms var(--ease-out) both palette-recede;
  }

  /* Once the window has switched on, the rows fill in down the list, the way
     the app's palette fills with results. */
  [data-power='off'] .palette__item {
    opacity: 0;
  }

  :is([data-power='auto'], [data-power='on']) .palette__item {
    animation: 300ms var(--ease-out) calc(120ms + var(--i) * 25ms) both palette-row;
  }
}

/* Reduced motion: the clips still hand over, in place, and no line sweeps. */
@media (prefers-reduced-motion: reduce) {
  .is-entering {
    animation: 200ms ease-out both palette-fade;
  }

  .palette__scan {
    display: none;
  }
}

@keyframes palette-wipe {
  from {
    clip-path: var(--wipe-from);
  }
  to {
    clip-path: inset(-3rem);
  }
}

@keyframes palette-scan {
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

@keyframes palette-recede {
  to {
    scale: 0.97;
    filter: brightness(0.5);
  }
}

@keyframes palette-row {
  from {
    opacity: 0;
    translate: -0.75rem 0;
  }
}

@keyframes palette-fade {
  from {
    opacity: 0;
  }
}

/* Small screens: the list over the window, as a row to swipe. */
@media (width < 40rem) {
  .palette--live {
    grid-template-columns: 1fr;
    /* Close over the window, so the row reads as its tabs. */
    gap: var(--gap-tight);
  }

  .palette__list {
    position: static;
    display: flex;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    --fade: var(--space-8);
    mask-image: linear-gradient(to right,
        transparent,
        #000 var(--fade-start, 0px),
        #000 calc(100% - var(--fade-end, 0px)),
        transparent);
  }

  .palette__list[data-fade-start] {
    --fade-start: var(--fade);
  }

  .palette__list[data-fade-end] {
    --fade-end: var(--fade);
  }

  .palette__item {
    scroll-snap-align: start;
  }
}
</style>
