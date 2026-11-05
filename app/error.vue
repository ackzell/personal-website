<script setup lang="ts">
import type { NuxtError } from '#app'

const { error } = defineProps<{ error: NuxtError }>()

useSeoMeta({ title: () => String(error.statusCode), robots: 'noindex' })
</script>

<template>
  <NuxtLayout>
    <div class="page">
      <h1 track="wide" class="text-headword">{{ error.statusCode }}</h1>
      <p track="wide">
        <NuxtLinkLocale to="/">{{ $t('site.name') }}</NuxtLinkLocale>
      </p>
    </div>
  </NuxtLayout>
</template>
