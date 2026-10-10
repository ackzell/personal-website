<script setup lang="ts">
import { socialLinks } from '~/config/nav'
</script>

<template>
  <footer class="site-footer">
    <ul class="site-footer__links">
      <li v-for="link in socialLinks" :key="link.href">
        <a :href="link.href" rel="me noopener">{{ link.label }}</a>
      </li>
    </ul>
  </footer>
</template>
