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

const related = computed(() =>
  (part.value?.related ?? [])
    .map((relatedSlug) => projects.value?.find((p) => p.slug === relatedSlug))
    .filter((p) => p !== undefined),
)

// A part installs as its project does, unless it says otherwise.
const facts = computed(() => part.value && {
  ...part.value,
  links: {
    marketplace: project.value?.links.marketplace,
    openvsx: project.value?.links.openvsx,
    ...part.value.links,
  },
})

const siblings = computed(() => parts.value?.filter((p) => p.slug !== partSlug.value) ?? [])

// The same row as the project page, with its family last.
const sections = computed(() => [
  { id: 'overview', label: t('projects.index.overview') },
  { id: 'details', label: t('projects.index.details') },
  { id: 'story', label: t('projects.index.story') },
  ...(siblings.value.length ? [{ id: 'also', label: t('projects.alsoIn', { word: project.value?.word }) }] : []),
  ...(related.value.length ? [{ id: 'related', label: t('projects.related') }] : []),
])

usePageSeo(() => ({
  title: `${part.value?.title} · ${project.value?.title}`,
  description: part.value?.description,
  entry: { heading: part.value?.title, parent: project.value?.title },
}))
</script>

<template>
  <ProjectPage v-if="project && part" :crumbs="[
    { label: t('projects.title'), to: '/projects' },
    { label: project.word, to: `/projects/${project.slug}`, lang: 'nah' },
    { label: part.title },
  ]">
    <SiteSectionIndex :items="sections" layout="row" />

    <!-- The family's headword, with its mark, over the part's name, the way a
         sub-entry sits under its headword. Word and mark keep their project
         page size and travel names, so from the project page the word holds
         still while the plate shrinks into the margin beside it. -->
    <header id="overview" class="part-head" pt="block">
      <ProjectSticker v-if="project.logo" class="part-head__plate" :src="project.logo"
        :style="plateTransition(project.slug)" />
      <NuxtLinkLocale :to="`/projects/${project.slug}`" class="part-head__family text-headword" typeset="heading"
        lang="nah"><span :style="wordTransition(project.slug)">{{ project.word }}</span></NuxtLinkLocale>
      <!-- Set as the parts list's names end their hover lean, so the name
           arrives here the way it left the list; it travels from that row. -->
      <h1 class="part-head__title" typeset="heading">
        <span class="part-head__slash" aria-hidden="true">/</span><span
          :style="partTransition(project.slug, part.slug)">{{ part.title }}</span>
      </h1>
    </header>

    <p class="gloss" mt="tight">{{ part.description }}</p>

    <ProjectLedger v-if="facts" id="details" :project="facts" mt="block" />

    <ContentRenderer v-if="page" id="story" :value="page" class="prose story" />

    <section v-if="siblings.length" id="also" aria-labelledby="siblings-heading" mt="section">
      <h2 id="siblings-heading" mb="group" class="running-head">{{ t('projects.alsoIn', { word: project.word }) }}</h2>
      <ProjectParts :parts="siblings" />
    </section>

    <section v-if="related.length" id="related" aria-labelledby="related-heading" mt="section">
      <h2 id="related-heading" mb="group" class="running-head">{{ t('projects.related') }}</h2>
      <ProjectIndex :projects="related" />
    </section>
  </ProjectPage>
</template>

<style scoped>
/* Mark in the margin, spanning both lines; headword over sub-entry beside it. */
.part-head {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  column-gap: var(--space-5);
}

.part-head__plate {
  grid-row: span 2;
  inline-size: clamp(4rem, 9vw, 6rem);
  block-size: auto;
}

.part-head__family {
  justify-self: start;
  color: var(--heading);
  text-decoration: none;
  transition: color 200ms var(--ease-out);
}

.part-head__family:hover {
  color: var(--accent);
}

.part-head__title {
  grid-column: 2;
  margin: var(--space-2) 0 0;
  font-size: var(--subentry-size);
  line-height: 1.2;
  font-variation-settings: 'CASL' 1, 'CRSV' 1, 'slnt' -15;
}

.part-head__slash {
  margin-inline-end: 0.2em;
  color: var(--muted);
  font-variation-settings: 'CASL' 0, 'slnt' 0;
}

/* Without a mark the headword and sub-entry take the whole row. */
.part-head:not(:has(.part-head__plate)) > * {
  grid-column: 1 / -1;
}
</style>
