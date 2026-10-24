<script setup lang="ts">
const { t } = useI18n()
const [{ data: projects }, { data: roles }, { data: recognition }] = await Promise.all([
  useProjects(),
  useExperience(),
  useRecognition(),
])

const featured = computed(() => projects.value?.find((project) => project.featured))

useSeoMeta({ title: '', description: () => t('home.intro') })
</script>

<template>
  <div class="page">
    <section>
      <HomeIntro :title="$t('home.title')" :text="$t('home.intro')" />
    </section>

    <section aria-labelledby="timeline-heading">
      <HomeExperience v-if="roles?.length" :title="$t('home.timeline')" :roles="roles" :recognition="recognition ?? []" />
    </section>

    <section v-if="featured" aria-labelledby="featured-heading">
      <h2 id="featured-heading" class="running-head">{{ $t('home.featured') }}</h2>
      <ProjectLexicon :projects="[featured]" />
      <NuxtLinkLocale :to="'/projects'">{{ $t('home.allProjects') }}</NuxtLinkLocale>
    </section>
  </div>
</template>

