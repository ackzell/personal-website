<script setup lang="ts">
const { t } = useI18n()
const { data: series } = await useVideoSeries()

usePageSeo(() => ({ title: t('videos.title'), description: t('videos.intro') }))
</script>

<template>
  <div class="page page-enter">
    <h1 class="text-headword" typeset="heading" m="0"><span :style="mediaTransition('videos')">{{ $t('videos.title') }}</span></h1>
    <p>{{ $t('videos.intro') }}</p>

    <GuideSeries data-own-entrance v-if="series?.length" :series="series" track="wide" mt="section" />
    <p v-else>{{ $t('placeholder') }}</p>

    <p mt="section"><a href="https://www.youtube.com/@ackzell">{{ $t('videos.rest') }}</a></p>
  </div>
</template>
