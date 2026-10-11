<script setup lang="ts">
import { socialLinks } from '~/config/nav'
</script>

<template>
  <footer class="site-footer">
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
