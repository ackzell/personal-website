<script setup lang="ts">
/*
 * One copy of the ax mark, fixed to the viewport. SiteMark sets the main copy
 * behind the stage; the header and footer each hold a clipped copy, so the
 * mark carries across their solid backgrounds as if all three shared one.
 *
 * `clipped` wraps it in a box that fills the parent: `clip-path` (unlike
 * overflow) also clips fixed descendants, so the copy keeps the viewport's
 * geometry but only shows inside its bar. Every copy has the same geometry,
 * so they line up exactly.
 */
defineProps<{ clipped?: boolean }>()

const resting = useState('site-mark-resting', () => false)
</script>

<template>
  <div :class="{ 'site-mark-clip': clipped }" aria-hidden="true">
    <div class="site-mark">
      <SiteMarkGlyph class="site-mark__svg" :data-resting="resting" />
    </div>
  </div>
</template>

<style scoped>
/* Fills the bar, under its content (the bar is the stacking context). */
.site-mark-clip {
  position: absolute;
  inset: 0;
  z-index: -1;
  clip-path: inset(0);
  pointer-events: none;
}

/*
 * The stream background's crop, in viewport terms: the mark is about 1.54
 * screen heights across, its left edge 0.53 of its size in from the right,
 * its center 46% down. Capped by width so portrait screens keep the same
 * arc rather than a sliver.
 */
.site-mark {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  /* A shade of the stage itself, not the foreground: tone on tone. */
  color: color-mix(in oklab, var(--bg) 80%, black);
  transition: color 600ms var(--ease-out);
}

:root.dark .site-mark {
  color: color-mix(in oklab, var(--dark-accent) 15%, var(--bg));
}

.site-mark__svg {
  --mark-size: min(154lvh, 220vw);
  --mark-rest: 0.14;
  position: absolute;
  inset-inline-start: calc(100% - var(--mark-size) * 0.533);
  inset-block-start: calc(46% - var(--mark-size) / 2);
  inline-size: var(--mark-size);
  block-size: var(--mark-size);
  opacity: 0;
  transition: opacity 900ms var(--ease-out);
}

.site-mark__svg[data-resting='true'] {
  opacity: var(--mark-rest);
}
</style>
