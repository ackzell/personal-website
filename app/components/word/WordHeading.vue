<script setup lang="ts">
defineProps<{
  slug: string
  word: string
  pronunciation: string
  meaning: string
  status?: ProjectStatus
  /** The project's mark; shown large above the word, like the home mark. */
  logo?: string
  /** The mark for the light scheme; `logo` is for the dark one. */
  logoLight?: string
}>()
</script>

<template>
  <!-- The same word line as the lexicon entry it came from, with extra room
       above so the entry opens clear of the header band. -->
  <header class="word-heading" grid track="wide" pt="block">
    <!-- Decorative: the word names the project. The same plate as the lexicon
         entry's, so it travels here with the word and grows into place. -->
    <img v-if="logo" class="word-heading__plate" :src="logo" alt="" width="320" height="320" decoding="async"
      :data-scheme="logoLight ? 'dark' : undefined" :style="plateTransition(slug)">
    <img v-if="logo && logoLight" class="word-heading__plate" :src="logoLight" alt="" width="320" height="320"
      decoding="async" data-scheme="light" :style="plateTransition(slug)">
    <WordLine :pronunciation="pronunciation" :meaning="meaning" :status="status">
      <h1 class="text-headword" lang="nah">
        <span :style="wordTransition(slug)">{{ word }}</span>
      </h1>
    </WordLine>
  </header>
</template>

<style scoped>
/* The mark leads the page, centered, then the word line below it at the
   same distance the home intro keeps between its mark and the name. */
.word-heading__plate {
  justify-self: center;
  inline-size: clamp(8rem, 36vw, 20rem);
  block-size: auto;
  margin-block-end: clamp(var(--gap-block), 100vw, 6rem);
}
</style>
