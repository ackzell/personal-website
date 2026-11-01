<script setup lang="ts">
/*
 * The switch as the attribute it sets: lang="en", one language at a time.
 * The value is a link to the next language; on the switch it decodes into
 * the new one with the rest of the page (plugins/locale-scramble.client.ts).
 */
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const next = computed(() => {
  const i = locales.value.findIndex((item) => item.code === locale.value)
  return locales.value[(i + 1) % locales.value.length]!
})
</script>

<template>
  <!-- The quotes are decoration; the link reads as the language it switches
       to, in that language. -->
  <div class="locale-switch">
    <span aria-hidden="true">lang="</span>
    <NuxtLink class="locale-switch__value" :to="switchLocalePath(next.code)" :lang="next.language"
      :hreflang="next.language" :title="next.name" @click="haptic('language')">
      <span class="sr-only">{{ next.name }}</span>
      <span aria-hidden="true">{{ locale }}</span>
    </NuxtLink>
    <span aria-hidden="true">"</span>
  </div>
</template>

<style scoped>
.locale-switch {
  display: flex;
  align-items: baseline;
  font-family: var(--font-code);
  font-weight: var(--code-weight);
  font-variation-settings: 'CASL' 0;
  font-size: 0.75rem;
  color: var(--muted);
  opacity: 0.65;
  transition: opacity 200ms var(--ease-out);
}

/* Held back like the stops beside a page, until reached for. */
.locale-switch:is(:active, :has(:focus-visible)) {
  opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .locale-switch:hover {
    opacity: 1;
  }
}

.locale-switch__value {
  padding: var(--space-1) 0.15em;
  color: var(--fg);
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 0.3em;
  transition: text-decoration-color 150ms ease;
}

/* The value is the control: hover or focus underlines it. */
.locale-switch__value:is(:hover, :focus-visible) {
  text-decoration-color: currentColor;
}
</style>
