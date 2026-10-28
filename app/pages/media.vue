<script setup lang="ts">
const { t } = useI18n()
const { data: videos } = await useVideoSeries()
const { data: podcast } = await usePodcastSeasons()

useSeoMeta({ title: () => t('media.title') })
</script>

<template>
  <div class="page">
    <h1 class="running-head">{{ $t('media.title') }}</h1>

    <MediaDoors v-if="videos?.length && podcast?.seasons.length" :videos="videos" :podcast="podcast.seasons" track="wide" mt="block" />
  </div>
</template>
