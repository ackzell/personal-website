<script setup lang="ts">
const section = useSection()

useHead({ htmlAttrs: { 'data-section': section } })

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
