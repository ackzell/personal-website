<script setup lang="ts">
const { t } = useI18n()
const { data: projects } = await useContributions()

// Every merged pull request, errata included.
const total = computed(() => projects.value?.reduce((n, project) => n + project.merges.length, 0) ?? 0)

useSeoMeta({ title: () => t('contributions.title') })
</script>

<template>
  <div class="page page-enter">
    <!-- A running head, as on Projects: the log is the content. -->
    <h1 track="wide" class="running-head">{{ $t('contributions.title') }}
      <span v-if="total" class="tabular-nums">({{ total }})</span>
    </h1>
    <ContributionGraph data-own-entrance v-if="projects" :projects="projects" mt="block" />
  </div>
</template>
