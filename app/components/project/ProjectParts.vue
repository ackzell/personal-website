<script setup lang="ts">
/**
 * A project's parts, as the sub-entries under a dictionary headword: the
 * part's name, then what it is. Each row is one link to the part's page.
 * Hovering or focusing a row leans its name letter by letter, as the index's
 * words do (ProjectIndex.vue).
 */
defineProps<{ parts: ProjectPart[] }>()
</script>

<template>
  <ul class="parts" m="0" p="0" list="none">
    <li v-for="part in parts" :key="part.slug" class="parts__item">
      <NuxtLinkLocale :to="`/projects/${part.parent}/${part.slug}`" class="parts__name" typeset="heading">
        <!-- One span per letter so the lean ripples through the name.
             Assistive tech gets the whole name from the hidden copy. -->
        <span class="sr-only">{{ part.title }}</span>
        <span aria-hidden="true">
          <span v-for="(char, i) in part.title" :key="i" class="parts__char" :style="{ '--i': i }">{{ char }}</span>
        </span>
        <span class="parts__arrow i-iconoir-arrow-right" aria-hidden="true" />
      </NuxtLinkLocale>
      <p class="parts__desc">{{ part.description }}</p>
    </li>
  </ul>
</template>

<style scoped>
.parts {
  max-inline-size: var(--content-width);
}

.parts__item {
  position: relative;
  padding-block: var(--space-2);
}

.parts__name {
  font-size: 1.25em;
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

.parts__desc {
  margin: 0;
  padding-block-start: var(--space-1);
  font-size: 0.875em;
  color: var(--muted);
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
