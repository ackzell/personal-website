<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const [{ data: projects }, { data: page }, { data: parts }] = await Promise.all([
  useProjects(),
  useProjectPage(slug),
  useProjectParts(slug),
])

const index = computed(() => projects.value?.findIndex((p) => p.slug === slug.value) ?? -1)
const project = computed(() => projects.value?.[index.value])

if (!project.value || !page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
}

const related = computed(() =>
  (project.value?.related ?? [])
    // Never the project itself: its word is already named by the heading.
    .filter((relatedSlug) => relatedSlug !== slug.value)
    .map((relatedSlug) => projects.value?.find((p) => p.slug === relatedSlug))
    .filter((p) => p !== undefined),
)

useSeoMeta({
  title: () => project.value?.title,
  description: () => project.value?.description,
})
</script>

<template>
  <ProjectPage v-if="project"
    :crumbs="[{ label: t('projects.title'), to: '/projects' }, { label: project.word, lang: 'nah' }]">
    <WordHeading :slug="project.slug" :word="project.word" :pronunciation="project.pronunciation"
      :meaning="project.meaning" :status="project.status" :logo="project.logo" />

    <!-- The entry under its word, as a dictionary sets it: the definition,
         then the sub-entries. On the word's track, so with parts a trunk drops
         from under the word's first letter, runs beside the definition and
         branches into the parts. Each part carries its own page, so this one
         stays an overview. The tree says what it is; the heading is for
         assistive tech. -->
    <div class="entry" :class="{ 'entry--tree': parts?.length }" track="wide" mt="tight">
      <p class="project__description gloss" m="0">{{ project.description }}</p>
      <section v-if="parts?.length" aria-labelledby="parts-heading" mt="tight">
        <h2 id="parts-heading" class="sr-only">{{ t('projects.parts') }}</h2>
        <ProjectParts :parts="parts" rooted />
      </section>
    </div>

    <!-- The facts, from metadata: the scan path. The story below is the
         owner's, composed per project from the Media* blocks. -->
    <ProjectLedger :project="project" mt="block" />

    <ContentRenderer v-if="page" :value="page" class="prose story" />

    <section v-if="related.length" aria-labelledby="related-heading" mt="section">
      <!-- A running head, like the projects page title: the words below are the content. -->
      <h2 id="related-heading" mb="group" class="running-head">{{ t('projects.related') }}</h2>
      <ProjectIndex :projects="related" />
    </section>
  </ProjectPage>
</template>

<style scoped>
.project__description {
  max-inline-size: var(--content-width);
}

/* The trunk beside the definition: indented and drawn like the parts'
   (ProjectParts.vue), climbing the gap to the word above and running on to
   the first branch below. */
.entry--tree .project__description {
  position: relative;
  padding-inline-start: 2.5ch;
}

.entry--tree .project__description::before {
  content: '';
  position: absolute;
  inset-block: calc(-1 * var(--gap-tight)) 0;
  inset-inline-start: 0.5ch;
  inline-size: 1px;
  background: var(--muted);
}

/* Entrance: the trunk grows down from the word as the entry rises, on into
   the branches (ProjectParts.vue picks up where this ends). */
@media (prefers-reduced-motion: no-preference) {
  .entry--tree .project__description::before {
    animation: 300ms var(--ease-out) 400ms both tree-grow;
  }
}
</style>
