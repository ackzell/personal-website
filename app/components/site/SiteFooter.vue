<script setup lang="ts">
import { socialLinks } from '~/config/nav'
</script>

<template>
  <footer px="track-wide" py="6" border="none">
    <!-- Icon-only links: the name lives in aria-label (screen readers) and
         title (hover). No gap: each link's padding is the spacing, so the
         30px touch targets (WCAG 2.2 asks for 24px) sit edge to edge while
         the icons stay 12px apart. The negative margin keeps them aligned. -->
    <ul flex="~ wrap" p="0" m="-1.5" list="none">
      <li v-for="link in socialLinks" :key="link.href">
        <a
          :href="link.href"
          rel="me noopener"
          :aria-label="link.label"
          :title="link.label"
          class="text-lg"
          inline-flex
          p="1.5"
        >
          <span :class="link.icon" aria-hidden="true" />
        </a>
      </li>
    </ul>
  </footer>
</template>
