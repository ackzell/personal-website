<template>
  <header flex="~ wrap" items="center" gap="y-tight x-6" px="track-wide" py="5" border="b solid line">
    <NuxtLinkLocale to="/" typeset="heading" text="fg" decoration="none">{{ $t('site.name') }}</NuxtLinkLocale>
    <SiteNav />
    <SiteLocaleSwitch />
  </header>
</template>
