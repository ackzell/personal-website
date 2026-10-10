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
