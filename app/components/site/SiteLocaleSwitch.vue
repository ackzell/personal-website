<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div class="locale-switch" role="group" :aria-label="$t('site.language')">
    <NuxtLink
      v-for="item in locales"
      :key="item.code"
      :to="switchLocalePath(item.code)"
      :lang="item.language"
      :hreflang="item.language"
      :aria-current="item.code === locale ? 'true' : undefined"
    >
      {{ item.name }}
    </NuxtLink>
  </div>
</template>
