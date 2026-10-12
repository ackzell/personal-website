<script setup lang="ts">
/*
 * Sticky, so the navigation is always in reach. Anchored scrolls (the skip
 * link, in-page links) stop below it: its height is published as
 * --header-height for scroll-padding-top in main.css. It changes when the
 * mobile map opens, hence the observer.
 */
const header = useTemplateRef<HTMLElement>('header')
let observer: ResizeObserver | undefined

onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    const height = entry?.borderBoxSize[0]?.blockSize ?? 0
    document.documentElement.style.setProperty('--header-height', `${height}px`)
  })
  if (header.value) observer.observe(header.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <!-- The stage color behind it, so the page scrolls under, not through. -->
  <header ref="header" class="site-header" sticky top="0" z="10" bg="bg" flex="~ wrap" items="center" gap="y-group x-6"
    px="track-wide" py="5" border="none">
    <NuxtLinkLocale to="/" class="text-fg" typeset="code" decoration="none">{{ $t('site.name') }}</NuxtLinkLocale>
    <SiteLocaleSwitch ml="auto" />
    <!-- Its own row: the band spans the wide track, fields edge to edge. -->
    <SiteFlagNav w="full" />
  </header>
</template>
