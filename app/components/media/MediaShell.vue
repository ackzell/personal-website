<script setup lang="ts">
/*
 * The figure every case-study media piece sits in (Figure, Clip, Site, Video,
 * Take): the piece in the default slot, its caption under it. `wide` lets it
 * out of the text column onto the wide track. The `media` class is the hook
 * the prose flow spaces it by (main.css).
 */
defineProps<{ wide?: boolean }>()
</script>

<template>
  <!-- mx="0": a figure carries a 40px UA inline margin the reset leaves. -->
  <figure class="media" :class="{ 'track-wide': wide }" grid gap="tight" mx="0">
    <slot />
    <figcaption v-if="$slots.caption" class="media__caption" max-w="[var(--content-width)]" text="sm muted">
      <slot name="caption" />
    </figcaption>
  </figure>
</template>
