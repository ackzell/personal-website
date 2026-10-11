<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const [{ data: projects }, { data: page }] = await Promise.all([useProjects(), useProjectPage(slug)])

const index = computed(() => projects.value?.findIndex((p) => p.slug === slug.value) ?? -1)
const project = computed(() => projects.value?.[index.value])

if (!project.value || !page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
}

const previous = computed(() => projects.value?.[index.value - 1])
const next = computed(() => projects.value?.[index.value + 1])
const related = computed(() =>
  (project.value?.related ?? [])
    .map((relatedSlug) => projects.value?.find((p) => p.slug === relatedSlug))
    .filter((p) => p !== undefined),
)

useSeoMeta({
  title: () => project.value?.title,
  description: () => project.value?.description,
})
</script>

<template>
  <article v-if="project" class="page project">
    <nav aria-label="Breadcrumb" track="wide">
      <ol flex gap="tight" p="0" list="none" text="sm">
        <li><NuxtLinkLocale to="/projects">{{ t('projects.title') }}</NuxtLinkLocale></li>
        <li flex gap="tight">
          <span aria-hidden="true" text="muted">/</span>
          <span aria-current="page" lang="nah">{{ project.word }}</span>
        </li>
      </ol>
    </nav>

    <WordHeading :slug="project.slug" :word="project.word" :pronunciation="project.pronunciation" :meaning="project.meaning" />

    <p class="project__title">{{ project.title }}</p>
    <p class="project__description">{{ project.description }}</p>
    <ProjectStatus :status="project.status" />

    <ul v-if="project.repos.length" class="project__repos">
      <li v-for="repo in project.repos" :key="repo">
        <a :href="`https://github.com/${repo}`">{{ repo }}</a>
      </li>
    </ul>

    <ContentRenderer v-if="page" :value="page" class="prose" />

    <section v-if="related.length" aria-labelledby="related-heading">
      <h2 id="related-heading">{{ t('projects.related') }}</h2>
      <ProjectCard v-for="item in related" :key="item.slug" :project="item" :heading-level="3" />
    </section>

    <nav flex justify="between" gap="group" mt="section" :aria-label="t('projects.title')">
      <NuxtLinkLocale v-if="previous" :to="`/projects/${previous.slug}`" rel="prev">
        ← {{ t('projects.previous') }}: <span lang="nah">{{ previous.word }}</span>
      </NuxtLinkLocale>
      <NuxtLinkLocale v-if="next" :to="`/projects/${next.slug}`" rel="next" ml="auto">
        {{ t('projects.next') }}: <span lang="nah">{{ next.word }}</span> →
      </NuxtLinkLocale>
    </nav>
  </article>
</template>
