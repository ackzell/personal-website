<script setup lang="ts">
import { mainNav } from '~/config/nav'

const route = useRoute()
const localePath = useLocalePath()
const open = ref(false)

watch(() => route.fullPath, () => (open.value = false))

const stripSlash = (path: string) => (path.length > 1 ? path.replace(/\/$/, '') : path)

/** "page" on the item's own page, "true" anywhere below it (e.g. a project detail page). */
function ariaCurrent(to: string) {
  const target = stripSlash(localePath(to))
  const current = stripSlash(route.path)
  if (current === target) return 'page'
  if (current.startsWith(`${target}/`)) return 'true'
  return undefined
}
</script>

<template>
  <nav class="site-nav" :aria-label="$t('nav.label')">
    <button
      type="button"
      class="site-nav__toggle"
      aria-controls="site-nav-list"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ $t('nav.menu') }}
    </button>
    <ul id="site-nav-list" class="site-nav__list" :data-open="open">
      <li v-for="item in mainNav" :key="item.key">
        <NuxtLinkLocale :to="item.to" :aria-current="ariaCurrent(item.to)">
          {{ $t(`nav.${item.key}`) }}
        </NuxtLinkLocale>
      </li>
    </ul>
  </nav>
</template>
