<script setup lang="ts">
const { t } = useI18n()
const { data: projects } = await useProjects()

const featured = computed(() => projects.value?.find((project) => project.featured))
const others = computed(() => projects.value?.filter((project) => !project.featured) ?? [])

useSeoMeta({ title: '', description: () => t('home.intro') })
</script>

<template>
  <div class="page">
    <section class="home-intro">
      <h1>{{ $t('home.title') }}</h1>
      <p>{{ $t('home.intro') }}</p>
    </section>

    <section v-if="featured" aria-labelledby="featured-heading">
      <h2 id="featured-heading">{{ $t('home.featured') }}</h2>
      <ProjectCard :project="featured" :heading-level="3" />
    </section>

    <section aria-labelledby="projects-heading">
      <h2 id="projects-heading">{{ $t('home.projects') }}</h2>
      <ProjectCard v-for="project in others" :key="project.slug" :project="project" :heading-level="3" />
      <NuxtLinkLocale :to="'/projects'">{{ $t('home.allProjects') }}</NuxtLinkLocale>
    </section>

    <section aria-labelledby="podcast-heading">
      <h2 id="podcast-heading">{{ $t('podcast.title') }}</h2>
      <p>{{ $t('podcast.intro') }}</p>
      <NuxtLinkLocale :to="'/podcast'">{{ $t('podcast.title') }}</NuxtLinkLocale>
    </section>

    <section aria-labelledby="videos-heading">
      <h2 id="videos-heading">{{ $t('videos.title') }}</h2>
      <p>{{ $t('videos.intro') }}</p>
      <NuxtLinkLocale :to="'/videos'">{{ $t('videos.title') }}</NuxtLinkLocale>
    </section>
  </div>
</template>
