<script setup lang="ts">
/**
 * A screenshot in a case study, placed from markdown:
 *
 *   ::media-figure{src="/media/tlapalli/editor.webp" alt="…" width="2160" height="1350" wide}
 *   Caption, in the page's own language.
 *   ::
 *
 * `srcLight` swaps in a capture for the light scheme, like a project's logo.
 * `wide` lets it out of the text column onto the wide track. `window` dresses
 * a capture of an app window as one (media--window), which switches on the
 * first time it's seen (usePowerOn). Width and height are the file's own, so
 * the space is held before it loads.
 */
const props = defineProps<{
  src: string
  srcLight?: string
  alt: string
  width: number | string
  height: number | string
  wide?: boolean
  window?: boolean
}>()

const slots = useSlots()

const frame = useTemplateRef<HTMLElement>('frame')
const power = usePowerOn(frame)
</script>

<template>
  <figure class="media" :class="{ 'track-wide': wide, 'media--window': window }"
    :data-power="props.window ? power : undefined">
    <div ref="frame" class="media__frame" :class="{ 'power-screen': window }">
      <img :src="src" :alt="alt" :width="width" :height="height" loading="lazy" decoding="async"
        :data-scheme="srcLight ? 'dark' : undefined">
      <img v-if="srcLight" :src="srcLight" :alt="alt" :width="width" :height="height" loading="lazy" decoding="async"
        data-scheme="light">
    </div>
    <figcaption v-if="slots.default" class="media__caption">
      <slot mdc-unwrap="p" />
    </figcaption>
  </figure>
</template>
