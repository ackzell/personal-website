<script setup lang="ts">
defineProps<{
  word: string
  pronunciation: string
  meaning: string
}>()
</script>

<template>
  <header class="word-heading">
    <h1 class="word-heading__word" lang="nah">{{ word }}</h1>
    <dl class="word-heading__details">
      <div>
        <dt>{{ $t('projects.pronunciation') }}</dt>
        <dd>/{{ pronunciation }}/</dd>
      </div>
      <div>
        <dt>{{ $t('projects.meaning') }}</dt>
        <dd>{{ meaning }}</dd>
      </div>
    </dl>
  </header>
</template>
