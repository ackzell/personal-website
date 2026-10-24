<script setup lang="ts">
/**
 * Projects as lexicon entries: the Nahuatl word is the headword, then its
 * pronunciation and meaning, then what the project is. Everything stays
 * visible; hovering or focusing an entry only spotlights it.
 * A project with a logo shows a glimpse of it behind the entry, like a print
 * developing: large, washed out, revealed with the spotlight.
 * Headwords and glimpses carry view-transition names (see utils/viewTransition.ts;
 * the glimpse travels as the plate into the project heading's logo), so a page
 * must not list the same project twice.
 */
const props = defineProps<{
  projects: Project[]
  /** Entries rise in one after another as the list arrives. */
  stagger?: boolean
}>()

/*
 * The stagger runs on each entry, but a headword and its glimpse arrive as
 * their own view-transition snapshots, outside the entry's animation: give
 * those the same delay (--rise-delay, main.css). A word traveling from a
 * project page has a partner and isn't affected.
 */
const riseDelay = (i: number) => `${150 + Math.min(i, 8) * 60}ms`

useHead({
  style: [{
    key: 'lexicon-stagger',
    textContent: computed(() => (props.stagger
      ? props.projects.map((project, i) =>
        `::view-transition-new(word-${project.slug}),::view-transition-new(plate-${project.slug}){--rise-delay:${riseDelay(i)}}`).join('')
      : '')),
  }],
})
</script>

<template>
  <!-- No gaps between entries, down or across: spacing is padding inside
       each one, so the pointer never falls between entries and the spotlight
       never drops. Block, not grid, so a parent can set it in columns. -->
  <dl class="lexicon" :class="{ 'lexicon--stagger': stagger }">
    <div v-for="(project, i) in projects" :key="project.slug" class="lexicon__entry" relative grid gap="tight" py="12"
      :style="stagger ? { '--rise-delay': riseDelay(i) } : undefined">
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
      <!-- Decorative: the headword already names the project. A glimpse of
           the logo, large and washed out behind the entry. -->
      <span v-if="project.logo" class="lexicon__glimpse" aria-hidden="true">
        <img class="lexicon__glimpse-img" :src="project.logo" alt="" width="288" height="288" loading="lazy"
          decoding="async" :data-scheme="project.logoLight ? 'dark' : undefined" :style="plateTransition(project.slug)">
        <img v-if="project.logoLight" class="lexicon__glimpse-img" :src="project.logoLight" alt="" width="288"
          height="288" loading="lazy" decoding="async" data-scheme="light" :style="plateTransition(project.slug)">
      </span>
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
  /* Keeps the glimpse behind this entry's text, not the page's. */
  isolation: isolate;
}

/* Same rise as a page arriving (vt-rise, main.css), one entry after another. */
.lexicon--stagger .lexicon__entry {
  animation: 500ms var(--ease-out) var(--rise-delay) both vt-rise;
}

@media (prefers-reduced-motion: reduce) {
  .lexicon--stagger .lexicon__entry {
    animation: none;
  }
}

/* Clipped to the entry and faded top and bottom, so it reads as a glimpse of
   the logo rather than the logo. */
.lexicon__glimpse {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  mask-image: linear-gradient(to bottom, transparent, black 35%, black 65%, transparent);
}

.lexicon__glimpse-img {
  position: absolute;
  inset-inline-start: 30%;
  inset-block-start: 50%;
  inline-size: 18rem;
  block-size: auto;
  max-inline-size: none;
  translate: 0 -50%;
  rotate: -8deg;
  filter: saturate(0.6);
  opacity: 0.16;
}

/*
 * On devices that really hover, the glimpse waits and develops with the
 * spotlight, like a print: out of a blur, a beat after the headword starts to
 * lean. It leaves at once. Touch keeps it shown, as the flag band keeps its
 * labels.
 */
@media (hover: hover) and (pointer: fine) {
  .lexicon__glimpse-img {
    opacity: 0;
    filter: blur(16px) saturate(0.6);
    transition:
      opacity 200ms var(--ease-out),
      filter 200ms var(--ease-out);
  }

  .lexicon__entry:hover .lexicon__glimpse-img,
  .lexicon__entry:has(.lexicon__headword:focus-visible) .lexicon__glimpse-img {
    opacity: 0.16;
    filter: blur(0) saturate(0.6);
    transition-duration: 600ms, 800ms;
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

  /* The glimpse still develops, as a plain fade. */
  .lexicon__glimpse-img,
  .lexicon__entry:hover .lexicon__glimpse-img,
  .lexicon__entry:has(.lexicon__headword:focus-visible) .lexicon__glimpse-img {
    filter: saturate(0.6);
    transition-delay: 0ms;
  }
}
</style>
