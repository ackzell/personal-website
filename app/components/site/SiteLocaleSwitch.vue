<script setup lang="ts">
/*
 * The switch as the attribute it sets: lang="en", one language at a time.
 * The value is a link to the next language; on the switch it decodes into
 * the new one with the rest of the page (plugins/locale-scramble.client.ts).
 */
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const next = computed(() => {
  const i = locales.value.findIndex((item) => item.code === locale.value)
  return locales.value[(i + 1) % locales.value.length]!
})
</script>

<template>
  <!-- The link reads as the language it switches to, in that language. -->
  <SiteAttrSwitch name="lang">
    <NuxtLink :to="switchLocalePath(next.code)" :lang="next.language" :hreflang="next.language" :title="next.name"
      @click="haptic('language')">
      <span class="sr-only">{{ next.name }}</span>
      <span aria-hidden="true">{{ locale }}</span>
    </NuxtLink>
  </SiteAttrSwitch>
</template>
