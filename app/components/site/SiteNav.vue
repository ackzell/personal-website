<script setup lang="ts">
import { mainNav } from '~/config/nav'

const route = useRoute()
const localePath = useLocalePath()
const section = useSection()
const open = ref(false)

watch(() => route.fullPath, () => (open.value = false))

const stripSlash = (path: string) => (path.length > 1 ? path.replace(/\/$/, '') : path)

/**
 * "page" on the item's own page, "true" anywhere else in its section
 * (e.g. a project detail page, or /videos under Media).
 */
function ariaCurrent(item: (typeof mainNav)[number]) {
  if (stripSlash(route.path) === stripSlash(localePath(item.to))) return 'page'
  if (section.value === item.section) return 'true'
  return undefined
}
</script>

<template>
  <nav ml="auto" :aria-label="$t('nav.label')">
    <button
      type="button"
      class="hidden" max-sm="block"
      aria-controls="site-nav-list"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ $t('nav.menu') }}
    </button>
    <ul
      id="site-nav-list"
      flex gap="5" p="0" list="none"
      max-sm="hidden flex-col gap-tight pt-3"
      class="max-sm:data-[open=true]:flex"
      :data-open="open"
    >
      <li v-for="item in mainNav" :key="item.key">
        <NuxtLinkLocale
          :to="item.to"
          :aria-current="ariaCurrent(item)"
          text="muted current:fg"
          decoration="none current:underline"
          underline-offset="[0.3em]"
        >
          {{ $t(`nav.${item.key}`) }}
        </NuxtLinkLocale>
      </li>
    </ul>
  </nav>
</template>
