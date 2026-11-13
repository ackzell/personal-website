<script setup lang="ts">
const { t } = useI18n()
const { data: videos } = await useVideoSeries()
const { data: podcast } = await usePodcastSeasons()

usePageSeo(() => ({ title: t('media.title'), description: t('media.description') }))
</script>

<template>
  <div class="page media-page">
    <!-- A running head, as on projects: the timeline below is the content. -->
    <h1 track="wide" class="running-head">{{ $t('media.title') }}</h1>
    <p v-if="$t('media.intro')" track="wide" max-w="[var(--content-width)]" text="sm">{{ $t('media.intro') }}</p>

    <MediaTimeline v-if="videos?.length && podcast?.seasons.length" class="media-page__timeline" :videos="videos" :podcast="podcast.seasons" track="wide" mt="block" />
  </div>
</template>

<style scoped>
/* The page fills main, top to footer, and the timeline sits in the middle
   of what the title leaves; the title stays put at the top. */
:global(main:has(> .media-page)) {
  display: flex;
  flex-direction: column;
}

/* The same space below as above, or the section gap .page leaves before
   the footer would push the middle up. */
.media-page {
  flex: 1;
  grid-template-rows: auto auto 1fr;
  align-content: stretch;
  padding-block-end: var(--gap-block);
}

.media-page__timeline {
  grid-row: -2;
  align-self: center;
}
</style>
