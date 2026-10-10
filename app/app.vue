<script setup lang="ts">
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
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
