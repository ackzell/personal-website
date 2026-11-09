<script setup lang="ts">
import { socialLinks } from '~/config/nav'

const { t } = useI18n()
const [{ data: projects }, { data: roles }, { data: recognition }] = await Promise.all([
  useProjects(),
  useExperience(),
  useRecognition(),
])

const featured = computed(() => projects.value?.find((project) => project.featured))

// The running head in the margin names the sections; their own headings are
// for assistive tech only, except the featured project's, which marks where
// the timeline ends.
const sections = computed(() => [
  { id: 'about', label: t('home.bio') },
  ...(roles.value?.length ? [{ id: 'experience', label: t('home.timeline') }] : []),
  ...(featured.value ? [{ id: 'currently', label: t('home.featured') }] : []),
])

usePageSeo(() => ({ title: t('home.title'), description: t('home.description') }))

const site = useSiteConfig()
useHead({
  script: [{
    type: 'application/ld+json',
    textContent: () => JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: t('site.name'), url: site.url },
        { '@type': 'Person', name: t('home.title'), url: site.url, sameAs: socialLinks.map((link) => link.href) },
      ],
    }),
  }],
})
</script>

<template>
  <div class="page">
    <SiteSectionIndex :items="sections" />

    <!-- The name already heads this one, set its own way, so its label is for assistive tech only. -->
    <section id="about" :aria-label="$t('home.bio')">
      <HomeIntro :title="$t('home.title')" :text="$t('home.intro', { years: new Date().getFullYear() - 2012 })" />
    </section>

    <section id="experience" aria-labelledby="timeline-heading">
      <HomeExperience v-if="roles?.length" :title="$t('home.timeline')" :roles="roles"
        :recognition="recognition ?? []" />
    </section>

    <section v-if="featured" id="currently" aria-labelledby="featured-heading">
      <h2 id="featured-heading" track="wide" class="running-head">{{ $t('home.featured') }}</h2>
      <ProjectLexicon :projects="[featured]" />
    </section>
  </div>
</template>

<style scoped>
/* The last section is at least a screen tall, so its anchor lands it at the
   top with empty room below rather than stopping short at the page's end. */
#currently {
  min-block-size: calc(100svh - var(--header-height, 0px) - var(--section-index-height, 0px));
}
</style>
