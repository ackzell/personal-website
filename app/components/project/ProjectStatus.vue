<script setup lang="ts">
defineProps<{ status: ProjectStatus }>()
</script>

<template>
  <span text="[0.8rem]" uppercase tracking="[0.08em]" :data-status="status">{{ $t(`projects.status.${status}`) }}</span>
</template>
