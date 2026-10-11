<script setup lang="ts">
const { t } = useI18n()
const { data: projects } = await useProjects()

useSeoMeta({ title: () => t('projects.title'), description: () => t('projects.intro') })
</script>

<template>
  <div class="page">
    <h1 track="wide">{{ $t('projects.title') }}</h1>
    <p track="wide" max-w="[var(--content-width)]">{{ $t('projects.intro') }}</p>
    <ProjectLexicon v-if="projects" :projects="projects" track="wide" mt="block" />
  </div>
</template>
