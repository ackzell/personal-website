<script setup lang="ts">
withDefaults(defineProps<{ project: Project; headingLevel?: 2 | 3 }>(), { headingLevel: 2 })
</script>

<template>
  <article class="project-card">
    <component :is="`h${headingLevel}`" class="project-card__word">
      <NuxtLinkLocale :to="`/projects/${project.slug}`" lang="nah">{{ project.word }}</NuxtLinkLocale>
    </component>
    <p class="project-card__meaning">{{ project.meaning }}</p>
    <p class="project-card__title">{{ project.title }}</p>
    <p>{{ project.description }}</p>
    <ProjectStatus :status="project.status" />
  </article>
</template>
