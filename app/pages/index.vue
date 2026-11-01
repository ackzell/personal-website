<script setup lang="ts">
const { t } = useI18n()
const [{ data: projects }, { data: roles }, { data: recognition }] = await Promise.all([
  useProjects(),
  useExperience(),
  useRecognition(),
])

const featured = computed(() => projects.value?.find((project) => project.featured))

// The running head in the margin names the sections; their own headings are
// for assistive tech only.
const sections = computed(() => [
  { id: 'about', label: t('home.bio') },
  ...(roles.value?.length ? [{ id: 'experience', label: t('home.timeline') }] : []),
  ...(featured.value ? [{ id: 'currently', label: t('home.featured') }] : []),
])

useSeoMeta({ title: '', description: () => t('home.intro') })
</script>

<template>
  <div class="page">
    <SiteSectionIndex :items="sections" />

    <!-- The name already heads this one, set its own way, so its label is for assistive tech only. -->
    <section id="about" :aria-label="$t('home.bio')">
      <HomeIntro :title="$t('home.title')" :text="$t('home.intro')" />
    </section>

    <section id="experience" aria-labelledby="timeline-heading">
      <HomeExperience v-if="roles?.length" :title="$t('home.timeline')" :roles="roles"
        :recognition="recognition ?? []" />
    </section>

    <section v-if="featured" id="currently" aria-labelledby="featured-heading">
      <h2 id="featured-heading" class="sr-only">{{ $t('home.featured') }}</h2>
      <ProjectLexicon :projects="[featured]" />
    </section>
  </div>
</template>
