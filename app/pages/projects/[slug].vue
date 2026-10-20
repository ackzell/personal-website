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
  <!-- The entry, then its trail pinned to the bottom of the page, just above
       the footer, however short the entry is. -->
  <div v-if="project" class="project-page">
    <article class="page project">
      <WordHeading :slug="project.slug" :word="project.word" :pronunciation="project.pronunciation" :meaning="project.meaning" :status="project.status" :logo="project.logo" />

      <p class="project__title">{{ project.title }}</p>
      <p class="project__description">{{ project.description }}</p>

      <ul v-if="project.repos.length" class="project__repos">
        <li v-for="repo in project.repos" :key="repo">
          <a :href="`https://github.com/${repo}`">{{ repo }}</a>
        </li>
      </ul>

      <ContentRenderer v-if="page" :value="page" class="prose" />

      <section v-if="related.length" aria-labelledby="related-heading">
        <h2 id="related-heading">{{ t('projects.related') }}</h2>
        <ProjectLexicon :projects="related" />
      </section>
    </article>

    <!-- The flag band already says where you are; the trail closes the entry
         instead, as the way back once you've read it. -->
    <nav class="project-page__trail" aria-label="Breadcrumb" px="track-wide">
      <ol flex gap="tight" p="0" m="0" list="none" text="sm">
        <li><NuxtLinkLocale to="/projects">{{ t('projects.title') }}</NuxtLinkLocale></li>
        <li flex gap="tight">
          <span aria-hidden="true" text="muted">/</span>
          <span aria-current="page" lang="nah">{{ project.word }}</span>
        </li>
      </ol>
    </nav>
  </div>
</template>

<style scoped>
/* <main> grows to fill the screen (main.css); here it also lays its page out
   as a column, so the trail can take the space left under a short entry. */
:global(main:has(> .project-page)) {
  display: flex;
  flex-direction: column;
}
.project-page {
  position: relative;
  flex: 1;
}
/* Out of flow, inside the entry's own bottom padding (--gap-section), so the
   trail never adds height to the page. */
.project-page__trail {
  position: absolute;
  inset-inline: 0;
  bottom: var(--gap-group);
}

/* Small screens: pinned to the viewport's bottom edge like the social rail,
   stopping short of it on the inline end. */
@media (width < 40rem) {
  .project-page__trail {
    position: fixed;
    inset-inline: 0 var(--rail-width);
    bottom: 0;
    padding-block: var(--space-2);
    background: var(--bg);
  }
}
</style>
