<script setup lang="ts">
defineProps<{ status: ProjectStatus }>()
</script>

<template>
  <span class="project-status" :data-status="status">{{ $t(`projects.status.${status}`) }}</span>
</template>
