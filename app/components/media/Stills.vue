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
 * zoom into and step through; without JS it links to its full-size file.
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

const full = (name: string) => `${props.dir}/${name}.webp`
const srcset = (name: string) => `${props.dir}/${name}-720.webp 720w, ${full(name)} 1440w`
const SIZES = '(width < 40rem) 50vw, 33vw'

// The lightbox shows the capture for the scheme the page is in.
const shown = computed(() => props.items.map((item) => ({
  src: full(item.light && colorMode.value !== 'dark' ? item.light : item.src),
  alt: item.alt,
  width: props.width,
  height: props.height,
})))

function show(event: MouseEvent, i: number) {
  // A modified click still opens the file, in a tab of its own.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
  event.preventDefault()
  open.value = i
}
</script>

<template>
  <ul class="stills track-wide" :aria-label="label">
    <li v-for="(item, i) in items" :key="item.src">
      <a :href="full(item.src)" class="stills__link" @click="show($event, i)">
        <img :src="full(item.src)" :srcset="srcset(item.src)" :sizes="SIZES" :alt="item.alt" :width="width"
          :height="height" loading="lazy" decoding="async" :data-scheme="item.light ? 'dark' : undefined">
        <img v-if="item.light" :src="full(item.light)" :srcset="srcset(item.light)" :sizes="SIZES" :alt="item.alt"
          :width="width" :height="height" loading="lazy" decoding="async" data-scheme="light">
      </a>
    </li>
  </ul>
  <MediaLightbox v-model:index="open" :items="shown" />
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
  display: block;
  cursor: zoom-in;
  transition: translate 200ms var(--ease-out);
}

.stills__link img {
  display: block;
  inline-size: 100%;
  block-size: auto;
  filter: drop-shadow(0 0.5rem 1rem rgb(0 0 0 / 0.3));
}

.stills__link:hover {
  translate: 0 -2px;
}

.stills__link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

@media (width < 40rem) {
  .stills {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--gap-tight);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stills__link {
    transition: none;
  }
}
</style>
