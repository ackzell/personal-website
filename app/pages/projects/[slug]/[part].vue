<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const slug = computed(() => String(route.params.slug))
const partSlug = computed(() => String(route.params.part))

const [{ data: projects }, { data: parts }, { data: page }] = await Promise.all([
  useProjects(),
  useProjectParts(slug),
  useProjectPartPage(slug, partSlug),
])

const project = computed(() => projects.value?.find((p) => p.slug === slug.value))
const part = computed(() => parts.value?.find((p) => p.slug === partSlug.value))

if (!project.value || !part.value || !page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
}

const siblings = computed(() => parts.value?.filter((p) => p.slug !== partSlug.value) ?? [])

useSeoMeta({
  title: () => `${part.value?.title} · ${project.value?.title}`,
  description: () => part.value?.description,
})
</script>

<template>
  <ProjectPage v-if="project && part" :crumbs="[
    { label: t('projects.title'), to: '/projects' },
    { label: project.word, to: `/projects/${project.slug}`, lang: 'nah' },
    { label: part.title },
  ]">
    <!-- The family's word over the part's name, the way a sub-entry sits
         under its headword. The word travels here from the project page. -->
    <header>
      <NuxtLinkLocale :to="`/projects/${project.slug}`" class="part__family" typeset="heading" lang="nah"
        :style="wordTransition(project.slug)">{{ project.word }}</NuxtLinkLocale>
      <h1 class="part__title" typeset="heading">{{ part.title }}</h1>
    </header>

    <p class="project__description">{{ part.description }}</p>

    <ProjectLedger :project="part" mt="block" />

    <ContentRenderer v-if="page" :value="page" class="prose story" />

    <section v-if="siblings.length" aria-labelledby="siblings-heading" mt="section">
      <h2 id="siblings-heading" mb="group" class="running-head">{{ t('projects.alsoIn', { word: project.word }) }}</h2>
      <ProjectParts :parts="siblings" />
    </section>
  </ProjectPage>
</template>

<style scoped>
.part__family {
  display: inline-block;
  font-size: 1.25rem;
  line-height: 1.2;
  color: var(--muted);
  text-decoration: none;
}

.part__family:hover {
  color: var(--fg);
}

.part__title {
  margin: var(--space-1) 0 0;
  font-size: var(--headword-size);
  line-height: 1;
}
</style>
