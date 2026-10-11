<script setup lang="ts">
const { t } = useI18n()
const { data: projects } = await useProjects()

const featured = computed(() => projects.value?.find((project) => project.featured))

useSeoMeta({ title: '', description: () => t('home.intro') })
</script>

<template>
  <div class="page">
    <section class="home-intro">
      <h1>{{ $t('home.title') }}</h1>
      <p>{{ $t('home.intro') }}</p>
    </section>

    <section aria-labelledby="timeline-heading">
      <h2 id="timeline-heading">{{ $t('home.timeline') }}</h2>
      <p>{{ $t('placeholder') }}</p>
    </section>

    <section v-if="featured" aria-labelledby="featured-heading">
      <h2 id="featured-heading">{{ $t('home.featured') }}</h2>
      <ProjectLexicon :projects="[featured]" />
      <NuxtLinkLocale :to="'/projects'">{{ $t('home.allProjects') }}</NuxtLinkLocale>
    </section>
  </div>
</template>
