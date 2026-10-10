<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({ title: () => t('about.title') })
</script>

<template>
  <div class="page">
    <h1>{{ $t('about.title') }}</h1>
    <p>{{ $t('placeholder') }}</p>
  </div>
</template>
