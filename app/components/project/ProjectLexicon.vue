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
  <dl class="lexicon" grid gap="block" mt="0">
    <div v-for="project in projects" :key="project.slug" class="lexicon__entry" relative grid gap="tight">
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
          {{ project.word }}
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
/* The headword link covers its whole entry, so the entry is one target. */
.lexicon__headword::after {
  content: '';
  position: absolute;
  inset: calc(var(--gap-tight) * -1);
}

.lexicon__entry {
  transition: opacity 200ms var(--ease-out);
}

/* Spotlight: one entry in focus, the rest step back. */
.lexicon:has(.lexicon__entry:hover, .lexicon__headword:focus-visible) .lexicon__entry:not(:hover, :focus-within) {
  opacity: 0.4;
}
</style>
