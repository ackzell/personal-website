<script setup lang="ts">
/*
 * The header's other attribute, beside lang="en": sound="on" or "off". On
 * unless switched off, and quiet when on (utils/sounds.ts); each press flips
 * it and keeps it. Turning it on is heard, and so is turning it off, as the
 * last sound until it's back.
 */
const on = ref(true)
// Read after mount: the server can't know, so the value stays hidden till then.
const mounted = useMounted()
onMounted(() => (on.value = soundIsOn()))

function toggle() {
  const next = !on.value
  if (next) setSoundOn(true)
  sound(next ? 'on' : 'off')
  // Muted once `off` has played out (two beeps, the last ending by 0.2s).
  if (!next) setSoundOn(false, 300)
  on.value = next
}
</script>

<template>
  <!-- The quotes are decoration; the button reads as sound, pressed or not. -->
  <div class="sound-switch">
    <span aria-hidden="true">sound="</span>
    <button type="button" class="sound-switch__value" :aria-pressed="on" :title="$t('site.sound')" @click="toggle">
      <span class="sr-only">{{ $t('site.sound') }}</span>
      <SiteScrambleText :text="on ? 'on' : 'off'" :style="{ visibility: mounted ? undefined : 'hidden' }"
        aria-hidden="true" />
    </button>
    <span aria-hidden="true">"</span>
  </div>
</template>

<style scoped>
/* The locale switch's twin, so the two read as one row of settings. */
.sound-switch {
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

.sound-switch:is(:active, :has(:focus-visible)) {
  opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .sound-switch:hover {
    opacity: 1;
  }
}

.sound-switch__value {
  padding: var(--space-1) 0.15em;
  border: 0;
  background: none;
  font: inherit;
  font-variation-settings: inherit;
  color: var(--fg);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 0.3em;
  transition: text-decoration-color 150ms ease;
}

.sound-switch__value:is(:hover, :focus-visible) {
  text-decoration-color: currentColor;
}
</style>
