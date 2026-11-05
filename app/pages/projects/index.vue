<script setup lang="ts">
const { t } = useI18n()
const { data: projects } = await useProjects()

usePageSeo(() => ({ title: t('projects.title'), description: t('projects.description') }))
</script>

<template>
  <div class="page">
    <!-- The title is a running head, like a dictionary's: the headwords below
         are the content, so the label stays quiet. -->
    <h1 track="wide" class="running-head">{{ $t('projects.title') }}</h1>
    <p track="wide" max-w="[var(--content-width)]" text="sm">{{ $t('projects.intro') }}</p>
    <!-- Two columns once both fit a long headword (tlachialoni) at full size. -->
    <ProjectLexicon v-if="projects" :projects="projects" stagger track="wide" mt="block" lg="columns-2" />
  </div>
</template>
