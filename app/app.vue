<script setup lang="ts">
import { MotionConfig } from 'motion-v'

const { t } = useI18n()
const head = useLocaleHead({ seo: true })

useHead(() => ({
  htmlAttrs: { lang: head.value.htmlAttrs.lang },
  link: [
    ...head.value.link,
    { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
    { rel: 'manifest', href: '/site.webmanifest' },
  ],
  meta: [
    ...head.value.meta,
    { property: 'og:site_name', content: t('site.name') },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
  titleTemplate: (title) => (title ? `${title} · ${t('site.name')}` : t('site.name')),
}))
</script>

<template>
  <!-- Under reduced motion, Motion components drop their moves and keep only fades. -->
  <MotionConfig reduced-motion="user">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </MotionConfig>
</template>
