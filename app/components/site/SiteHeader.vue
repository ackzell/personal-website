<script setup lang="ts">
/*
 * Sticky, so the navigation is always in reach. Anchored scrolls (the skip
 * link, in-page links) stop below it: its height is published as
 * --header-height for scroll-padding-top in main.css. It changes with the
 * viewport and the locale's label widths, hence the observer.
 *
 * On small screens only the band stays: the brand row scrolls away. How far
 * the header sticks above the viewport is the band's offset inside it, less
 * the header's own top padding so the band keeps that room above it,
 * published as --header-tuck.
 */
const header = useTemplateRef<HTMLElement>('header')
usePublishedHeight(header, '--header-height')

useResizeObserver(header, () => {
  if (!header.value) return
  const nav = header.value.querySelector<HTMLElement>('.flag-nav')
  const room = Number.parseFloat(getComputedStyle(header.value).paddingTop)
  document.documentElement.style.setProperty('--header-tuck', `${Math.max((nav?.offsetTop ?? 0) - room, 0)}px`)
})
</script>

<template>
  <!-- The stage color behind it, so the page scrolls under, not through. -->
  <header ref="header" class="site-header" data-stick sticky z="10" bg="bg" flex="~ wrap" items="center" gap="y-group x-6"
    px="track-wide" pt="3" pb="2 sm:4" border="none">
    <SiteMarkLayer clipped />
    <NuxtLinkLocale to="/" class="text-fg" typeset="code" decoration="none">{{ $t('site.name') }}</NuxtLinkLocale>
    <!-- The settings, as attributes in a row. -->
    <div ml="auto" flex items="baseline" gap="4">
      <SiteSoundSwitch />
      <SiteLocaleSwitch />
    </div>
    <!-- Its own row: the band spans the wide track, fields edge to edge.
         Less padding under it on small screens: the links' tap height
         already leaves room below the labels. -->
    <SiteFlagNav w="full" />
  </header>
</template>
