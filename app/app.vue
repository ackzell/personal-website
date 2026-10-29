<script setup lang="ts">
import { MotionConfig } from 'motion-v'

const { t } = useI18n()
const head = useLocaleHead({ seo: true })

useHead(() => ({
  htmlAttrs: { lang: head.value.htmlAttrs.lang },
  link: head.value.link,
  meta: head.value.meta,
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
