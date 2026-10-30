<script setup lang="ts">
const section = useSection()

useHead({ htmlAttrs: { 'data-section': section } })

// Every page change brings the new page in block by block, from its side.
usePageArrival()
// Touch: swipe sideways to walk the flag band's stops.
useSwipeNav()

const isDev = import.meta.dev
</script>

<template>
  <div class="site">
    <a href="#main" class="skip-link">{{ $t('site.skipToContent') }}</a>
    <SiteMark />
    <SiteHeader />
    <main id="main" tabindex="-1">
      <slot />
    </main>
    <SiteFooter />
    <DevGridOverlay v-if="isDev" />
  </div>
</template>
