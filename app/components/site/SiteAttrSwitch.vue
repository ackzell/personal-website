<script setup lang="ts">
/*
 * A setting shown as the attribute it sets: name="value". The slot is the
 * value, a button or a link; the name and quotes are decoration. The sound,
 * locale and scheme switches share it, so they read as one row of settings.
 */
defineProps<{ name: string }>()
</script>

<template>
  <div class="attr-switch" flex items="baseline" typeset="code" text="[0.75rem] muted">
    <span class="attr-switch__quote" aria-hidden="true">{{ name }}="</span>
    <slot />
    <span class="attr-switch__quote" aria-hidden="true">"</span>
  </div>
</template>

<style scoped>
/* Held back like the stops beside a page, until reached for. The text only:
   on phones the scheme switch stands on its own patch of stage, which stays solid. */
.attr-switch__quote,
:slotted(:is(button, a)) {
  opacity: 0.65;
  transition: opacity 200ms var(--ease-out), text-decoration-color 150ms ease;
}

.attr-switch:is(:active, :has(:focus-visible)) .attr-switch__quote,
.attr-switch:is(:active, :has(:focus-visible)) :slotted(:is(button, a)) {
  opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .attr-switch:hover .attr-switch__quote,
  .attr-switch:hover :slotted(:is(button, a)) {
    opacity: 1;
  }
}

/* Styled here, not by each switch: the value is slotted, a button or a link. */
:slotted(:is(button, a)) {
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
}

/* The value is the control: hover or focus underlines it. */
:slotted(:is(button, a):hover),
:slotted(:is(button, a):focus-visible) {
  text-decoration-color: currentColor;
}
</style>
