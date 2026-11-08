<script setup lang="ts">
/**
 * Amoxtli's table of contents, as far as it is written, placed from markdown:
 *
 *   ::media-chapters
 *   ::
 *
 * Read from the book's repository when the site is generated
 * (server/api/amoxtli-chapters.get.ts), so it grows with the book. Chapters
 * fold open as they do in the book's own menu, on a plain details element, so
 * it all works without JS. If GitHub can't be reached it just isn't there.
 */
const { locale, t } = useI18n()
const { data: book } = useFetch('/api/amoxtli-chapters')
const chapters = computed(() => book.value?.[locale.value] ?? [])

</script>

<template>
  <MediaShell v-if="chapters.length" class="media--chapters">
    <ul class="chapters" m="0" p="0" list="none">
      <li v-for="(chapter, i) in chapters" :key="chapter.title">
        <details class="chapter" :open="i === 0">
          <summary class="chapter__head" data-press="none" @click="haptic('fold')">
            <span class="chapter__fold i-iconoir-nav-arrow-right" aria-hidden="true" />
            <span class="chapter__title" typeset="heading">{{ chapter.title }}</span>
            <span class="chapter__count">
              <span aria-hidden="true">{{ chapter.lessons.length }}</span>
              <span class="sr-only">{{ t('projects.media.lessons', chapter.lessons.length) }}</span>
            </span>
          </summary>
          <ol class="chapter__lessons" m="0" p="0" list="none">
            <li v-for="lesson in chapter.lessons" :key="lesson.title" class="chapter__lesson">
              {{ lesson.title }}
              <span v-if="lesson.challenge" class="chapter__bolt i-iconoir-flash" role="img" :aria-label="t('projects.media.challenge')" />
            </li>
          </ol>
        </details>
      </li>
    </ul>
  </MediaShell>
</template>

<style scoped>
.chapters {
  max-inline-size: var(--content-width);
  border-block-start: 1px solid var(--line);
}

.chapter {
  border-block-end: 1px solid var(--line);
}

/* A full-width target, tall enough for a thumb. */
.chapter__head {
  display: flex;
  align-items: center;
  gap: 1ch;
  min-block-size: 2.75rem;
  cursor: pointer;
  list-style: none;
}

.chapter__head::-webkit-details-marker {
  display: none;
}

.chapter__fold {
  flex: none;
  color: var(--muted);
  transition: rotate 200ms var(--ease-out), color 200ms var(--ease-out);
}

.chapter[open] .chapter__fold {
  rotate: 90deg;
}

.chapter__title {
  font-size: var(--subentry-size);
  line-height: 1.2;
  transition: filter 0.25s var(--ease-out);
}

/* The press answers on the words alone, as words do (main.css "Press"), not
   the whole row: dimmed at once, easing back on release. */
.chapter__head:active .chapter__title {
  filter: opacity(0.55);
  transition-duration: 0s;
}

.chapter__count {
  margin-inline-start: auto;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.chapter__head:hover .chapter__fold {
  color: var(--accent);
}

/* The trunk and branches, drawn as under a project (ProjectParts.vue). */
.chapter__lessons {
  margin-inline-start: 0.5em;
  padding-block-end: var(--space-3);
}

.chapter__lesson {
  --stub: 0.8em;
  position: relative;
  padding-block: var(--space-1);
  padding-inline-start: 2.5ch;
  line-height: 1.3;
}

.chapter__lesson::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 1px;
  background: var(--muted);
}

.chapter__lesson:last-child::before {
  inset-block-end: auto;
  block-size: calc(var(--space-1) + var(--stub));
}

.chapter__lesson::after {
  content: '';
  position: absolute;
  inset-block-start: calc(var(--space-1) + var(--stub));
  inset-inline-start: 0;
  inline-size: 1.5ch;
  block-size: 1px;
  background: var(--muted);
}

.chapter__bolt {
  margin-inline-start: 0.25em;
  vertical-align: -0.1em;
  color: var(--accent);
}

/* Where the browser can animate to auto; the others just open. */
@media (prefers-reduced-motion: no-preference) {
  .chapter {
    interpolate-size: allow-keywords;
  }

  .chapter::details-content {
    block-size: 0;
    overflow: clip;
    transition: block-size 280ms var(--ease-out), content-visibility 280ms allow-discrete;
  }

  .chapter[open]::details-content {
    block-size: auto;
  }
}
</style>
