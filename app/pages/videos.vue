<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({ title: () => t('videos.title') })
</script>

<template>
  <div class="page">
    <h1>{{ $t('videos.title') }}</h1>
    <p>{{ $t('videos.intro') }}</p>
    <p>{{ $t('placeholder') }}</p>
  </div>
</template>
