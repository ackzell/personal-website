<script setup lang="ts">
const { t } = useI18n()
const { data: projects } = await useProjects()

useSeoMeta({ title: () => t('projects.title'), description: () => t('projects.intro') })
</script>

<template>
  <div class="page">
    <h1>{{ $t('projects.title') }}</h1>
    <p>{{ $t('projects.intro') }}</p>
    <ProjectCard v-for="project in projects" :key="project.slug" :project="project" />
  </div>
</template>
