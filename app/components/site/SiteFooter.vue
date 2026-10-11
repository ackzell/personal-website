<script setup lang="ts">
import { socialLinks } from '~/config/nav'
</script>

<template>
  <footer px="track-wide" py="6" border="t solid line">
    <ul flex="~ wrap" gap="y-tight x-group" p="0" list="none">
      <li v-for="link in socialLinks" :key="link.href">
        <a :href="link.href" rel="me noopener" inline-flex items="center" gap="tight">
          <span :class="link.icon" aria-hidden="true" />
          {{ link.label }}
        </a>
      </li>
    </ul>
  </footer>
</template>
