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

    <p class="project__description">{{ project.description }}</p>

    <!-- The facts, from metadata: the scan path. The story below is the
         owner's, composed per project from the Media* blocks. -->
    <ProjectLedger :project="project" mt="block" />

    <ContentRenderer v-if="page" :value="page" class="prose story" />

    <!-- A family of parts: each carries its own page, so this one stays an
         overview. -->
    <section v-if="parts?.length" aria-labelledby="parts-heading" mt="section">
      <h2 id="parts-heading" mb="group" class="running-head">{{ t('projects.parts') }}</h2>
      <ProjectParts :parts="parts" />
    </section>

    <section v-if="related.length" aria-labelledby="related-heading" mt="section">
      <!-- A running head, like the projects page title: the words below are the content. -->
      <h2 id="related-heading" mb="group" class="running-head">{{ t('projects.related') }}</h2>
      <ProjectIndex :projects="related" />
    </section>
  </ProjectPage>
</template>
