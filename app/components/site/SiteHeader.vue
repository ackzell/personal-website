<template>
  <header class="site-header">
    <NuxtLinkLocale to="/" class="site-header__name">{{ $t('site.name') }}</NuxtLinkLocale>
    <SiteNav />
    <SiteLocaleSwitch />
  </header>
</template>
