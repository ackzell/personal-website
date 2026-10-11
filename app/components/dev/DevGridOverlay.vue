<script setup lang="ts">
// Dev-only: Ctrl+G toggles an overlay of the layout tracks (full, wide,
// content) so compositions can be checked against the grid.
const visible = ref(false)

function onKey(event: KeyboardEvent) {
  if (event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'g') {
    event.preventDefault()
    visible.value = !visible.value
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="visible" class="dev-grid page" aria-hidden="true">
    <div class="dev-grid__wide" />
    <div class="dev-grid__content" />
  </div>
</template>

<style scoped>
/* Reuses .page for the exact same tracks; only the visuals live here. */
.dev-grid {
  position: fixed;
  inset: 0;
  z-index: 9999;
  padding: 0;
  pointer-events: none;
  /* .page packs rows to content; the empty track markers need the full height. */
  grid-template-rows: 1fr;
  align-content: stretch;
}
.dev-grid > div {
  grid-row: 1;
  margin: 0;
}
.dev-grid__wide {
  grid-column: wide;
  border-inline: 1px dashed color-mix(in srgb, var(--accent) 70%, transparent);
}
.dev-grid__content {
  grid-column: content;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border-inline: 1px solid color-mix(in srgb, var(--accent) 80%, transparent);
}
</style>
