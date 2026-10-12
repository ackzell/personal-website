<template>
  <header flex="~ wrap" items="center" gap="y-group x-6" px="track-wide" py="5" border="none">
    <NuxtLinkLocale to="/" class="text-fg" typeset="code" decoration="none">{{ $t('site.name') }}</NuxtLinkLocale>
    <SiteLocaleSwitch ml="auto" />
    <!-- Its own row: the band spans the wide track, fields edge to edge. -->
    <SiteFlagNav w="full" />
  </header>
</template>
