<script setup lang="ts">
/*
 * The switch as the attribute it sets: lang="en", one language at a time.
 * The value is a link to the next language; on the switch it decodes into
 * the new one with the rest of the page (plugins/locale-scramble.client.ts).
 */
const { locale, locales, defaultLocale, loadLocaleMessages } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()
const error = useError()

const next = computed(() => {
  const i = locales.value.findIndex((item) => item.code === locale.value)
  return locales.value[(i + 1) % locales.value.length]!
})

// A path no page matches has no route to switch, so its prefix is swapped by hand.
const prefix = (code: string) => (code === defaultLocale ? '' : `/${code}`)
const to = computed(() => switchLocalePath(next.value.code)
  || prefix(next.value.code) + (route.fullPath.slice(prefix(locale.value).length) || '/'))

/*
 * On an error page (the 404's game), going to the other language's URL would
 * only rebuild the error, game lost, still in the old language. The language
 * changes in place instead and the address follows, so a reload keeps it.
 */
async function press(event: MouseEvent) {
  haptic('language')
  if (!error.value) return
  event.preventDefault()
  const { code } = next.value
  const path = to.value
  await loadLocaleMessages(code)
  locale.value = code
  history.replaceState(history.state, '', path)
}
</script>

<template>
  <!-- The link reads as the language it switches to, in that language. -->
  <SiteAttrSwitch name="lang">
    <NuxtLink :to :lang="next.language" :hreflang="next.language" :title="next.name" @click="press">
      <span class="sr-only">{{ next.name }}</span>
      <span aria-hidden="true">{{ locale }}</span>
    </NuxtLink>
  </SiteAttrSwitch>
</template>
