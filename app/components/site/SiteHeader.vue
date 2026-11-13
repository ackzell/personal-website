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

// The brand introduces its owner: it arrives as the name and decodes into the
// domain, once per load (the header outlives page changes), and decodes back
// to the name while a mouse rests on it or it has focus. Touch never hovers,
// so a tap only goes home. On a first visit it counts from its own arrival.
const intro = ref(true)
const over = ref(false)
const hover = (event: PointerEvent, on: boolean) => {
  if (event.pointerType === 'mouse') over.value = on
}
onMounted(() => setTimeout(() => (intro.value = false), introLeft() + 1600))

// Heard as the bottom stops are: a departures board turning over, one row on
// the scramble's timing (SiteScrambleText), panned to where the brand sits.
const { t } = useI18n()
const brand = computed(() => (intro.value || over.value ? t('home.title') : t('site.name')))
const reduceMotion = usePreferredReducedMotion()
watch(brand, (to, from) => {
  if (reduceMotion.value === 'reduce') return
  soundBoard([{ at: 0, chars: Math.max(to.length, from.length), step: 1 / 40, settle: 0.3, pan: -0.8 }])
})
</script>

<template>
  <!-- The stage color behind it, so the page scrolls under, not through. -->
  <header ref="header" class="site-header" data-stick sticky z="10" bg="bg" flex="~ wrap" items="center" gap="y-group x-6"
    px="track-wide" pt="3" pb="2 sm:4" border="none">
    <SiteMarkLayer clipped />
    <NuxtLinkLocale to="/" class="text-fg" typeset="code" decoration="none"
      @pointerenter="hover($event, true)" @pointerleave="hover($event, false)" @focus="over = true" @blur="over = false">
      <SiteScrambleText :text="brand" />
    </NuxtLinkLocale>
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
