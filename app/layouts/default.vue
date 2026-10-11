<script setup lang="ts">
const section = useSection()

useHead({ htmlAttrs: { 'data-section': section } })
</script>

<template>
  <div class="site">
    <a href="#main" class="skip-link">{{ $t('site.skipToContent') }}</a>
    <SiteHeader />
    <main id="main" tabindex="-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
