<script setup lang="ts">
/**
 * Projects as lexicon entries: the Nahuatl word is the headword, then its
 * pronunciation and meaning, then what the project is. Everything stays
 * visible; hovering or focusing an entry only spotlights it.
 * A project with a logo shows it as the entry's plate, like an illustrated
 * dictionary: in the margin, revealed with the spotlight.
 * Headwords and plates carry view-transition names (see utils/viewTransition.ts),
 * so a page must not list the same project twice.
 */
defineProps<{ projects: Project[] }>()
</script>

<template>
  <!-- No gaps between entries, down or across: spacing is padding inside
       each one, so the pointer never falls between entries and the spotlight
       never drops. Block, not grid, so a parent can set it in columns. -->
  <dl class="lexicon">
    <div v-for="project in projects" :key="project.slug" class="lexicon__entry" relative grid gap="tight" py="12">
      <WordLine as="dt" :pronunciation="project.pronunciation" :meaning="project.meaning" :status="project.status">
        <NuxtLinkLocale :to="`/projects/${project.slug}`" class="lexicon__headword text-fg text-headword" lang="nah"
          typeset="heading" leading="none" decoration="none" :style="wordTransition(project.slug)">
          <!-- One span per letter so the hover can ripple through the word.
               Assistive tech gets the whole word from the hidden copy. -->
          <span class="sr-only">{{ project.word }}</span>
          <span aria-hidden="true">
            <span v-for="(char, i) in project.word" :key="i" class="lexicon__char" :style="{ '--i': i }">{{ char
              }}</span>
          </span>
        </NuxtLinkLocale>
      </WordLine>
      <dd m="0" text="muted">
        {{ project.description }}
      </dd>
      <!-- Decorative: the headword already names the project. -->
      <img v-if="project.logo" class="lexicon__plate" :src="project.logo" alt="" width="56" height="56" loading="lazy"
        decoding="async" :style="plateTransition(project.slug)">
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
  /* The plate sits beside the headword line only; the description below runs
     the full width. Every entry keeps that margin, logo or not, so headwords
     wrap the same down the column. */
  grid-template-columns: minmax(0, 1fr) var(--plate-size);
  column-gap: var(--gap-group);
  --plate-size: 3.5rem;
}

.lexicon__entry>dt {
  grid-column: 1;
}

.lexicon__entry>dd {
  grid-column: 1 / -1;
}

.lexicon__plate {
  grid-column: 2;
  grid-row: 1;
  align-self: start;
  inline-size: var(--plate-size);
  block-size: auto;
}

/*
 * On devices that really hover, the plate waits in the margin and develops
 * with the spotlight, like a print: in from the word's side, out of a blur,
 * a beat after the headword starts to lean. It leaves at once. Touch keeps
 * plates shown, as the flag band keeps its labels.
 */
@media (hover: hover) and (pointer: fine) {
  .lexicon__plate {
    opacity: 0;
    translate: calc(-1 * var(--space-2)) 0;
    filter: blur(6px);
    transition:
      opacity 150ms var(--ease-out),
      translate 150ms var(--ease-out),
      filter 150ms var(--ease-out);
  }

  .lexicon__entry:hover .lexicon__plate,
  .lexicon__entry:has(.lexicon__headword:focus-visible) .lexicon__plate {
    opacity: 1;
    translate: 0 0;
    filter: none;
    transition-duration: 400ms, 600ms, 500ms;
    transition-delay: 120ms;
  }
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
 * where motion hides the swap: early on both ways, since both ease out and
 * ease-out is fastest at the start.
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

/* Arriving: the lean starts at once and settles slowly (ease-out), so the
   hover answers right away. The cursive swap lands early in each letter's
   lean, where ease-out moves fastest. */
.lexicon__entry:hover .lexicon__char,
.lexicon__headword:focus-visible .lexicon__char {
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
  .lexicon__char,
  .lexicon__entry:hover .lexicon__char,
  .lexicon__headword:focus-visible .lexicon__char {
    transition-duration: 150ms, 150ms, 0ms;
    transition-delay: 0ms;
  }

  /* The plate still develops, as a plain fade. */
  .lexicon__plate,
  .lexicon__entry:hover .lexicon__plate,
  .lexicon__entry:has(.lexicon__headword:focus-visible) .lexicon__plate {
    translate: none;
    filter: none;
    transition-delay: 0ms;
  }
}
</style>
