<script setup lang="ts">
defineProps<{
  slug: string
  word: string
  pronunciation: string
  meaning: string
}>()
</script>

<template>
  <header grid gap="tight" track="wide">
    <h1 class="text-headword" lang="nah">
      <span :style="wordTransition(slug)">{{ word }}</span>
    </h1>
    <dl flex="~ wrap" gap="y-1 x-8" text="muted">
      <div flex gap="tight">
        <dt class="after:content-[':']">{{ $t('projects.pronunciation') }}</dt>
        <dd text="fg">/{{ pronunciation }}/</dd>
      </div>
      <div flex gap="tight">
        <dt class="after:content-[':']">{{ $t('projects.meaning') }}</dt>
        <dd text="fg">{{ meaning }}</dd>
      </div>
    </dl>
  </header>
</template>
