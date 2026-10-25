<script setup lang="ts">
/**
 * A project's parts, as the sub-entries under a dictionary headword: the
 * part's name, then what it is. Each row is one link to the part's page.
 * Hovering or focusing a row leans its name letter by letter, as the index's
 * words do (ProjectIndex.vue). The rows hang off a drawn tree, so they read
 * as branches of the project rather than projects of their own; each name
 * travels to its part's heading.
 */
defineProps<{
  parts: ProjectPart[]
  /** Hung under the project's word: the trunk reaches up to join its line. */
  rooted?: boolean
}>()
</script>

<template>
  <ul class="parts" :class="{ 'parts--rooted': rooted }" m="0" p="0" list="none">
    <li v-for="(part, i) in parts" :key="part.slug" class="parts__item" :style="{ '--row': i }">
      <NuxtLinkLocale :to="`/projects/${part.parent}/${part.slug}`" class="parts__name" typeset="heading">
        <!-- One span per letter so the lean ripples through the name.
             Assistive tech gets the whole name from the hidden copy. -->
        <span class="sr-only">{{ part.title }}</span>
        <span aria-hidden="true" :style="partTransition(part.parent, part.slug)">
          <span v-for="(char, i) in part.title" :key="i" class="parts__char" :style="{ '--i': i }">{{ char }}</span>
        </span>
        <span class="parts__arrow i-iconoir-arrow-right" aria-hidden="true" />
      </NuxtLinkLocale>
      <p class="parts__desc gloss-sub">{{ part.description }}</p>
    </li>
  </ul>
</template>

<style scoped>
.parts {
  max-inline-size: var(--content-width);
}

/*
 * The tree, drawn in a margin column: a 1px trunk down the whole row
 * (::before) and a branch out to the name's middle (::after). The last row's
 * trunk stops at its branch. The branch takes the accent with the arrow while
 * its row is hovered.
 */
.parts__item {
  --stub: calc(var(--space-2) + var(--subentry-size) * 0.6);
  position: relative;
  display: grid;
  grid-template-columns: 2.5ch 1fr;
  padding-block: var(--space-2);
}

.parts__item > * {
  grid-column: 2;
}

/* --reach: how far the trunk climbs above its row. */
.parts__item::before {
  --reach: 0px;
  content: '';
  position: absolute;
  inset-block: calc(-1 * var(--reach)) 0;
  inset-inline-start: 0.5ch;
  inline-size: 1px;
  background: var(--muted);
}

.parts__item:last-child::before {
  inset-block-end: auto;
  block-size: calc(var(--stub) + var(--reach));
}

.parts__item::after {
  content: '';
  position: absolute;
  inset-block-start: var(--stub);
  inset-inline-start: 0.5ch;
  inline-size: 1.25ch;
  block-size: 1px;
  background: var(--muted);
  transition: background-color 200ms var(--ease-out);
}

/* Rooted: the first trunk climbs through the gap above the list (the
   section's mt-tight) to meet the trunk coming down from the word. */
.parts--rooted > .parts__item:first-child::before {
  --reach: var(--gap-tight);
}

/* Entrance: each row's trunk grows down in turn, after the trunk beside the
   project's description (pages/projects/[slug]/index.vue); its branch grows
   out once the trunk has passed it. */
@media (prefers-reduced-motion: no-preference) {
  .parts__item {
    --row-start: calc(650ms + var(--row) * 140ms);
  }

  .parts__item::before {
    animation: 280ms var(--ease-out) var(--row-start) both tree-grow;
  }

  .parts__item::after {
    animation: 240ms var(--ease-out) calc(var(--row-start) + 120ms) both branch-grow;
  }
}

.parts__item:is(:hover, :focus-within)::after {
  background-color: var(--accent);
}

.parts__name {
  justify-self: start;
  font-size: var(--subentry-size);
  line-height: 1.2;
  color: var(--fg);
  text-decoration: none;
}

/* The name's link covers its whole row, so the row is one target. */
.parts__name::after {
  content: '';
  position: absolute;
  inset: 0;
}

.parts__arrow {
  margin-inline-start: 0.35em;
  font-size: 0.75em;
  color: var(--muted);
  transition: translate 200ms var(--ease-out), color 200ms var(--ease-out);
}

.parts__item:is(:hover, :focus-within) .parts__arrow {
  translate: 0.2em 0;
  color: var(--accent);
}

/* The same step under the name as a related project's (ProjectIndex.vue). */
.parts__desc {
  margin: 0;
  padding-block-start: var(--space-2);
}

/*
 * The index's lean, letter by letter: each axis is its own registered
 * property so CRSV can flip early, where the motion hides it.
 */
@property --slnt {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

@property --casl {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

@property --crsv {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

.parts__name {
  --slnt: 0;
  --casl: var(--heading-casual);
  --crsv: 0;
}

.parts__item:is(:hover, :focus-within) .parts__name {
  --slnt: -15;
  --casl: 1;
  --crsv: 1;
}

/* A space between words keeps its width as an inline span. */
.parts__char {
  white-space: pre;
}

/* Leaving: quick and light. */
.parts__char {
  font-variation-settings: 'CASL' var(--casl), 'CRSV' var(--crsv), 'slnt' var(--slnt);
  transition:
    --slnt 450ms var(--ease-out),
    --casl 450ms var(--ease-out),
    --crsv 0ms;
  transition-delay: calc(var(--i) * 30ms);
}

/* Arriving: the lean starts at once and settles slowly. */
.parts__item:is(:hover, :focus-within) .parts__char {
  transition:
    --slnt 600ms var(--ease-out),
    --casl 600ms var(--ease-out),
    --crsv 0ms;
  transition-delay:
    calc(var(--i) * 35ms),
    calc(var(--i) * 35ms),
    calc(var(--i) * 35ms + 60ms);
}

@media (prefers-reduced-motion: reduce) {
  /* Same end state, no ripple. */
  .parts__char,
  .parts__item:is(:hover, :focus-within) .parts__char {
    transition-duration: 150ms, 150ms, 0ms;
    transition-delay: 0ms;
  }

  .parts__arrow {
    transition: color 200ms var(--ease-out);
  }

  .parts__item:is(:hover, :focus-within) .parts__arrow {
    translate: none;
  }
}
</style>
