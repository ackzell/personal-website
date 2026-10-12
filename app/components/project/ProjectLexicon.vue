<script setup lang="ts">
/**
 * Projects as lexicon entries: the Nahuatl word is the headword, then its
 * pronunciation and meaning, then what the project is. Everything stays
 * visible; hovering or focusing an entry only spotlights it.
 * Headwords carry the word's view-transition name (see utils/viewTransition.ts),
 * so a page must not list the same project twice.
 */
defineProps<{ projects: Project[] }>()

// Pronunciations and meanings come only from the owner; unfilled ones
// (still `TODO` in content) stay out of the UI.
const filled = (value: string) => value && value !== 'TODO'
</script>

<template>
  <!-- No gaps between entries, down or across: spacing is padding inside
       each one, so the pointer never falls between entries and the spotlight
       never drops. Block, not grid, so a parent can set it in columns. -->
  <dl class="lexicon" mt="0">
    <div
      v-for="project in projects"
      :key="project.slug"
      class="lexicon__entry"
      relative grid gap="tight" py="group"
    >
      <dt flex="~ wrap" items="baseline" gap="x-group y-1">
        <NuxtLinkLocale
          :to="`/projects/${project.slug}`"
          class="lexicon__headword text-fg text-headword"
          lang="nah"
          typeset="heading"
          leading="none"
          decoration="none"
          :style="wordTransition(project.slug)"
        >
          <!-- One span per letter so the hover can ripple through the word.
               Assistive tech gets the whole word from the hidden copy. -->
          <span class="sr-only">{{ project.word }}</span>
          <span aria-hidden="true">
            <span
              v-for="(char, i) in project.word"
              :key="i"
              class="lexicon__char"
              :style="{ '--i': i }"
            >{{ char }}</span>
          </span>
        </NuxtLinkLocale>
        <span v-if="filled(project.pronunciation)" text="muted">/{{ project.pronunciation }}/</span>
        <span v-if="filled(project.meaning)" text="fg">‘{{ project.meaning }}’</span>
      </dt>
      <dd m="0" text="muted">
        <span text="fg">{{ project.title }}.</span>
        {{ project.description }}
        <span whitespace="nowrap">· <ProjectStatus :status="project.status" /></span>
      </dd>
    </div>
  </dl>
</template>

<style scoped>
/* Entries' own padding is the gutter; a real column gap would be a dead zone. */
.lexicon {
  column-gap: 0;
}

/* The headword link covers its whole entry, so the entry is one target. */
.lexicon__headword::after {
  content: '';
  position: absolute;
  inset: 0;
}

.lexicon__entry {
  /* Stands in for a column gap when the list is set in columns. */
  padding-inline-end: var(--gap-block);
  break-inside: avoid;
  transition: opacity 250ms var(--ease-out);
}

/* Spotlight: one entry in focus, the rest step back. Pointer hover only on
   devices that really hover: a tap on touch fires a sticky :hover. */
.lexicon:has(.lexicon__headword:focus-visible) .lexicon__entry:not(:focus-within) {
  opacity: 0.4;
}
@media (hover: hover) and (pointer: fine) {
  .lexicon:has(.lexicon__entry:hover) .lexicon__entry:not(:hover) {
    opacity: 0.4;
  }
}

/*
 * The word writes itself: letter by letter, left to right, each one leans to
 * -15deg, softens fully casual and switches to its cursive form.
 * Weight stays put: a heavier word read as bulging rather than being written.
 * Mono widths hold across every axis, so nothing around the word moves.
 *
 * Each axis is its own registered property, so each can be timed on its own:
 * CRSV is a switch, not a range, so it flips at the moment of peak speed,
 * where motion hides the swap: mid-lean on the way in (ease-in-out is fastest
 * halfway), right away on the way out (ease-out is fastest at the start).
 * Flipping it anywhere else reads as a second wave. A single
 * font-variation-settings transition can't separate the axes.
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

.lexicon__headword {
  --slnt: 0;
  --casl: var(--heading-casual);
  --crsv: 0;
}
.lexicon__headword:focus-visible {
  --slnt: -15;
  --casl: 1;
  --crsv: 1;
}
@media (hover: hover) and (pointer: fine) {
  .lexicon__entry:hover .lexicon__headword {
    --slnt: -15;
    --casl: 1;
    --crsv: 1;
  }
}

/* Leaving: quick and light; letters return to upright forms right away. */
.lexicon__char {
  font-variation-settings: 'CASL' var(--casl), 'CRSV' var(--crsv), 'slnt' var(--slnt);
  transition:
    --slnt 450ms var(--ease-out),
    --casl 450ms var(--ease-out),
    --crsv 0ms;
  transition-delay: calc(var(--i) * 30ms);
}
/* Arriving: slow and symmetric, so the lean flows; the cursive swap waits
   for the middle of each letter's lean. */
.lexicon__entry:hover .lexicon__char,
.lexicon__headword:focus-visible .lexicon__char {
  transition:
    --slnt 700ms var(--ease-in-out),
    --casl 700ms var(--ease-in-out),
    --crsv 0ms;
  transition-delay:
    calc(var(--i) * 45ms),
    calc(var(--i) * 45ms),
    calc(var(--i) * 45ms + 350ms);
}

@media (prefers-reduced-motion: reduce) {
  /* Same end state, no ripple. */
  .lexicon__char,
  .lexicon__entry:hover .lexicon__char,
  .lexicon__headword:focus-visible .lexicon__char {
    transition-duration: 150ms, 150ms, 0ms;
    transition-delay: 0ms;
  }
}
</style>
