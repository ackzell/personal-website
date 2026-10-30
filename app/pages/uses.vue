<script setup lang="ts">
const { t } = useI18n()
const { data: categories } = await useUses()

useSeoMeta({ title: () => t('uses.title') })
</script>

<template>
  <div class="page page-enter">
    <!-- A running head, as on Contributions: the tables are the content. -->
    <h1 track="wide" class="running-head">{{ $t('uses.title') }}</h1>
    <p v-if="$t('uses.intro')">{{ $t('uses.intro') }}</p>
    <UsesTables v-if="categories?.length" :categories="categories" track="wide" mt="block" />
  </div>
</template>
