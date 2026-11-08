<script setup lang="ts">
/**
 * An app's screenshots as a contact sheet, for anyone who'd rather look at a
 * still than watch a loop, placed from markdown:
 *
 *   ::media-stills{dir="/media/tlachialoni/stills" width="1440" height="900" label="…"}
 *   ---
 *   items:
 *     - src: page-loaded
 *       alt: What the screenshot shows.
 *     - src: strip-dark
 *       light: strip-light
 *       alt: …
 *   ---
 *   ::
 *
 * Each item is `<dir>/<src>.webp` at full size, with a `<src>-720.webp` beside
 * it for the sheet. `light` swaps in a capture for the light scheme, like
 * MediaFigure's `srcLight`. A still opens in a lightbox (MediaLightbox), to
 * zoom into and step through; without JS it links to its full-size file. It
 * opens out of the still and goes back into it.
 *
 * The first time the sheet is seen, the stills are dealt onto it one after
 * another, each landing from a slight tilt (usePowerOn times it). On a
 * pointer, the one under it lifts and its neighbours lean aside, and it
 * leans toward the pointer, further while pressed, like a print picked up by
 * that corner.
 *
 * The captures are windows with their own transparent, rounded corners, so
 * they sit on the page bare: no frame field behind them, and a drop shadow
 * that follows the corners rather than a box.
 */
interface Still {
  src: string
  light?: string
  alt: string
}

const props = defineProps<{
  dir: string
  width: number | string
  height: number | string
  /** The sheet's accessible name. */
  label: string
  items: Still[]
}>()

const colorMode = useColorMode()
const open = ref<number | null>(null)

const sheet = useTemplateRef<HTMLElement>('sheet')
const power = usePowerOn(sheet)
const links = useTemplateRef<HTMLAnchorElement[]>('links')
const spot = (i: number) => links.value?.[i]

const full = (name: string) => `${props.dir}/${name}.webp`
// The full file is as wide as the capture says; the sheet always gets a 720.
const srcset = (name: string) => `${props.dir}/${name}-720.webp 720w, ${full(name)} ${props.width}w`
const SIZES = '(width < 40rem) 50vw, 33vw'

// The lightbox shows the capture for the scheme the page is in. Only once
// mounted: the server can't know the stored scheme, so hydration matches it.
const mounted = useMounted()
const shown = computed(() => props.items.map((item) => {
  const name = item.light && (!mounted.value || colorMode.value !== 'dark') ? item.light : item.src
  return {
    src: full(name),
    thumb: `${props.dir}/${name}-720.webp`,
    alt: item.alt,
    width: props.width,
    height: props.height,
  }
}))

// Where the pointer is on a still, from -1 to 1 each way, for it to lean.
function lean(event: PointerEvent) {
  const link = event.currentTarget as HTMLElement
  const box = link.getBoundingClientRect()
  link.style.setProperty('--lean-x', `${((event.clientX - box.left) / box.width - 0.5) * 2}`)
  link.style.setProperty('--lean-y', `${((event.clientY - box.top) / box.height - 0.5) * 2}`)
}

function settle(event: PointerEvent) {
  const link = event.currentTarget as HTMLElement
  link.style.removeProperty('--lean-x')
  link.style.removeProperty('--lean-y')
}

function show(event: MouseEvent, i: number) {
  // A modified click still opens the file, in a tab of its own.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
  event.preventDefault()
  open.value = i
}
</script>

<template>
  <ul ref="sheet" class="stills track-wide" :aria-label="label" :data-power="power">
    <li v-for="(item, i) in items" :key="item.src" :style="{ '--i': i }">
      <a ref="links" :href="full(item.src)" class="stills__link" data-press="none" @click="show($event, i)" @pointermove="lean"
        @pointerdown="lean" @pointerleave="settle" @pointercancel="settle">
        <img :src="full(item.src)" :srcset="srcset(item.src)" :sizes="SIZES" :alt="item.alt" :width="width"
          :height="height" loading="lazy" decoding="async" :data-scheme="item.light ? 'dark' : undefined">
        <img v-if="item.light" :src="full(item.light)" :srcset="srcset(item.light)" :sizes="SIZES" :alt="item.alt"
          :width="width" :height="height" loading="lazy" decoding="async" data-scheme="light">
      </a>
    </li>
  </ul>
  <MediaLightbox v-model:index="open" :items="shown" :from="spot" />
</template>

<style scoped>
.stills {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--gap-group);
  /* Its own stop, like a figure (main.css). */
  margin-block: var(--gap-block) 0;
  padding: 0;
  list-style: none;
}

.stills__link {
  --lean: 0deg;
  display: block;
  cursor: zoom-in;
  transform: perspective(60rem)
    rotateY(calc(var(--lean-x, 0) * var(--lean)))
    rotateX(calc(var(--lean-y, 0) * var(--lean) * -1));
  transition:
    translate 200ms var(--ease-out),
    scale 200ms var(--ease-out),
    transform 150ms var(--ease-out);
}

/* Pressed, it gives under the pointer. */
.stills__link:active {
  --lean: 6deg;
  scale: 0.98;
}

.stills__link img {
  display: block;
  inline-size: 100%;
  block-size: auto;
  filter: drop-shadow(0 0.5rem 1rem rgb(0 0 0 / 0.3));
}

@media (hover: hover) {
  .stills__link:hover {
    --lean: 3deg;
    translate: 0 -0.25rem;
  }

  .stills__link:hover:active {
    --lean: 6deg;
  }

  .stills li:hover + li .stills__link {
    translate: 0.375rem 0;
  }

  .stills li:has(+ li:hover) .stills__link {
    translate: -0.375rem 0;
  }
}

.stills__link:focus-visible {
  outline-offset: 3px;
}

@media (width < 40rem) {
  .stills {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--gap-tight);
  }
}

/* Dealt like prints off a stack: each lands from its own small tilt, one
   after another. With the page's entrance they wait for it to begin. */
@media (prefers-reduced-motion: no-preference) {
  [data-power='off'] li {
    opacity: 0;
  }

  :is([data-power='auto'], [data-power='on']) li {
    animation: 500ms var(--ease-out) calc(var(--deal-after, 0ms) + var(--i) * 70ms) backwards stills-deal;
  }

  [data-power='auto'] {
    --deal-after: 350ms;
  }

  li:nth-child(odd) {
    --tilt: -2deg;
  }

  li:nth-child(even) {
    --tilt: 1.5deg;
  }

  li:nth-child(3n) {
    --tilt: -1deg;
  }
}

@keyframes stills-deal {
  from {
    opacity: 0;
    translate: 0 1.5rem;
    rotate: var(--tilt);
    scale: 0.96;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stills__link,
  .stills__link:active,
  .stills__link:hover {
    --lean: 0deg;
    transition: none;
  }
}
</style>
