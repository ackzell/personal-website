<script setup lang="ts">
/**
 * Projects as a back-of-book index: plate, word, dot leader, meaning. A
 * quieter list than the lexicon, for cross-references under an entry.
 * Hovering or focusing a row colors its plate and leans its word; rows never
 * change height, so nothing below them moves.
 * Words and plates carry view-transition names (see utils/viewTransition.ts), so a page
 * must not list the same project twice.
 */
defineProps<{ projects: Project[] }>()

// Meanings come only from the owner; unfilled ones (`TODO`) stay out of the UI.
const filled = (value: string) => value && value !== 'TODO'
</script>

<template>
  <ul class="index" m="0" p="0" list="none">
    <li v-for="project in projects" :key="project.slug" class="index__item">
      <span class="index__line">
        <!-- Decorative: the word already names the project. -->
        <template v-if="project.logo">
          <img class="index__plate" :src="project.logo" alt="" width="24" height="24" loading="lazy" decoding="async"
            :data-scheme="project.logoLight ? 'dark' : undefined" :style="plateTransition(project.slug)">
          <img v-if="project.logoLight" class="index__plate" :src="project.logoLight" alt="" width="24" height="24"
            loading="lazy" decoding="async" data-scheme="light" :style="plateTransition(project.slug)">
        </template>
        <span v-else class="index__plate" aria-hidden="true" />
        <NuxtLinkLocale :to="`/projects/${project.slug}`" class="index__word" lang="nah"
          :style="wordTransition(project.slug)">
          <!-- One span per letter so the hover ripples through the word, as in
               the lexicon. Assistive tech gets the whole word from the hidden copy. -->
          <span class="sr-only">{{ project.word }}</span>
          <span aria-hidden="true">
            <span v-for="(char, i) in project.word" :key="i" class="index__char" :style="{ '--i': i }">{{ char }}</span>
          </span>
        </NuxtLinkLocale>
        <span class="index__leader" aria-hidden="true" />
        <span v-if="filled(project.meaning)" class="index__gloss">‘{{ project.meaning }}’</span>
      </span>
      <p class="index__desc gloss-sub">{{ project.description }}</p>
    </li>
  </ul>
</template>

<style scoped>
.index {
  max-inline-size: var(--content-width);
  container-type: inline-size;
  --plate-size: 1.5rem;
}

.index__item {
  position: relative;
  padding-block: var(--space-2);
}

.index__line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--space-2);
}

.index__plate {
  flex: none;
  align-self: center;
  inline-size: var(--plate-size);
  block-size: var(--plate-size);
  object-fit: contain;
  filter: grayscale(1);
  opacity: 0.6;
  transition: filter 400ms var(--ease-out), opacity 400ms var(--ease-out);
}

.index__word {
  font-family: var(--font-heading);
  font-size: 1.25em;
  font-weight: var(--heading-weight);
  line-height: 1.2;
  color: var(--fg);
  text-decoration: none;
}

/* The word's link covers its whole row, so the row is one target. */
.index__word::after {
  content: '';
  position: absolute;
  inset: 0;
}

.index__leader {
  flex: 1;
  min-inline-size: var(--space-4);
  overflow: hidden;
  white-space: nowrap;
  color: var(--muted);
  opacity: 0.75;
}

.index__leader::before {
  content: '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .';
}

.index__gloss {
  color: var(--muted);
}

/* Too narrow for word, leader and meaning on one line (a long word with a
   long meaning, like tlachialoni): the meaning takes its own line under the
   word, as the description does, and the leader has nothing left to lead to. */
@container (width < 32rem) {
  .index__leader {
    display: none;
  }

  .index__gloss {
    flex-basis: 100%;
    padding-inline-start: calc(var(--plate-size) + var(--space-2));
    padding-block-start: var(--space-1);
  }
}

/* Indented to start under the word, past the plate. */
.index__desc {
  margin: 0;
  padding-block-start: var(--space-2);
  padding-inline-start: calc(var(--plate-size) + var(--space-2));
}

.index__item:is(:hover, :focus-within) .index__plate {
  filter: none;
  opacity: 1;
}

/*
 * The lexicon's lean (ProjectLexicon.vue), letter by letter: each axis is its
 * own registered property so CRSV can flip early, where the motion hides it.
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

.index__word {
  --slnt: 0;
  --casl: var(--heading-casual);
  --crsv: 0;
}

.index__item:is(:hover, :focus-within) .index__word {
  --slnt: -15;
  --casl: 1;
  --crsv: 1;
}

/* Leaving: quick and light. */
.index__char {
  font-variation-settings: 'CASL' var(--casl), 'CRSV' var(--crsv), 'slnt' var(--slnt);
  transition:
    --slnt 450ms var(--ease-out),
    --casl 450ms var(--ease-out),
    --crsv 0ms;
  transition-delay: calc(var(--i) * 30ms);
}

/* Arriving: the lean starts at once and settles slowly. */
.index__item:is(:hover, :focus-within) .index__char {
  transition:
    --slnt 600ms var(--ease-out),
    --casl 600ms var(--ease-out),
    --crsv 0ms;
  transition-delay:
    calc(var(--i) * 35ms),
    calc(var(--i) * 35ms),
    calc(var(--i) * 35ms + 60ms);
}

@media (hover: none) {
  .index__plate {
    filter: none;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .index__plate {
    transition-duration: 0ms;
  }

  /* Same end state, no ripple. */
  .index__char,
  .index__item:is(:hover, :focus-within) .index__char {
    transition-duration: 150ms, 150ms, 0ms;
    transition-delay: 0ms;
  }
}
</style>
