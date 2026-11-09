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

// The page ends where the featured project sits at the top: its room is a
// screen less the scroll padding above and everything below it (next stop,
// footer), measured as those change.
const currently = useTemplateRef<HTMLElement>('currently')
function fitCurrently() {
  const el = currently.value
  if (!el) return
  const root = document.documentElement
  const below = root.scrollHeight - (el.getBoundingClientRect().bottom + window.scrollY)
  const above = Number.parseFloat(getComputedStyle(root).scrollPaddingTop) || 0
  const room = Math.max(0, Math.round(below + above))
  // Setting it resizes the page, which measures again; sub-pixel rounding
  // (phones) would flip it a pixel each pass, so small changes are ignored.
  if (Math.abs(room - lastRoom) <= 1) return
  lastRoom = room
  el.style.setProperty('--currently-room', `${room}px`)
}
let lastRoom = -2
if (import.meta.client) useResizeObserver(document.body, fitCurrently)

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

    <section v-if="featured" id="currently" ref="currently" aria-labelledby="featured-heading">
      <h2 id="featured-heading" track="wide" class="running-head">{{ $t('home.featured') }}</h2>
      <ProjectLexicon :projects="[featured]" />
    </section>
  </div>
</template>

<style scoped>
/* The last section, with what follows it, fills a screen exactly, so its anchor
   lands it at the top and the page can't scroll past into empty room. */
/* Proximity, not mandatory: scrolling settles on it only when it comes near,
   so the long timeline above still scrolls freely. */
:global(:root:has(#currently)) {
  scroll-snap-type: y proximity;
}
#currently {
  scroll-snap-align: start;
  /* Three times a section's gap: the timeline ends in open room before what's next. */
  margin-top: calc(var(--gap-section) * 3);
  min-block-size: calc(100svh - var(--currently-room, var(--header-height, 0px) + var(--section-index-height, 0px)));
  /* Its label and project sit together in the middle of that room. */
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
