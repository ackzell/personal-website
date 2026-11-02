<script setup lang="ts">
/**
 * The frame every project and part page shares: the entry, then its trail
 * pinned to the bottom of the page, just above the footer, however short the
 * entry is. The last crumb is the page itself.
 */
defineProps<{ crumbs: { label: string, to?: string, lang?: string }[] }>()
</script>

<template>
  <div class="project-page">
    <article class="page project">
      <slot />
    </article>

    <!-- The flag band already says where you are; the trail closes the entry
         instead, as the way back once you've read it. -->
    <nav class="project-page__trail" aria-label="Breadcrumb" px="track-wide">
      <SiteMarkLayer clipped class="project-page__mark" />
      <ol flex gap="tight" p="0" m="0" list="none" text="sm">
        <li v-for="(crumb, i) in crumbs" :key="i" flex gap="tight">
          <span v-if="i" aria-hidden="true" text="muted">/</span>
          <NuxtLinkLocale v-if="crumb.to" :to="crumb.to" :lang="crumb.lang">{{ crumb.label }}</NuxtLinkLocale>
          <span v-else aria-current="page" :lang="crumb.lang">{{ crumb.label }}</span>
        </li>
      </ol>
    </nav>
  </div>
</template>

<style scoped>
/* <main> grows to fill the screen (main.css); here it also lays its page out
   as a column, so the trail can take the space left under a short entry. */
:global(main:has(> .project-page)) {
  display: flex;
  flex-direction: column;
}

.project-page {
  position: relative;
  flex: 1;
}

/*
 * Entrance: the entry's blocks rise one after another, as the lexicon's
 * entries do, on every visit. Only blocks move: the word, plate and part
 * names inside them travel as their own snapshots, which a block's rise
 * doesn't reach, so a traveling word never fades on its way. They develop
 * and land on the section's spring (vt-develop, vt-lift: main.css). A block
 * that brings its own entrance (the ledger) opts out with data-own-entrance.
 * The section index comes first and brings its own, so the steps count from
 * the second child.
 */
@media (prefers-reduced-motion: no-preference) {
  .project > :slotted(:not([data-own-entrance])) {
    animation:
      400ms var(--ease-out) var(--enter-delay, 390ms) backwards vt-develop,
      var(--arrive-duration) var(--ease-arrive) var(--enter-delay, 390ms) backwards vt-lift;
  }

  /* The story only fades as it lifts. It can be many screens of code and
     playing clips, and re-blurring all of that every frame dropped frames
     on moliniani and amoxtli; a block that tall is mostly below the fold,
     where nobody would see it develop anyway. */
  .project > :slotted(.story) {
    animation-name: vt-fade-in, vt-lift;
  }

  .project > :slotted(:nth-child(2)) {
    --enter-delay: 150ms;
  }

  .project > :slotted(:nth-child(3)) {
    --enter-delay: 230ms;
  }

  .project > :slotted(:nth-child(4)) {
    --enter-delay: 310ms;
  }
}

/* Out of flow, inside the entry's own bottom padding (--gap-section), so the
   trail never adds height to the page. */
.project-page__trail {
  position: absolute;
  inset-inline: 0;
  bottom: var(--gap-group);
}

/* Only pinned on small screens, where it paints the stage over the mark. */
.project-page__mark {
  display: none;
}

/* Small screens: pinned to the viewport's bottom edge like the social rail,
   stopping short of it on the inline end. */
@media (width < 40rem) {
  .project-page__trail {
    position: fixed;
    inset-inline: 0 var(--rail-width);
    bottom: 0;
    padding-block: var(--space-2);
    background: var(--bg);
  }

  .project-page__mark {
    display: block;
  }
}
</style>
