<script setup lang="ts">
const { t } = useI18n()
const { data: categories } = await useUses()

usePageSeo(() => ({ title: t('uses.title'), description: t('uses.description') }))
</script>

<template>
  <div class="page page-enter">
    <!-- A running head, as on Contributions: the tables are the content. -->
    <h1 track="wide" class="running-head">{{ $t('uses.title') }}</h1>
    <i18n-t v-if="$t('uses.intro')" keypath="uses.intro" tag="p" scope="global" track="wide" max-w="[var(--content-width)]"
      text="sm" data-own-entrance>
      <template #usesTech><a href="https://uses.tech">uses.tech</a></template>
    </i18n-t>
    <UsesTables v-if="categories?.length" :categories="categories" track="wide" mt="block" />
  </div>
</template>
