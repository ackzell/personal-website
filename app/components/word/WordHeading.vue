<script setup lang="ts">
defineProps<{
  word: string
  pronunciation: string
  meaning: string
}>()
</script>

<template>
  <header grid gap="tight">
    <h1 text="[2.5rem]" lang="nah">{{ word }}</h1>
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
