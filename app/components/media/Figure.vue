<script setup lang="ts">
/**
 * A screenshot in a case study, placed from markdown:
 *
 *   ::media-figure{src="/media/tlapalli/editor.webp" alt="…" width="2160" height="1350" wide}
 *   Caption, in the page's own language.
 *   ::
 *
 * `srcLight` swaps in a capture for the light scheme, like a project's logo.
 * `wide` lets it out of the text column onto the wide track. Width and height
 * are the file's own, so the space is held before it loads.
 */
defineProps<{
  src: string
  srcLight?: string
  alt: string
  width: number | string
  height: number | string
  wide?: boolean
}>()

const slots = useSlots()
</script>

<template>
  <figure class="media" :class="{ 'track-wide': wide }">
    <div class="media__frame">
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
