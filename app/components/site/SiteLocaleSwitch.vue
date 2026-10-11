<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div flex gap="3" text="sm" role="group" :aria-label="$t('site.language')">
    <NuxtLink
      v-for="item in locales"
      :key="item.code"
      :to="switchLocalePath(item.code)"
      :lang="item.language"
      :hreflang="item.language"
      :aria-current="item.code === locale ? 'true' : undefined"
      class="text-muted current:text-fg"
      decoration="none current:underline"
      underline-offset="[0.3em]"
    >
      {{ item.name }}
    </NuxtLink>
  </div>
</template>
