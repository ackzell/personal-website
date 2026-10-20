<script setup lang="ts">
import { socialLinks } from '~/config/nav'

/*
 * Sticky at the bottom, like the header at the top. Its height is published
 * as --footer-height so scroll-padding-bottom (main.css) keeps focused
 * content from landing under it. On small screens it becomes a rail on the
 * inline-end edge instead (main.css).
 */
usePublishedHeight(useTemplateRef<HTMLElement>('footer'), '--footer-height')
</script>

<template>
  <!-- The stage color behind it, so the page scrolls under, not through. -->
  <footer ref="footer" class="site-footer" sticky bottom="0" z="10" bg="bg" px="track-wide" py="6" border="none">
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
    <SiteMarkLayer clipped />
