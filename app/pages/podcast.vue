<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({ title: () => t('podcast.title') })
</script>

<template>
  <div class="page">
    <h1>{{ $t('podcast.title') }}</h1>
    <p>{{ $t('podcast.intro') }}</p>
    <p>{{ $t('placeholder') }}</p>
  </div>
</template>
