<template>
  <header flex="~ wrap" items="center" gap="y-tight x-6" px="track-wide" py="5" border="none">
    <NuxtLinkLocale to="/" class="text-fg" typeset="heading" decoration="none">{{ $t('site.name') }}</NuxtLinkLocale>
    <SiteNav />
    <SiteLocaleSwitch />
  </header>
</template>
