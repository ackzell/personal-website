<script setup lang="ts">
import type { NuxtError } from '#app'

const { error } = defineProps<{ error: NuxtError }>()

useSeoMeta({ title: () => String(error.statusCode), robots: 'noindex' })
</script>

<template>
  <NuxtLayout>
    <div class="page">
      <ErrorSolitaire v-if="error.statusCode === 404" />
      <template v-else>
        <h1 track="wide" class="text-headword">{{ error.statusCode }}</h1>
        <p track="wide">
          <NuxtLinkLocale to="/">{{ $t('site.name') }}</NuxtLinkLocale>
        </p>
      </template>
    </div>
  </NuxtLayout>
</template>
