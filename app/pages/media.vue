<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({ title: () => t('media.title') })
</script>

<template>
  <div class="page">
    <h1 class="running-head">{{ $t('media.title') }}</h1>

    <section aria-labelledby="videos-heading">
      <h2 id="videos-heading">{{ $t('videos.title') }}</h2>
      <p>{{ $t('videos.intro') }}</p>
      <NuxtLinkLocale :to="'/videos'">{{ $t('videos.title') }}</NuxtLinkLocale>
    </section>

    <section aria-labelledby="podcast-heading">
      <h2 id="podcast-heading">{{ $t('podcast.title') }}</h2>
      <p>{{ $t('podcast.intro') }}</p>
      <NuxtLinkLocale :to="'/podcast'">{{ $t('podcast.title') }}</NuxtLinkLocale>
    </section>
  </div>
</template>
