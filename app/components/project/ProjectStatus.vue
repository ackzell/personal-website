<script setup lang="ts">
defineProps<{ status: ProjectStatus }>()
</script>

<template>
  <span
    inline-block
    p="x-tight y-[0.1rem]"
    border="~ solid line"
    rounded="full"
    text="[0.8rem]"
    :data-status="status"
  >{{ $t(`projects.status.${status}`) }}</span>
</template>
