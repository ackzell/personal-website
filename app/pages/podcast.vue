<script setup lang="ts">
const { t } = useI18n()
const { data: podcast } = await usePodcastSeasons()

useSeoMeta({ title: () => t('podcast.title') })
</script>

<template>
  <div class="page">
    <h1 class="text-headword" typeset="heading" m="0"><span :style="mediaTransition('podcast')">{{ $t('podcast.title') }}</span></h1>
    <p>{{ $t('podcast.intro') }}</p>
    <p v-if="podcast?.note">{{ podcast.note }}</p>

    <GuideSeries v-if="podcast?.seasons.length" :series="podcast.seasons" track="wide" mt="section" />
    <p v-else>{{ $t('placeholder') }}</p>

    <p mt="section"><a href="https://mytypeof.dev">{{ $t('podcast.rest') }}</a></p>
  </div>
</template>
